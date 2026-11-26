import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import { authKeys } from './auth';
import { setSessionHint } from '../lib/storage';
import { setStoredOrderReview } from './orderTracking';

export const accountKeys = {
  all: ['account'],
  orders: () => ['account', 'orders'],
  ordersList: (params) => ['account', 'orders', 'list', params],
  order: (orderNumber) => ['account', 'orders', 'detail', orderNumber],
};

export async function updateAccountProfile(payload) {
  const { data } = await api.patch('/account/profile', payload);
  return data?.user ?? null;
}

export async function changeAccountPassword({ currentPassword, newPassword }) {
  const { data } = await api.patch('/account/password', {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function deleteOwnAccount({ password }) {
  const { data } = await api.delete('/account', {
    body: { password },
  });
  setSessionHint(false);
  return data;
}

export async function fetchAccountOrders(params = {}, { signal } = {}) {
  const { data, meta } = await api.get('/account/orders', { params, signal });
  return {
    orders: data?.orders || [],
    meta: meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function fetchAccountOrder(orderNumber, { signal } = {}) {
  const { data } = await api.get(`/account/orders/${encodeURIComponent(orderNumber)}`, {
    signal,
  });
  return data?.order ?? null;
}

export async function submitAccountPaymentProof({ orderNumber, file, reference = '' }) {
  const formData = new FormData();
  formData.append('proof', file);
  formData.append('reference', reference.trim());

  const { data } = await api.post(
    `/account/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
    formData
  );
  return data?.order ?? null;
}

export async function submitAccountOrderReview({
  orderNumber,
  rating,
  comment,
  customerName,
}) {
  const payload = {
    rating: Number(rating),
    comment: comment.trim(),
  };

  if (customerName && customerName.trim().length >= 2) {
    payload.customerName = customerName.trim();
  }

  const { data } = await api.post(
    `/account/orders/${encodeURIComponent(orderNumber)}/reviews`,
    payload
  );
  return data?.review ?? null;
}

export async function claimGuestOrders() {
  const { data } = await api.post('/account/claim-orders', {});
  return data;
}

export function useUpdateAccountProfile(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;

  return useMutation({
    mutationFn: updateAccountProfile,
    onSuccess: (user, variables, context) => {
      if (user) {
        queryClient.setQueryData(authKeys.me, user);
      }
      onSuccess?.(user, variables, context);
    },
    ...rest,
  });
}

export function useChangeAccountPassword(options = {}) {
  return useMutation({
    mutationFn: changeAccountPassword,
    ...options,
  });
}

export function useDeleteOwnAccount(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;

  return useMutation({
    mutationFn: ({ password }) => deleteOwnAccount({ password }),
    onSuccess: (data, variables, context) => {
      variables?.onBeforeClear?.();
      setSessionHint(false);
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: accountKeys.all });
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

export function useAccountOrders(params = {}, options = {}) {
  return useQuery({
    queryKey: accountKeys.ordersList(params),
    queryFn: ({ signal }) => fetchAccountOrders(params, { signal }),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useAccountOrder(orderNumber, options = {}) {
  const { isTabVisible = true, customIntervalMs, ...queryOptions } = options;

  return useQuery({
    queryKey: accountKeys.order(orderNumber),
    enabled: Boolean(orderNumber) && queryOptions.enabled !== false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [401, 403, 404, 429].includes(error.status)) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (!isTabVisible) return false;
      const status = query.state.data?.status;
      if (status === 'pending_payment' || status === 'awaiting_review') {
        return customIntervalMs ?? 20000;
      }
      return false;
    },
    refetchIntervalInBackground: false,
    queryFn: ({ signal }) => fetchAccountOrder(orderNumber, { signal }),
    ...queryOptions,
  });
}

export function useSubmitAccountPaymentProof(orderNumber) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, reference }) =>
      submitAccountPaymentProof({ orderNumber, file, reference }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.order(orderNumber) });
      queryClient.invalidateQueries({ queryKey: accountKeys.orders() });
    },
  });
}

export function useSubmitAccountOrderReview(orderNumber) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rating, comment, customerName }) =>
      submitAccountOrderReview({ orderNumber, rating, comment, customerName }),
    onSuccess: (review) => {
      setStoredOrderReview(orderNumber, review || { isPublished: false, submittedAt: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: accountKeys.order(orderNumber) });
      queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'reviews'] });
    },
  });
}

export function useClaimGuestOrders(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;

  return useMutation({
    mutationFn: claimGuestOrders,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.orders() });
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}
