import { useEffect, useRef, useCallback } from 'react';

export interface PollingOptions {
  interval: number; // milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
  maxRetries?: number;
  backoffMultiplier?: number;
  maxBackoff?: number;
}

export function usePolling(
  callback: () => Promise<void> | void,
  options: PollingOptions
) {
  const {
    interval,
    enabled = true,
    onError,
    maxRetries = 3,
    backoffMultiplier = 1.5,
    maxBackoff = 60000, // 1 minute max
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const currentIntervalRef = useRef(interval);
  const isVisibleRef = useRef(true);

  const executeCallback = useCallback(async () => {
    if (!enabled || !isVisibleRef.current) return;

    try {
      await callback();
      // Reset retry count on success
      retryCountRef.current = 0;
      currentIntervalRef.current = interval;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);

      // Implement exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const backoffDelay = Math.min(
          currentIntervalRef.current * Math.pow(backoffMultiplier, retryCountRef.current),
          maxBackoff
        );
        currentIntervalRef.current = backoffDelay;
      }
    }
  }, [callback, enabled, onError, maxRetries, backoffMultiplier, maxBackoff, interval]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(executeCallback, currentIntervalRef.current);
  }, [executeCallback]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isVisibleRef.current && enabled) {
        // Page became visible, restart polling
        startPolling();
      } else {
        // Page became hidden, stop polling
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && isVisibleRef.current) {
      // Execute immediately, then start polling
      executeCallback();
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, executeCallback, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: intervalRef.current !== null,
  };
}
