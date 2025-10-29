import { NextRequest, NextResponse } from 'next/server';
import { PolyRouterClient } from '@/lib/api/polyrouter-client';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizePriceHistory } from '@/lib/data/normalizer';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting price history sync...');
    
    const polyRouterClient = new PolyRouterClient(process.env.POLYROUTER_API_KEY || '');
    
    // Get active markets from database
    const { data: markets, error: marketsError } = await supabaseAdmin
      .from('markets')
      .select('id, market_id, platform')
      .eq('status', 'open')
      .limit(50); // Process in batches

    if (marketsError) {
      throw new Error(`Failed to fetch markets: ${marketsError.message}`);
    }

    if (!markets || markets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active markets to sync',
        results: { marketsProcessed: 0, pricePointsAdded: 0 },
      });
    }

    let totalPricePoints = 0;
    const results = [];

    // Process markets in batches to avoid rate limits
    for (const market of markets) {
      try {
        console.log(`Syncing price history for market ${market.market_id}...`);
        
        // Get current outcomes for this market
        const { data: outcomes, error: outcomesError } = await supabaseAdmin
          .from('outcomes')
          .select('outcome_label')
          .eq('market_id', market.id);

        if (outcomesError || !outcomes || outcomes.length === 0) {
          console.log(`No outcomes found for market ${market.market_id}`);
          continue;
        }

        // Fetch price history for each outcome
        for (const outcome of outcomes) {
          try {
            const priceHistory = await polyRouterClient.getPriceHistory(
              [market.market_id],
              '1h',
              24 // Last 24 hours
            );

            if (priceHistory.data && priceHistory.data.length > 0) {
              // Normalize price history data
              const normalizedHistory = normalizePriceHistory(
                priceHistory.data,
                market.id,
                outcome.outcome_label,
                '1h'
              );

              // Insert price history (upsert to avoid duplicates)
              for (const pricePoint of normalizedHistory) {
                const { error: insertError } = await supabaseAdmin
                  .from('price_history')
                  .upsert({
                    market_id: market.id,
                    outcome_label: pricePoint.outcome_label,
                    price: pricePoint.price,
                    timestamp: pricePoint.timestamp.toISOString(),
                    interval: pricePoint.interval,
                    volume: pricePoint.volume,
                  }, {
                    onConflict: 'market_id,outcome_label,timestamp,interval'
                  });

                if (insertError) {
                  console.error(`Error inserting price history:`, insertError);
                } else {
                  totalPricePoints++;
                }
              }
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (outcomeError) {
            console.error(`Error syncing price history for outcome ${outcome.outcome_label}:`, outcomeError);
          }
        }

        results.push({
          market_id: market.market_id,
          outcomes: outcomes.length,
          status: 'success'
        });

        // Delay between markets to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (marketError) {
        console.error(`Error processing market ${market.market_id}:`, marketError);
        results.push({
          market_id: market.market_id,
          status: 'error',
          error: marketError instanceof Error ? marketError.message : 'Unknown error'
        });
      }
    }

    // Clean up old price history data (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error: cleanupError } = await supabaseAdmin
      .from('price_history')
      .delete()
      .lt('timestamp', thirtyDaysAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old price history:', cleanupError);
    }

    console.log('Price history sync completed:', {
      marketsProcessed: markets.length,
      pricePointsAdded: totalPricePoints,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Price history sync completed',
      results: {
        marketsProcessed: markets.length,
        pricePointsAdded: totalPricePoints,
        details: results,
      },
    });
  } catch (error) {
    console.error('Price history sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Price history sync failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
