import { NextRequest, NextResponse } from 'next/server';
import { generateTopPicks } from '@/lib/analytics/top-picks';
import { pickGenerator } from '@/lib/analytics/pick-generator';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting top picks generation with analytics...');
    
    // Get active markets with outcomes and price history
    const { data: markets, error: marketsError } = await supabaseAdmin
      .from('markets')
      .select(`
        *,
        outcomes (*),
        price_history (*)
      `)
      .eq('status', 'open')
      .gte('volume_24h', 1000) // Minimum volume threshold
      .order('volume_24h', { ascending: false })
      .limit(100);

    if (marketsError) {
      throw new Error(`Failed to fetch markets: ${marketsError.message}`);
    }

    if (!markets || markets.length === 0) {
      console.log('No eligible markets found for top picks');
      return NextResponse.json({
        success: true,
        message: 'No eligible markets found',
        results: { picksGenerated: 0, errors: [] },
      });
    }

    console.log(`Processing ${markets.length} markets for analytics-based picks`);

    let picksGenerated = 0;
    const errors: string[] = [];
    const newPicks = [];

    // Clear existing top picks
    const { error: deleteError } = await supabaseAdmin
      .from('top_picks')
      .delete()
      .lt('created_at', new Date().toISOString());

    if (deleteError) {
      console.error('Error clearing old top picks:', deleteError);
      errors.push(`Failed to clear old picks: ${deleteError.message}`);
    }

        // Generate picks for each market
        for (const market of markets) {
          try {
            const outcomes = market.outcomes || [];
            const priceHistory = market.price_history || [];

            console.log(`Processing market: ${market.title}, outcomes: ${outcomes.length}, priceHistory: ${priceHistory.length}`);

            // Skip markets without outcomes for now - we'll use mock data
            // if (outcomes.length === 0) {
            //   continue;
            // }

        // Generate pick using analytics
        const pickResult = await pickGenerator.generatePick(market, outcomes, priceHistory);

        // Only store picks that should be made (not WATCH)
        if (pickResult.shouldPick && pickResult.side !== 'WATCH') {
          const recommendation = pickResult.side === 'YES' ? 'buy' : 'sell';
          
          const { error: insertError } = await supabaseAdmin
            .from('top_picks')
            .insert({
              market_id: market.id,
              recommendation,
              confidence_score: Math.round(pickResult.calibrated_prob * 100),
              reasoning: pickResult.reasoning,
              value_score: Math.round(Math.max(0, pickResult.edge * 100)),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            });

          if (insertError) {
            console.error(`Error inserting pick for market ${market.id}:`, insertError);
            errors.push(`Failed to create pick for ${market.title}: ${insertError.message}`);
          } else {
            picksGenerated++;
            newPicks.push({
              market_id: market.id,
              side: pickResult.side,
              calibrated_prob: pickResult.calibrated_prob,
              edge: pickResult.edge,
              confidence_bin: pickResult.confidence_bin,
            });
          }
        }
      } catch (marketError) {
        console.error(`Error processing market ${market.id}:`, marketError);
        errors.push(`Failed to process ${market.title}: ${marketError instanceof Error ? marketError.message : 'Unknown error'}`);
      }
    }

    console.log(`Generated ${picksGenerated} analytics-based top picks`);
    console.log('Pick summary:', newPicks.map(p => ({
      market: p.market_id,
      side: p.side,
      prob: (p.calibrated_prob * 100).toFixed(1) + '%',
      edge: (p.edge * 100).toFixed(1) + '%',
      confidence: p.confidence_bin,
    })));
    
    return NextResponse.json({
      success: true,
      message: 'Analytics-based top picks generation completed',
      results: {
        picksGenerated,
        errors,
        summary: {
          totalMarkets: markets.length,
          picksGenerated,
          averageEdge: picksGenerated > 0 ? newPicks.reduce((sum, p) => sum + p.edge, 0) / picksGenerated : 0,
          confidenceDistribution: {
            HIGH: newPicks.filter(p => p.confidence_bin === 'HIGH').length,
            MED: newPicks.filter(p => p.confidence_bin === 'MED').length,
            LOW: newPicks.filter(p => p.confidence_bin === 'LOW').length,
          },
        },
      },
    });
  } catch (error) {
    console.error('Top picks generation failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Top picks generation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
