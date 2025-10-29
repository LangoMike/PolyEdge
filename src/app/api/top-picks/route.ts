import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
        market:markets (*)
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

    // Execute query
    const { data: picks, error } = await query;

    if (error) {
      console.error('Error fetching top picks:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: picks || [],
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
