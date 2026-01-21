import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiCache } from '@/lib/cache/lru';

export async function GET(request: NextRequest) {
  try {
    // Cache key
    const cacheKey = 'stats:dashboard';
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Fetch statistics in parallel
    const [
      totalMarketsResult,
      totalVolumeResult,
      activePicksResult,
      topMoversResult,
    ] = await Promise.all([
      // Total markets
      supabaseAdmin
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),
      
      // Total volume (sum of all 24h volumes)
      supabaseAdmin
        .from('markets')
        .select('volume_24h')
        .eq('status', 'open'),
      
      // Active picks (non-expired)
      supabaseAdmin
        .from('top_picks')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', new Date().toISOString()),
      
      // Top movers (markets with significant price changes)
      supabaseAdmin
        .from('outcomes')
        .select('price_change_24h, market_id')
        .not('price_change_24h', 'is', null),
    ]);

    // Calculate total volume
    const totalVolume = totalVolumeResult.data?.reduce((sum, market) => {
      return sum + (market.volume_24h || 0);
    }, 0) || 0;

    // Count top movers (significant price changes > 5%)
    const topMovers = topMoversResult.data?.filter(
      outcome => Math.abs(outcome.price_change_24h || 0) > 0.05
    ).length || 0;

    const stats = {
      totalMarkets: totalMarketsResult.count || 0,
      totalVolume,
      topMovers,
      activePicks: activePicksResult.count || 0,
    };

    const payload = {
      success: true,
      data: stats,
    };

    // Cache for 1 minute
    apiCache.set(cacheKey, payload, 60_000);

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





