'use client';

import { useState, useEffect } from 'react';
import { TopPick } from '@/types';

interface UseTopPicksSimpleOptions {
  limit?: number;
  category?: string;
  platform?: string;
}

interface UseTopPicksSimpleReturn {
  picks: TopPick[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTopPicksSimple(options: UseTopPicksSimpleOptions = {}): UseTopPicksSimpleReturn {
  const { limit = 10, category, platform } = options;
  const [picks, setPicks] = useState<TopPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPicks = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      console.log('Simple hook fetching from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch top picks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Simple hook response:', data);
      
      if (data.success && data.data) {
        setPicks(data.data);
      } else {
        setPicks([]);
      }
    } catch (err) {
      console.error('Simple hook error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPicks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicks();
  }, [limit, category, platform]);

  return {
    picks,
    loading,
    error,
    refetch: fetchPicks,
  };
}
