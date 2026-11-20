import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export const ownerDashboardKeys = {
  all: ['owner', 'dashboard'],
  overview: () => ['owner', 'dashboard', 'overview'],
};

export async function fetchOwnerDashboard({ signal } = {}) {
  const { data } = await api.get('/owner/dashboard', { signal });
  return data;
}

export function useOwnerDashboard(options = {}) {
  return useQuery({
    queryKey: ownerDashboardKeys.overview(),
    queryFn: ({ signal }) => fetchOwnerDashboard({ signal }),
    staleTime: 30 * 1000,
    ...options,
  });
}
