import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Monitoring endpoint for data collection health
 * Shows statistics about historical data collection
 */
export async function GET(request: NextRequest) {
  try {
    // Get total markets
    const { count: totalMarkets } = await supabaseAdmin
      .from('markets')
      .select('*', { count: 'exact', head: true });

    // Get active markets
    const { count: activeMarkets } = await supabaseAdmin
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get closed markets
    const { count: closedMarkets } = await supabaseAdmin
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed');

    // Get total price history entries
    const { count: totalHistoryEntries } = await supabaseAdmin
      .from('price_history')
      .select('*', { count: 'exact', head: true });

    // Get price history from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentHistoryEntries } = await supabaseAdmin
      .from('price_history')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', twentyFourHoursAgo);

    // Get price history from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weeklyHistoryEntries } = await supabaseAdmin
      .from('price_history')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', sevenDaysAgo);

    // Get oldest and newest price history entries
    const { data: oldestEntry } = await supabaseAdmin
      .from('price_history')
      .select('timestamp')
      .order('timestamp', { ascending: true })
      .limit(1)
      .single();

    const { data: newestEntry } = await supabaseAdmin
      .from('price_history')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Calculate data collection rate (entries per day)
    const dataCollectionRate = weeklyHistoryEntries ? (weeklyHistoryEntries / 7) : 0;

    // Calculate data completeness (how many markets have recent history)
    // Get all unique markets that have price history in the last 24 hours
    const { data: marketsWithHistory } = await supabaseAdmin
      .from('price_history')
      .select('market_id')
      .gte('timestamp', twentyFourHoursAgo);
    
    const uniqueMarketsWithHistory = new Set(marketsWithHistory?.map(m => m.market_id) || []).size;
    
    const completeness = activeMarkets ? ((uniqueMarketsWithHistory / activeMarkets) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        markets: {
          total: totalMarkets || 0,
          active: activeMarkets || 0,
          closed: closedMarkets || 0,
        },
        priceHistory: {
          total: totalHistoryEntries || 0,
          last24Hours: recentHistoryEntries || 0,
          last7Days: weeklyHistoryEntries || 0,
          oldestEntry: oldestEntry?.timestamp || null,
          newestEntry: newestEntry?.timestamp || null,
          dataCollectionRate: Math.round(dataCollectionRate),
        },
        health: {
          completeness: Math.round(completeness * 100) / 100,
          status: completeness > 80 ? 'healthy' : completeness > 50 ? 'degraded' : 'poor',
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Monitoring] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
