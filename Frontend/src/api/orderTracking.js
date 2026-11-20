import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import {
  getOrderToken,
  setOrderToken,
  removeOrderToken,
  getSession,
  setSession,
  removeSession,
} from '../lib/storage';

const ORDER_BOOTSTRAP_PREFIX = 'bc_order_bootstrap_';
const ORDER_REVIEW_PREFIX = 'bc_order_review_';

export const ALLOWED_PROOF_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
export const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const orderTrackingKeys = {
  all: ['orderTracking'],
  detail: (orderNumber, token) => ['orderTracking', 'detail', orderNumber, token],
};

export { getOrderToken, setOrderToken, removeOrderToken };

export function getOrderBootstrap(orderNumber) {
  if (!orderNumber) return null;
  const raw = getSession(`${ORDER_BOOTSTRAP_PREFIX}${orderNumber}`, null);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setOrderBootstrap(orderNumber, payload) {
  if (!orderNumber || !payload || typeof payload !== 'object') return false;
  try {
    return setSession(`${ORDER_BOOTSTRAP_PREFIX}${orderNumber}`, JSON.stringify(payload));
  } catch {
    return false;
  }
}

export function removeOrderBootstrap(orderNumber) {
  if (!orderNumber) return false;
  return removeSession(`${ORDER_BOOTSTRAP_PREFIX}${orderNumber}`);
}

export function getStoredOrderReview(orderNumber) {
  if (!orderNumber) return null;
  const raw = getSession(`${ORDER_REVIEW_PREFIX}${orderNumber}`, null);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredOrderReview(orderNumber, review) {
  if (!orderNumber || !review) return false;
  try {
    return setSession(`${ORDER_REVIEW_PREFIX}${orderNumber}`, JSON.stringify(review));
  } catch {
    return false;
  }
}

/**
 * Fetches safe guest order details via GET /api/orders/:orderNumber?token=.
 */
export async function fetchGuestOrder({ orderNumber, token, signal }) {
  const { data } = await api.get(`/orders/${encodeURIComponent(orderNumber)}`, {
    params: { token },
    signal,
    skipAuthRedirect: true,
  });
  return data?.order;
}

/**
 * Guest order query with automatic 20s polling while pending_payment / awaiting_review
 * and tab is visible.
 */
export function useGuestOrder(orderNumber, token, options = {}) {
  const { isTabVisible = true, customIntervalMs, ...queryOptions } = options;

  return useQuery({
    queryKey: orderTrackingKeys.detail(orderNumber, token),
    enabled: Boolean(orderNumber && token) && (queryOptions.enabled !== false),
    retry: (failureCount, error) => {
      if (error?.status === 401 || error?.status === 404 || error?.status === 429) {
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
    queryFn: ({ signal }) => fetchGuestOrder({ orderNumber, token, signal }),
    ...queryOptions,
  });
}

/**
 * Uploads manual payment proof via POST /api/orders/:orderNumber/payment-proof?token=.
 */
export async function submitPaymentProof({ orderNumber, token, file, reference = '' }) {
  const formData = new FormData();
  formData.append('proof', file);
  formData.append('reference', reference.trim());

  const { data } = await api.post(
    `/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
    formData,
    {
      params: { token },
      skipAuthRedirect: true,
    }
  );
  return data?.order;
}

export function useSubmitPaymentProof(orderNumber, token) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, reference }) =>
      submitPaymentProof({ orderNumber, token, file, reference }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orderTrackingKeys.detail(orderNumber, token),
      });
    },
  });
}

/**
 * Submits a verified buyer review via POST /api/orders/:orderNumber/reviews?token=.
 */
export async function submitOrderReview({
  orderNumber,
  token,
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
    `/orders/${encodeURIComponent(orderNumber)}/reviews`,
    payload,
    {
      params: { token },
      skipAuthRedirect: true,
    }
  );
  return data?.review;
}

export function useSubmitOrderReview(orderNumber, token) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rating, comment, customerName }) =>
      submitOrderReview({ orderNumber, token, rating, comment, customerName }),
    onSuccess: (review) => {
      setStoredOrderReview(orderNumber, review || { submittedAt: new Date().toISOString() });
      queryClient.invalidateQueries({
        queryKey: orderTrackingKeys.detail(orderNumber, token),
      });
    },
  });
}
