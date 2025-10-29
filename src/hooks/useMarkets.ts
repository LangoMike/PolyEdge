'use client';

import useSWR from 'swr';
import { Market, FilterOptions, PaginationOptions } from '@/types';

interface UseMarketsOptions {
  filters?: FilterOptions;
  pagination?: PaginationOptions;
  refreshInterval?: number;
}

interface UseMarketsReturn {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch markets');
  }
  return response.json();
};

export function useMarkets(options: UseMarketsOptions = {}): UseMarketsReturn {
  const { filters = {}, pagination = { page: 1, limit: 20 }, refreshInterval = 30000 } = options;

  // Build query parameters
  const searchParams = new URLSearchParams();
  
  if (filters.platforms?.length) {
    searchParams.append('platforms', filters.platforms.join(','));
  }
  if (filters.categories?.length) {
    searchParams.append('categories', filters.categories.join(','));
  }
  if (filters.status?.length) {
    searchParams.append('status', filters.status.join(','));
  }
  if (filters.search) {
    searchParams.append('search', filters.search);
  }
  if (filters.sortBy) {
    searchParams.append('sortBy', filters.sortBy);
  }
  if (filters.sortOrder) {
    searchParams.append('sortOrder', filters.sortOrder);
  }
  
  searchParams.append('page', pagination.page.toString());
  searchParams.append('limit', pagination.limit.toString());

  const url = `/api/markets?${searchParams.toString()}`;

  const { data, error, mutate, isLoading } = useSWR(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const refetch = () => {
    mutate();
  };

  const loadMore = () => {
    // This would be implemented with pagination
    // For now, just refetch
    refetch();
  };

  return {
    markets: data?.data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch,
    hasMore: data?.pagination?.hasMore || false,
    loadMore,
    totalCount: data?.pagination?.total || 0,
  };
}

// Hook for getting markets by category
export function useMarketsByCategory(
  category: string,
  options: Omit<UseMarketsOptions, 'filters'> = {}
): UseMarketsReturn {
  return useMarkets({
    ...options,
    filters: { ...options.filters, categories: [category] },
  });
}

// Hook for getting markets by platform
export function useMarketsByPlatform(
  platform: string,
  options: Omit<UseMarketsOptions, 'filters'> = {}
): UseMarketsReturn {
  return useMarkets({
    ...options,
    filters: { ...options.filters, platforms: [platform] },
  });
}

// Hook for searching markets
export function useSearchMarkets(
  query: string,
  options: Omit<UseMarketsOptions, 'filters'> = {}
): UseMarketsReturn {
  return useMarkets({
    ...options,
    filters: { ...options.filters, search: query },
  });
}
