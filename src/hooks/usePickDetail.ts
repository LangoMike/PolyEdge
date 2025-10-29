'use client';

import useSWR from 'swr';
import { TopPick } from '@/types';

interface UsePickDetailReturn {
  pick: TopPick | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch pick');
  return res.json();
};

export function usePickDetail(id: string | null): UsePickDetailReturn {
  const url = id ? `/api/top-picks/${id}` : null;
  const { data, error, mutate, isLoading } = useSWR(url, fetcher);

  return {
    pick: data?.data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: () => mutate(),
  };
}


