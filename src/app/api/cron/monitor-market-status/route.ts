import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PolyRouterClient } from '@/lib/api/polyrouter-client';

/**
 * Market status monitoring job
 * Checks for closed/resolved markets and updates their status
 * Runs every hour
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Market Monitor] Starting status check...');
    
    const polyRouterClient = new PolyRouterClient(process.env.POLYROUTER_API_KEY || '');
    
    // Get all open markets
    const { data: openMarkets, error: marketsError } = await supabaseAdmin
      .from('markets')
      .select('id, market_id, platform, resolution_time')
      .eq('status', 'open');

    if (marketsError) {
      throw new Error(`Failed to fetch open markets: ${marketsError.message}`);
    }

    if (!openMarkets || openMarkets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No open markets to monitor',
        results: { marketsChecked: 0, marketsClosed: 0 },
      });
    }

    let marketsChecked = 0;
    let marketsClosed = 0;
    let errors = 0;

    // Check each market's status
    for (const market of openMarkets) {
      try {
        marketsChecked++;

        // Check if market should be closed based on resolution_time
        if (market.resolution_time) {
          const resolutionDate = new Date(market.resolution_time);
          const now = new Date();
          
          // If resolution time has passed, mark market as closed
          if (resolutionDate <= now) {
            const { error: updateError } = await supabaseAdmin
              .from('markets')
              .update({ 
                status: 'closed',
                updated_at: now.toISOString()
              })
              .eq('id', market.id);

            if (updateError) {
              console.error(`Error closing market ${market.market_id}:`, updateError);
              errors++;
            } else {
              console.log(`Market ${market.market_id} closed - resolution time passed`);
              marketsClosed++;
            }
            continue;
          }
        }

        // Query API for current market status (optional - only if resolution_time not available)
        // Note: This requires API support for checking market status
        
        // Delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (marketError) {
        console.error(`Error checking market ${market.market_id}:`, marketError);
        errors++;
      }
    }

    console.log('[Market Monitor] Status check completed:', {
      marketsChecked,
      marketsClosed,
      errors,
    });

    return NextResponse.json({
      success: true,
      message: 'Market status monitoring completed',
      results: {
        marketsChecked,
        marketsClosed,
        errors,
      },
    });
  } catch (error) {
    console.error('[Market Monitor] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Market status monitoring failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




