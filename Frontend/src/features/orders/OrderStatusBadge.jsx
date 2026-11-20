import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui';

const ORDER_STATUS_VARIANT = {
  pending_payment: 'warning',
  awaiting_review: 'primary',
  paid: 'success',
  delivered: 'success',
  rejected: 'error',
  cancelled: 'error',
  refunded: 'neutral',
  expired: 'neutral',
};

export function OrderStatusBadge({ status, size = 'md', className = '' }) {
  const { t } = useTranslation('orders');
  const variant = ORDER_STATUS_VARIANT[status] || 'neutral';
  const label = t(`tracking.status.${status}`, { defaultValue: status });

  return (
    <Badge variant={variant} dot size={size} className={className}>
      {label}
    </Badge>
  );
}
