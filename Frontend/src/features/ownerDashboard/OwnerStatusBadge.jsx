import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui';

const ORDER_VARIANT_MAP = {
  pending_payment: 'warning',
  awaiting_review: 'warning',
  paid: 'primary',
  delivered: 'success',
  rejected: 'error',
  cancelled: 'neutral',
  refunded: 'outline',
  expired: 'neutral',
};

const INQUIRY_VARIANT_MAP = {
  new: 'primary',
  read: 'info',
  in_progress: 'warning',
  resolved: 'success',
  archived: 'neutral',
};

export function OwnerStatusBadge({ status, type = 'order', className = '' }) {
  const { t } = useTranslation('common');

  const variant =
    type === 'inquiry'
      ? INQUIRY_VARIANT_MAP[status] || 'neutral'
      : ORDER_VARIANT_MAP[status] || 'neutral';

  const label = t(`status.${type}.${status}`, { defaultValue: status });

  return (
    <Badge variant={variant} dot size="sm" className={className}>
      {label}
    </Badge>
  );
}
