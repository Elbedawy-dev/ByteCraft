import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export const metaKeys = {
  all: ['meta'],
};

export async function fetchMeta({ signal } = {}) {
  const { data } = await api.get('/meta', { signal });
  return data;
}

export function useMeta(options = {}) {
  return useQuery({
    queryKey: metaKeys.all,
    queryFn: ({ signal }) => fetchMeta({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    ...options,
  });
}
