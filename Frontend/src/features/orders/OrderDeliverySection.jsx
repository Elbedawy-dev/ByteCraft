import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { formatDateTime } from '../../lib/format';
import { ROUTES } from '../../config/routes';
import { Badge, Button, Card } from '../../components/ui';

const DELIVERY_BADGE_MAP = {
  pending: 'warning',
  granted: 'success',
  manual: 'primary',
  failed: 'error',
};

const DELIVERY_ICON_MAP = {
  pending: 'hourglass_empty',
  granted: 'check_circle',
  manual: 'engineering',
  failed: 'error_outline',
};

export function OrderDeliverySection({ order }) {
  const { t } = useTranslation('orders');
  const { lang } = useLang();

  const repoAccess = order?.delivery?.repoAccess || 'pending';
  const grantedAt = order?.delivery?.grantedAt;
  const notes = order?.delivery?.notes;

  const badgeVariant = DELIVERY_BADGE_MAP[repoAccess] || 'neutral';
  const iconName = DELIVERY_ICON_MAP[repoAccess] || 'inventory_2';

  return (
    <Card variant="panel" padding="md" className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">deployed_code</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            {t('tracking.delivery.title')}
          </h2>
        </div>

        <Badge variant={badgeVariant} dot size="md">
          {t(`common:status.delivery.${repoAccess}`, { defaultValue: repoAccess })}
        </Badge>
      </div>

      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/70 flex items-start gap-3.5">
        <span
          className={`material-symbols-outlined text-[24px] shrink-0 mt-0.5 ${
            repoAccess === 'failed'
              ? 'text-error'
              : repoAccess === 'granted'
                ? 'text-primary'
                : 'text-on-surface-variant'
          }`}
        >
          {iconName}
        </span>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-on-surface">
            {t(`tracking.delivery.states.${repoAccess}.title`)}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t(`tracking.delivery.states.${repoAccess}.description`)}
          </p>

          {grantedAt && (
            <p className="text-xs font-mono text-primary pt-1">
              {t('tracking.delivery.grantedAt', {
                date: formatDateTime(grantedAt, lang),
              })}
            </p>
          )}

          {notes && (
            <div className="mt-2.5 p-3 rounded-lg bg-surface-container-low border border-outline-variant/70 text-xs sm:text-sm">
              <span className="font-semibold text-on-surface block mb-0.5">
                {t('tracking.delivery.notesLabel')}
              </span>
              <p className="text-on-surface-variant whitespace-pre-line">{notes}</p>
            </div>
          )}

          {repoAccess === 'failed' && (
            <div className="pt-2">
              <Button
                to={ROUTES.CONTACT}
                variant="outline"
                size="sm"
              >
                  {t('tracking.payment.card.contactSupport')}
                </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
