'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useTopPicks(options: UseTopPicksOptions = {}): UseTopPicksReturn {
  const { 
    limit = 10, 
    category, 
    platform, 
    refreshInterval = 30000 
  } = options;

  const [picks, setPicks] = useState<TopPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to store the latest values without causing re-renders
  const optionsRef = useRef({ limit, category, platform });
  optionsRef.current = { limit, category, platform };

  const fetchPicks = useCallback(async () => {
    try {
      setError(null);
      
      // Build query parameters using ref values
      const searchParams = new URLSearchParams();
      searchParams.append('limit', optionsRef.current.limit.toString());
      
      if (optionsRef.current.category) {
        searchParams.append('category', optionsRef.current.category);
      }
      if (optionsRef.current.platform) {
        searchParams.append('platform', optionsRef.current.platform);
      }

      const url = `/api/top-picks?${searchParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch top picks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setPicks(data.data);
      } else {
        setPicks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPicks([]);
    }
  }, []); // Empty dependency array - function never changes

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await fetchPicks();
      setLoading(false);
    };
    initialFetch();
  }, [fetchPicks]);

  // Use our smart polling hook
  const { isPolling } = usePolling(
    fetchPicks,
    {
      interval: refreshInterval,
      enabled: true,
      onError: (err) => {
        console.error('Top picks polling error:', err);
      },
    }
  );

  return {
    picks,
    loading,
    error,
    refetch: fetchPicks,
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
