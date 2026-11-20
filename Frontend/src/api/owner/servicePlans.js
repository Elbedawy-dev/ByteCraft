import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';

export const ownerServicePlansKeys = {
  all: ['owner', 'servicePlans'],
  lists: () => [...ownerServicePlansKeys.all, 'list'],
  list: (params = {}) => [...ownerServicePlansKeys.lists(), params],
  detail: (id) => [...ownerServicePlansKeys.all, 'detail', id],
};

function invalidateServicePlanRelated(queryClient) {
  queryClient.invalidateQueries({ queryKey: ownerServicePlansKeys.all });
  queryClient.invalidateQueries({ queryKey: ['servicePlans'] });
  queryClient.invalidateQueries({ queryKey: ['service-plans'] });
}

export async function getOwnerServicePlans(params = {}, { signal } = {}) {
  const queryParams = {};
  if (typeof params.group === 'string' && params.group.trim()) {
    queryParams.group = params.group.trim().toLowerCase();
  }
  const { data } = await api.get('/owner/service-plans', {
    params: queryParams,
    signal,
  });
  return Array.isArray(data?.plans) ? data.plans : [];
}

export async function getOwnerServicePlanById(id, { signal } = {}) {
  const { data } = await api.get(`/owner/service-plans/${id}`, { signal });
  return data?.plan || null;
}

export async function createOwnerServicePlan(payload) {
  const { data } = await api.post('/owner/service-plans', payload);
  return data?.plan || null;
}

export async function updateOwnerServicePlan({ id, ...payload }) {
  const { data } = await api.patch(`/owner/service-plans/${id}`, payload);
  return data?.plan || null;
}

export async function deleteOwnerServicePlan(id) {
  const { data } = await api.delete(`/owner/service-plans/${id}`);
  return data;
}

export function useOwnerServicePlans(params = {}, options = {}) {
  return useQuery({
    queryKey: ownerServicePlansKeys.list(params),
    queryFn: ({ signal }) => getOwnerServicePlans(params, { signal }),
    ...options,
  });
}

export function useCreateOwnerServicePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOwnerServicePlan,
    onSuccess: () => invalidateServicePlanRelated(queryClient),
  });
}

export function useUpdateOwnerServicePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerServicePlan,
    onSuccess: () => invalidateServicePlanRelated(queryClient),
  });
}

export function useDeleteOwnerServicePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerServicePlan,
    onSuccess: () => invalidateServicePlanRelated(queryClient),
  });
}
