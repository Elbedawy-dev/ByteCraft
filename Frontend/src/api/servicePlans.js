import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export const servicePlanKeys = {
  all: ['servicePlans'],
  list: (filters = {}) => ['servicePlans', 'list', filters],
};

export async function fetchServicePlans({ group, signal } = {}) {
  const params = group ? { group: String(group).trim().toLowerCase() } : undefined;
  const { data } = await api.get('/service-plans', { params, signal });
  return Array.isArray(data?.plans) ? data.plans : [];
}

export function useServicePlans(filters = {}, options = {}) {
  return useQuery({
    queryKey: servicePlanKeys.list(filters),
    queryFn: ({ signal }) => fetchServicePlans({ group: filters.group, signal }),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}
