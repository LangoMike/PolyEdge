import { supabaseAdmin } from '@/lib/supabase';
import { Market, TopPick, MarketMetrics } from '@/types';
import { calculateMarketMetrics, calculateValueScore, calculateConfidenceScore } from './metrics';

// Top picks generation configuration
const TOP_PICKS_CONFIG = {
  maxPicks: 20,
  minVolume: 1000, // Minimum 24h volume
  minLiquidity: 0.3, // Minimum liquidity score
  minConfidence: 60, // Minimum confidence score
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Generate top picks for prediction markets
export async function generateTopPicks(): Promise<{
  success: boolean;
  picksGenerated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let picksGenerated = 0;

  try {
    console.log('Starting top picks generation...');

    // Get active markets with sufficient volume and liquidity
    const { data: markets, error: marketsError } = await supabaseAdmin
      .from('markets')
      .select(`
        *,
        outcomes (*)
      `)
      .eq('status', 'open')
      .gte('volume_24h', TOP_PICKS_CONFIG.minVolume)
      .order('volume_24h', { ascending: false })
      .limit(100);

    if (marketsError) {
      throw new Error(`Failed to fetch markets: ${marketsError.message}`);
    }

    if (!markets || markets.length === 0) {
      console.log('No eligible markets found for top picks');
      return { success: true, picksGenerated: 0, errors: [] };
    }

    // Get price history for markets
    const marketIds = markets.map(m => m.id);
    const { data: priceHistory, error: historyError } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .in('market_id', marketIds)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('timestamp', { ascending: true });

    if (historyError) {
      console.error('Error fetching price history:', historyError);
      // Continue without price history
    }

    // Calculate metrics and score each market
    const scoredMarkets = markets.map(market => {
      const outcomes = market.outcomes || [];
      const marketHistory = priceHistory?.filter(ph => ph.market_id === market.id) || [];
      
      const metrics = calculateMarketMetrics(market, outcomes, marketHistory);
      const valueScore = calculateValueScore(metrics);
      const confidenceScore = calculateConfidenceScore(metrics);

      return {
        market,
        metrics,
        valueScore,
        confidenceScore,
        totalScore: (valueScore * 0.6) + (confidenceScore * 0.4), // Weighted combination
      };
    });

    // Filter and sort by total score
    const eligibleMarkets = scoredMarkets
      .filter(sm => 
        sm.metrics.liquidity_score >= TOP_PICKS_CONFIG.minLiquidity &&
        sm.confidenceScore >= TOP_PICKS_CONFIG.minConfidence
      )
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, TOP_PICKS_CONFIG.maxPicks);

    console.log(`Found ${eligibleMarkets.length} eligible markets for top picks`);

    // Clear existing top picks
    const { error: deleteError } = await supabaseAdmin
      .from('top_picks')
      .delete()
      .lt('created_at', new Date().toISOString());

    if (deleteError) {
      console.error('Error clearing old top picks:', deleteError);
      errors.push(`Failed to clear old picks: ${deleteError.message}`);
    }

    // Generate top picks
    for (const { market, metrics, valueScore, confidenceScore } of eligibleMarkets) {
      try {
        const recommendation = determineRecommendation(metrics, valueScore);
        const reasoning = generateReasoning(market, metrics, valueScore);

        const { error: insertError } = await supabaseAdmin
          .from('top_picks')
          .insert({
            market_id: market.id,
            recommendation,
            confidence_score: confidenceScore,
            reasoning,
            value_score: valueScore,
            expires_at: new Date(Date.now() + TOP_PICKS_CONFIG.maxAge).toISOString(),
          });

        if (insertError) {
          console.error(`Error inserting top pick for market ${market.market_id}:`, insertError);
          errors.push(`Failed to create pick for ${market.title}: ${insertError.message}`);
        } else {
          picksGenerated++;
        }
      } catch (pickError) {
        console.error(`Error processing market ${market.market_id}:`, pickError);
        errors.push(`Failed to process ${market.title}: ${pickError instanceof Error ? pickError.message : 'Unknown error'}`);
      }
    }

    console.log(`Generated ${picksGenerated} top picks`);
    
    return {
      success: true,
      picksGenerated,
      errors,
    };
  } catch (error) {
    console.error('Top picks generation failed:', error);
    return {
      success: false,
      picksGenerated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

// Determine recommendation type based on metrics
function determineRecommendation(metrics: MarketMetrics, valueScore: number): 'buy' | 'sell' | 'watch' {
  // High value score with positive movement = buy
  if (valueScore > 70 && metrics.probability_movement_24h > 0.05) {
    return 'buy';
  }

  // High value score with negative movement = sell
  if (valueScore > 70 && metrics.probability_movement_24h < -0.05) {
    return 'sell';
  }

  // Sharp movement = watch
  if (metrics.sharp_movement) {
    return 'watch';
  }

  // Arbitrage opportunity = buy
  if (metrics.arbitrage_opportunity) {
    return 'buy';
  }

  // Default to watch for high-value picks
  return valueScore > 60 ? 'watch' : 'watch';
}

// Generate reasoning for the pick
function generateReasoning(market: Market, metrics: MarketMetrics, valueScore: number): string {
  const reasons: string[] = [];

  // Volume and liquidity
  if (metrics.liquidity_score > 0.8) {
    reasons.push('High liquidity provides good trading opportunities');
  }

  // Price movement
  if (Math.abs(metrics.probability_movement_24h) > 0.1) {
    const direction = metrics.probability_movement_24h > 0 ? 'increased' : 'decreased';
    reasons.push(`Probability has ${direction} significantly in the last 24 hours`);
  }

  // Arbitrage opportunity
  if (metrics.arbitrage_opportunity) {
    reasons.push('Arbitrage opportunity detected across platforms');
  }

  // Sharp movement
  if (metrics.sharp_movement) {
    reasons.push('Recent sharp price movement indicates high activity');
  }

  // Volume velocity
  if (metrics.volume_velocity > 0.5) {
    reasons.push('Increasing trading volume suggests growing interest');
  }

  // Platform-specific insights
  if (market.platform === 'polymarket') {
    reasons.push('Polymarket provides deep liquidity and active trading');
  } else if (market.platform === 'kalshi') {
    reasons.push('Kalshi offers regulated, reliable market data');
  }

  // Default reasoning if no specific reasons
  if (reasons.length === 0) {
    reasons.push(`Strong value score of ${Math.round(valueScore)} based on market analysis`);
  }

  return reasons.join('. ') + '.';
}

// Get current top picks
export async function getTopPicks(limit: number = 10): Promise<TopPick[]> {
  try {
    const { data: picks, error } = await supabaseAdmin
      .from('top_picks')
      .select(`
        *,
        market:markets (*)
      `)
      .gte('expires_at', new Date().toISOString())
      .order('value_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top picks:', error);
      return [];
    }

    return picks || [];
  } catch (error) {
    console.error('Error fetching top picks:', error);
    return [];
  }
}

// Get top picks by category
export async function getTopPicksByCategory(category: string, limit: number = 10): Promise<TopPick[]> {
  try {
    const { data: picks, error } = await supabaseAdmin
      .from('top_picks')
      .select(`
        *,
        market:markets (*)
      `)
      .eq('market.category', category)
      .gte('expires_at', new Date().toISOString())
      .order('value_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top picks by category:', error);
      return [];
    }

    return picks || [];
  } catch (error) {
    console.error('Error fetching top picks by category:', error);
    return [];
  }
}

// Get top picks by platform
export async function getTopPicksByPlatform(platform: string, limit: number = 10): Promise<TopPick[]> {
  try {
    const { data: picks, error } = await supabaseAdmin
      .from('top_picks')
      .select(`
        *,
        market:markets (*)
      `)
      .eq('market.platform', platform)
      .gte('expires_at', new Date().toISOString())
      .order('value_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top picks by platform:', error);
      return [];
    }

    return picks || [];
  } catch (error) {
    console.error('Error fetching top picks by platform:', error);
    return [];
  }
}
