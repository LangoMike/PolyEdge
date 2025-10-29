import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FilterOptions, PaginationOptions } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const platforms = searchParams.get('platforms')?.split(',') || [];
    const categories = searchParams.get('categories')?.split(',') || [];
    const status = searchParams.get('status')?.split(',') || ['open'];
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'volume_24h';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build query
    let query = supabase
      .from('markets')
      .select(`
        *,
        outcomes (*)
      `, { count: 'exact' });

    // Apply filters
    if (platforms.length > 0) {
      query = query.in('platform', platforms);
    }
    
    if (categories.length > 0) {
      query = query.in('category', categories);
    }
    
    if (status.length > 0) {
      query = query.in('status', status);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['volume_24h', 'created_at', 'updated_at', 'liquidity'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'volume_24h';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: markets, error, count } = await query;

    if (error) {
      console.error('Error fetching markets:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      data: markets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Markets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
