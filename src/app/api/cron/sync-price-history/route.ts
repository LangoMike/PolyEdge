import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Autonomous price history collection job
 * Runs every 5 minutes to capture current market prices
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Price History Sync] Starting autonomous collection...');
    
    // Get active markets with outcomes
    const { data: markets, error: marketsError } = await supabaseAdmin
      .from('markets')
      .select(`
        id,
        market_id,
        platform,
        outcomes (
          outcome_label,
          current_price,
          previous_price
        )
      `)
      .eq('status', 'open');

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
    const now = new Date();
    const timestamp = now.toISOString();
    const results = [];

    // Process markets in batches
    for (const market of markets) {
      try {
        const outcomes = market.outcomes as any[];
        
        if (!outcomes || outcomes.length === 0) {
          continue;
        }

        // Create price snapshot for current timestamp (5-minute intervals)
        for (const outcome of outcomes) {
          const { error: insertError } = await supabaseAdmin
            .from('price_history')
            .upsert({
              market_id: market.id,
              outcome_label: outcome.outcome_label,
              price: outcome.current_price,
              timestamp: timestamp,
              interval: '5m', // 5-minute interval
              volume: 0, // Volume tracked separately
            }, {
              onConflict: 'market_id,outcome_label,timestamp,interval',
              ignoreDuplicates: false
            });

          if (insertError) {
            console.error(`Error inserting price history for market ${market.market_id}:`, insertError);
          } else {
            totalPricePoints++;
          }
        }

        results.push({
          market_id: market.market_id,
          outcomes: outcomes.length,
          status: 'success'
        });
      } catch (marketError) {
        console.error(`Error processing market ${market.market_id}:`, marketError);
        results.push({
          market_id: market.market_id,
          status: 'error',
          error: marketError instanceof Error ? marketError.message : 'Unknown error'
        });
      }
    }

    // Clean up old price history data (keep last 90 days for training)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { error: cleanupError } = await supabaseAdmin
      .from('price_history')
      .delete()
      .lt('timestamp', ninetyDaysAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old price history:', cleanupError);
    } else {
      console.log(`[Price History Sync] Cleaned up data older than 90 days`);
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
