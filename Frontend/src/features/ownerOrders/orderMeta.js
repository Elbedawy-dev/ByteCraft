/**
 * Order status metadata, allowed state machine transitions, and error helpers.
 * Mirrors Backend/src/services/order.service.js strictly.
 */

export const ORDER_STATUSES = [
  'pending_payment',
  'awaiting_review',
  'paid',
  'delivered',
  'rejected',
  'cancelled',
  'refunded',
  'expired',
];

export const PAYMENT_METHODS = ['vodafone_cash', 'instapay', 'fawry', 'card'];

export const REPO_ACCESS_STATES = ['pending', 'granted', 'failed', 'manual'];

export const ORDER_STATUS_BADGE_VARIANT = {
  pending_payment: 'warning',
  awaiting_review: 'primary',
  paid: 'success',
  delivered: 'success',
  rejected: 'error',
  cancelled: 'neutral',
  refunded: 'neutral',
  expired: 'neutral',
};

export const DELIVERY_BADGE_VARIANT = {
  pending: 'warning',
  granted: 'success',
  failed: 'error',
  manual: 'primary',
};

export const PAYMENT_METHOD_ICON = {
  vodafone_cash: 'account_balance_wallet',
  instapay: 'bolt',
  fawry: 'receipt_long',
  card: 'credit_card',
};

/**
 * Returns strictly the actions allowed by Backend/src/services/order.service.js
 * for a given order status.
 */
export function getAllowedOrderActions(status) {
  return {
    canApprove: status === 'awaiting_review' || status === 'pending_payment',
    canReject: status === 'awaiting_review',
    canUpdateDelivery: status === 'paid' || status === 'delivered',
    canRefund: status === 'paid' || status === 'delivered',
  };
}

export function isInvalidStateError(error) {
  return Boolean(error && (error.status === 409 || error.code === 'INVALID_STATE'));
}

export function isPdfProofUrl(url = '') {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.pdf') || clean.includes('/raw/upload/') || clean.includes('application/pdf');
}
