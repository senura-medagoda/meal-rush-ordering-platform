import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api';

interface State<T> {
  path: string;
  data?: T;
  error?: string;
}

export function useApiData<T>(path: string) {
  const [state, setState] = useState<State<T>>({ path });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    apiFetch<T>(path)
      .then((data) => active && setState({ path, data }))
      .catch((err) =>
        active && setState({ path, error: err instanceof ApiError ? err.message : 'Could not load data' }),
      );
    return () => {
      active = false;
    };
  }, [path, tick]);

  const current = state.path === path;
  const data = current ? state.data : undefined;
  const error = current ? state.error : undefined;
  const loading = !current || (data === undefined && !error);

  return { data, error, loading, refetch: () => setTick((t) => t + 1) };
}