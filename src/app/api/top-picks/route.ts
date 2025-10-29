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
    const sortBy = searchParams.get('sortBy') || 'value'; // value, probability, trending, confidence

    // Build query
    let query = supabase
      .from('top_picks')
      .select(`
        *,
        market:markets (*, outcomes (*))
      `)
      .gte('expires_at', new Date().toISOString())
      .limit(limit);

    // Apply sorting
    switch (sortBy) {
      case 'value':
        query = query.order('value_score', { ascending: false });
        break;
      case 'probability':
        query = query.order('confidence_score', { ascending: false });
        break;
      case 'trending':
        // Sort by creation time (most recent first)
        query = query.order('created_at', { ascending: false });
        break;
      case 'confidence':
        // Sort by confidence score
        query = query.order('confidence_score', { ascending: false });
        break;
      default:
        query = query.order('value_score', { ascending: false });
    }

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

    // Add computed fields for UI
    const enrichedData = (picks || []).map(pick => ({
      ...pick,
      // Add edge percentage for display
      edge_percentage: pick.value_score,
      // Add probability percentage
      probability_percentage: pick.confidence_score,
      // Add confidence level
      confidence_level: pick.confidence_score >= 70 ? 'HIGH' : pick.confidence_score >= 55 ? 'MED' : 'LOW',
      // Add freshness (time since creation)
      freshness_minutes: Math.floor((Date.now() - new Date(pick.created_at).getTime()) / (1000 * 60)),
    }));

    const payload = {
      success: true,
      data: enrichedData,
      meta: {
        sortBy,
        total: enrichedData.length,
        filters: { platform, category },
      }
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
