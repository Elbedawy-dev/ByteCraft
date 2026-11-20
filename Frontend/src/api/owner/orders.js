import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const ownerOrdersKeys = {
  all: ['owner', 'orders'],
  lists: () => [...ownerOrdersKeys.all, 'list'],
  list: (params) => [...ownerOrdersKeys.lists(), params],
  details: () => [...ownerOrdersKeys.all, 'detail'],
  detail: (id) => [...ownerOrdersKeys.details(), id],
};

function invalidateDashboardQueries(queryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey.some(
        (part) => typeof part === 'string' && part.toLowerCase().includes('dashboard')
      ),
  });
}

function normalizeDateRange(params = {}) {
  const cleaned = { ...params };
  if (cleaned.from && /^\d{4}-\d{2}-\d{2}$/.test(cleaned.from)) {
    cleaned.from = `${cleaned.from}T00:00:00.000+02:00`;
  }
  if (cleaned.to && /^\d{4}-\d{2}-\d{2}$/.test(cleaned.to)) {
    cleaned.to = `${cleaned.to}T23:59:59.999+02:00`;
  }
  return cleaned;
}

export async function getOwnerOrders(params = {}, { signal } = {}) {
  const { data, meta } = await api.get('/owner/orders', {
    params: normalizeDateRange(params),
    signal,
  });
  return {
    orders: data?.orders || [],
    meta: meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function getOwnerOrderById(id, { signal } = {}) {
  const { data } = await api.get(`/owner/orders/${id}`, { signal });
  return data?.order || null;
}

export async function approveOwnerOrder(id) {
  const { data } = await api.patch(`/owner/orders/${id}/approve`, {});
  return data?.order || null;
}

export async function rejectOwnerOrder({ id, reason }) {
  const { data } = await api.patch(`/owner/orders/${id}/reject`, { reason });
  return data?.order || null;
}

export async function updateOwnerOrderDelivery({ id, repoAccess, notes }) {
  const body = {};
  if (repoAccess !== undefined && repoAccess !== '') body.repoAccess = repoAccess;
  if (notes !== undefined) body.notes = notes;
  const { data } = await api.patch(`/owner/orders/${id}/delivery`, body);
  return data?.order || null;
}

export async function refundOwnerOrder({ id, note }) {
  const body = {};
  if (note !== undefined && note.trim() !== '') body.note = note.trim();
  const { data } = await api.patch(`/owner/orders/${id}/refund`, body);
  return data?.order || null;
}

export async function cleanupExpiredOrders(options = {}) {
  const { data } = await api.post('/owner/orders/cleanup-expired', options);
  return data || { expiredCount: 0 };
}

export function useOwnerOrders(params = {}, options = {}) {
  return useQuery({
    queryKey: ownerOrdersKeys.list(params),
    queryFn: ({ signal }) => getOwnerOrders(params, { signal }),
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

export function useOwnerOrder(id, options = {}) {
  return useQuery({
    queryKey: ownerOrdersKeys.detail(id),
    queryFn: ({ signal }) => getOwnerOrderById(id, { signal }),
    enabled: Boolean(id),
    ...options,
  });
}

export function useApproveOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveOwnerOrder,
    onSuccess: (updatedOrder, id) => {
      if (updatedOrder) {
        queryClient.setQueryData(ownerOrdersKeys.detail(id), (prev) =>
          prev ? { ...prev, ...updatedOrder, project: prev.project || updatedOrder.project } : updatedOrder
        );
      }
      queryClient.invalidateQueries({ queryKey: ownerOrdersKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectOwnerOrder,
    onSuccess: (updatedOrder, { id }) => {
      if (updatedOrder) {
        queryClient.setQueryData(ownerOrdersKeys.detail(id), (prev) =>
          prev ? { ...prev, ...updatedOrder, project: prev.project || updatedOrder.project } : updatedOrder
        );
      }
      queryClient.invalidateQueries({ queryKey: ownerOrdersKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateOrderDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOwnerOrderDelivery,
    onSuccess: (updatedOrder, { id }) => {
      if (updatedOrder) {
        queryClient.setQueryData(ownerOrdersKeys.detail(id), (prev) =>
          prev ? { ...prev, ...updatedOrder, project: prev.project || updatedOrder.project } : updatedOrder
        );
      }
      queryClient.invalidateQueries({ queryKey: ownerOrdersKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refundOwnerOrder,
    onSuccess: (updatedOrder, { id }) => {
      if (updatedOrder) {
        queryClient.setQueryData(ownerOrdersKeys.detail(id), (prev) =>
          prev ? { ...prev, ...updatedOrder, project: prev.project || updatedOrder.project } : updatedOrder
        );
      }
      queryClient.invalidateQueries({ queryKey: ownerOrdersKeys.all });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCleanupExpiredOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cleanupExpiredOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerOrdersKeys.all });
      queryClient.invalidateQueries({ queryKey: ['owner', 'coupons'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}
