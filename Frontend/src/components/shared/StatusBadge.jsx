import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';

export function StatusBadge({
  status,
  type = 'order', // 'order' | 'inquiry' | 'project' | 'payment'
  className = '',
}) {
  const { t } = useTranslation('common');

  // Variant mapping
  const variantMap = {
    // Orders
    pending: 'warning',
    confirmed: 'primary',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
    refunded: 'neutral',

    // Inquiries
    new: 'primary',
    contacted: 'warning',
    in_discussion: 'primary',
    closed: 'neutral',

    // Projects
    draft: 'neutral',
    published: 'success',
    archived: 'error',

    // Payment
    paid: 'success',
    failed: 'error',
  };

  const variant = variantMap[status] || 'neutral';

  // Localized text resolution
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
