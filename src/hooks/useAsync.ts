import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useAsync: Minimal, safe, reusable async state helper.
 * - Manages loading and error state.
 * - Guards against state updates after unmount.
 * - Works with a Promise or an async function.
 */
export function useAsync<T = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | undefined>(undefined);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async <R = T>(task: Promise<R> | (() => Promise<R>)) => {
      if (!mountedRef.current)
        return {
          data: undefined as unknown as R,
          error: undefined as Error | undefined,
        };
      setLoading(true);
      setError(null);
      try {
        const result =
          typeof task === "function"
            ? await (task as () => Promise<R>)()
            : await task;
        if (mountedRef.current) setData(result as unknown as T);
        return { data: result, error: undefined as Error | undefined };
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (mountedRef.current) setError(err);
        return { data: undefined as unknown as R, error: err };
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setLoading(false);
    setError(null);
    setData(undefined);
  }, []);

  return { loading, error, data, run, reset };
}

/**
 * useAsyncCallback: Wrap an async callback with built-in loading + error state and unmount safety.
 * Prevents concurrent calls by default.
 */
export function useAsyncCallback<
  TArgs extends any[] = any[],
  TResult = unknown,
>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: { concurrent?: boolean },
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const call = useCallback(
    async (
      ...args: TArgs
    ): Promise<{ data?: TResult; error?: Error } | void> => {
      if (!options?.concurrent && loading) return;
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fn(...args);
        return { data: res };
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (mountedRef.current) setError(err);
        return { error: err };
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [fn, loading, options?.concurrent],
  );

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setLoading(false);
    setError(null);
  }, []);

  return { call, loading, error, reset };
}
