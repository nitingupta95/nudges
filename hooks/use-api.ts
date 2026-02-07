"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const MAX_RETRIES = 2;
const BASE_DELAY = 1000;

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const cacheRef = useRef<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Stale-while-revalidate: show cached data while fetching
    if (cacheRef.current) {
      setData(cacheRef.current);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await fetcher();
        if (mountedRef.current) {
          setData(result);
          cacheRef.current = result;
          setLoading(false);
          setError(null);
        }
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown error");
        if (attempt < MAX_RETRIES) {
          await new Promise((r) =>
            setTimeout(r, BASE_DELAY * Math.pow(2, attempt))
          );
        }
      }
    }

    if (mountedRef.current) {
      setLoading(false);
      setError(lastError?.message === "network"
        ? "Network error — please retry."
        : "Something went wrong. Please try again."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
