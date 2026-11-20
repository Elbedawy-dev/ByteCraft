import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const ownerCouponsKeys = {
  all: ['owner', 'coupons'],
  list: () => [...ownerCouponsKeys.all, 'list'],
  detail: (id) => [...ownerCouponsKeys.all, 'detail', id],
  projects: () => [...ownerCouponsKeys.all, 'projects'],
};

export async function getOwnerCoupons({ signal } = {}) {
  const { data } = await api.get('/owner/coupons', { signal });
  return data?.coupons || [];
}

export async function getOwnerCouponById(id, { signal } = {}) {
  const { data } = await api.get(`/owner/coupons/${id}`, { signal });
  return data?.coupon || null;
}

export async function createOwnerCoupon(payload) {
  const { data } = await api.post('/owner/coupons', payload);
  return data?.coupon || null;
}

export async function updateOwnerCoupon({ id, ...payload }) {
  const { data } = await api.patch(`/owner/coupons/${id}`, payload);
  return data?.coupon || null;
}

export async function deleteOwnerCoupon(id) {
  const { data } = await api.delete(`/owner/coupons/${id}`);
  return data;
}

/**
 * Loads all owner projects across pages (up to 50 per page) for the coupon
 * applicable-projects multi-select control.
 */
export async function getOwnerProjectsForCoupons({ signal } = {}) {
  const first = await api.get('/owner/projects', {
    params: { page: 1, limit: 50 },
    signal,
  });
  const projects = [...(first.data?.projects || [])];
  const totalPages = first.meta?.totalPages || 1;

  if (totalPages > 1) {
    const restPages = [];
    for (let p = 2; p <= Math.min(totalPages, 10); p += 1) {
      restPages.push(
        api.get('/owner/projects', {
          params: { page: p, limit: 50 },
          signal,
        })
      );
    }
    const results = await Promise.all(restPages);
    for (const res of results) {
      if (Array.isArray(res.data?.projects)) {
        projects.push(...res.data.projects);
      }
    }
  }

  return projects;
}

export function useOwnerCoupons(options = {}) {
  return useQuery({
    queryKey: ownerCouponsKeys.list(),
    queryFn: ({ signal }) => getOwnerCoupons({ signal }),
    ...options,
  });
}

export function useOwnerCouponProjects(options = {}) {
  return useQuery({
    queryKey: ownerCouponsKeys.projects(),
    queryFn: ({ signal }) => getOwnerProjectsForCoupons({ signal }),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useCreateOwnerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOwnerCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerCouponsKeys.all });
    },
  });
}

export function useUpdateOwnerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerCouponsKeys.all });
    },
  });
}

export function useDeleteOwnerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOwnerCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerCouponsKeys.all });
    },
  });
}
