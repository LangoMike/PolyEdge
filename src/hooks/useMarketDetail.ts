'use client';

import useSWR from 'swr';
import { usePolling } from './usePolling';
import { Market } from '@/types';

interface UseMarketDetailOptions {
  refreshInterval?: number;
}

interface UseMarketDetailReturn {
  market: Market | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isPolling: boolean;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch market detail');
  }
  return response.json();
};

export function useMarketDetail(
  marketId: string | null,
  options: UseMarketDetailOptions = {}
): UseMarketDetailReturn {
  const { refreshInterval = 15000 } = options; // 15 seconds for detail pages

  const url = marketId ? `/api/markets/${marketId}` : null;

  const { data, error, mutate, isLoading } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Use our smart polling hook with faster refresh for detail pages
  const { isPolling } = usePolling(
    () => mutate(),
    {
      interval: refreshInterval,
      enabled: !!marketId, // Only poll if we have a market ID
      onError: (err) => {
        console.error('Market detail polling error:', err);
      },
    }
  );

  const refetch = () => {
    mutate();
  };

  return {
    market: data?.data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    isPolling,
  };
}
