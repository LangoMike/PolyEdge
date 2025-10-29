'use client';

import useSWR from 'swr';
import { usePolling } from './usePolling';
import { TopPick } from '@/types';

interface UseTopPicksOptions {
  limit?: number;
  category?: string;
  platform?: string;
  refreshInterval?: number;
}

interface UseTopPicksReturn {
  picks: TopPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isPolling: boolean;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch top picks');
  }
  return response.json();
};

export function useTopPicks(options: UseTopPicksOptions = {}): UseTopPicksReturn {
  const { 
    limit = 10, 
    category, 
    platform, 
    refreshInterval = 30000 
  } = options;

  // Build query parameters
  const searchParams = new URLSearchParams();
  searchParams.append('limit', limit.toString());
  
  if (category) {
    searchParams.append('category', category);
  }
  if (platform) {
    searchParams.append('platform', platform);
  }

  const url = `/api/top-picks?${searchParams.toString()}`;

  const { data, error, mutate, isLoading } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Use our smart polling hook
  const { isPolling } = usePolling(
    () => mutate(),
    {
      interval: refreshInterval,
      enabled: true,
      onError: (err) => {
        console.error('Top picks polling error:', err);
      },
    }
  );

  const refetch = () => {
    mutate();
  };

  return {
    picks: data?.data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch,
    isPolling,
  };
}

// Hook for getting top picks by category
export function useTopPicksByCategory(
  category: string,
  options: Omit<UseTopPicksOptions, 'category'> = {}
): UseTopPicksReturn {
  return useTopPicks({
    ...options,
    category,
  });
}

// Hook for getting top picks by platform
export function useTopPicksByPlatform(
  platform: string,
  options: Omit<UseTopPicksOptions, 'platform'> = {}
): UseTopPicksReturn {
  return useTopPicks({
    ...options,
    platform,
  });
}
