import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiCache } from '@/lib/cache/lru';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const category = searchParams.get('category') || '';
    const platform = searchParams.get('platform') || '';

    // Build query
    let query = supabase
      .from('top_picks')
      .select(`
        *,
        market:markets (*, outcomes (*))
      `)
      .gte('expires_at', new Date().toISOString())
      .order('value_score', { ascending: false })
      .limit(limit);

    // Apply filters
    if (category) {
      query = query.eq('market.category', category);
    }
    
    if (platform) {
      query = query.eq('market.platform', platform);
    }

    // Cache key based on query
    const cacheKey = `top-picks:${searchParams.toString()}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15, s-maxage=15, stale-while-revalidate=60',
        },
      });
    }

    // Execute query
    const { data: picks, error } = await query;

    if (error) {
      console.error('Error fetching top picks:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const payload = {
      success: true,
      data: picks || [],
    };

    apiCache.set(cacheKey, payload, 15_000);

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15, s-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Top picks API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
