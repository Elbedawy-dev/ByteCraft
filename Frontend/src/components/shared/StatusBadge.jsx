import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';

export function StatusBadge({
  status,
  type = 'order',
  className = '',
}) {
  const { t } = useTranslation('common');

  const variantMap = {
    // Orders
    pending: 'warning',
    awaiting_proof: 'warning',
    awaiting_review: 'info',
    confirmed: 'primary',
    in_progress: 'primary',
    paid: 'success',
    delivered: 'success',
    completed: 'success',
    cancelled: 'error',
    refunded: 'neutral',

    // Inquiries
    new: 'primary',
    contacted: 'warning',
    in_discussion: 'info',
    replied: 'success',
    closed: 'neutral',

    // Projects / Plans / Reviews
    draft: 'neutral',
    published: 'success',
    active: 'success',
    inactive: 'neutral',
    approved: 'success',
    rejected: 'error',
    archived: 'error',

    // Payment
    failed: 'error',
  };

  const variant = variantMap[status] || 'primary';

  let label = status;
  if (type === 'order') {
    label = t(`statuses.order.${status}`, { defaultValue: status });
  } else if (type === 'inquiry') {
    label = t(`statuses.inquiry.${status}`, { defaultValue: status });
  } else if (type === 'project') {
    label = t(`statuses.project.${status}`, { defaultValue: status });
  } else if (type === 'payment') {
    label = t(`statuses.payment.${status}`, { defaultValue: status });
  }

  return (
    <Badge variant={variant} dot size="sm" className={className}>
      {label}
    </Badge>
  );
}
