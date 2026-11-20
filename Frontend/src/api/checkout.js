import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from './client';

export const checkoutKeys = {
  all: ['checkout'],
  project: (slug) => ['checkout', 'project', slug],
};

/**
 * Fetches public project details by slug for checkout.
 * Never throws away server errors so 404 vs network/429 can be differentiated.
 */
export async function fetchCheckoutProject(slug, { signal } = {}) {
  const { data } = await api.get(`/projects/${encodeURIComponent(slug)}`, { signal });
  return data?.project ?? null;
}

export function useCheckoutProject(slug, options = {}) {
  return useQuery({
    queryKey: checkoutKeys.project(slug),
    queryFn: ({ signal }) => fetchCheckoutProject(slug, { signal }),
    enabled: Boolean(slug),
    retry: (failureCount, error) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
    ...options,
  });
}

/**
 * Validates a coupon against a specific project & package on the server.
 * Returns authoritative server pricing breakdown (`subtotal`, `discount`, `total`, `couponCode`).
 */
export async function validateCoupon({ code, projectSlug, packageKey }) {
  const { data } = await api.post('/coupons/validate', {
    code,
    projectSlug,
    packageKey,
  });
  return data?.pricing ?? null;
}

export function useValidateCoupon(options = {}) {
  return useMutation({
    mutationFn: validateCoupon,
    ...options,
  });
}

/**
 * Creates a guest checkout order.
 * Returns order with `orderNumber`, `publicToken` (returned once), `pricing`,
 * `paymentMethod`, `isFreeOrder`, `paymentInstructions`, `paymentUrl`, `fawryReference`.
 */
export async function createOrder(payload) {
  const { data } = await api.post('/orders', payload);
  return data?.order ?? null;
}

export function useCreateOrder(options = {}) {
  return useMutation({
    mutationFn: createOrder,
    ...options,
  });
}
