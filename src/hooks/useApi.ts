/**
 * useApi - универсальные хуки для работы с API
 */

import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Хук для загрузки данных
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, refetch: fetchData, setData };
}

/**
 * Хук для мутаций (create, update, delete)
 */
export function useMutation<T, P = unknown>(
  mutationFn: (params: P) => Promise<T>
): {
  mutate: (params: P) => Promise<T>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (params: P): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutationFn(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return { mutate, isLoading, error, reset };
}
