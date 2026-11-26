import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { fadeUp } from '../../lib/motion';
import { Card, Button } from '../../components/ui';
import { Stagger, StaggerItem } from '../../components/ui/Motion';
import { projectDetailsPath, ROUTES } from '../../config/routes';

const TIMELINE_STEPS = [
  { key: 'pending_payment', icon: 'payments' },
  { key: 'awaiting_review', icon: 'fact_check' },
  { key: 'paid', icon: 'verified' },
  { key: 'delivered', icon: 'deployed_code' },
];

function getStepIndex(status) {
  if (status === 'pending_payment') return 0;
  if (status === 'awaiting_review') return 1;
  if (status === 'paid') return 2;
  if (status === 'delivered') return 3;
  if (status === 'rejected') return 1;
  return -1;
}

export function OrderStatusTimeline({ order }) {
  const { t } = useTranslation('orders');
  const status = order?.status;
  const activeStepIndex = getStepIndex(status);
  const isVariantStatus = ['rejected', 'expired', 'cancelled', 'refunded'].includes(
    status
  );

  const progressPercent =
    status === 'delivered'
      ? 100
      : activeStepIndex <= 0
        ? 12
        : Math.min(100, Math.round((activeStepIndex / (TIMELINE_STEPS.length - 1)) * 100));

  const variantTone = {
    rejected: {
      wrapper: 'bg-error/10 border-error/30',
      iconBg: 'bg-chip-danger-bg text-chip-danger-fg',
      icon: 'report',
    },
    expired: {
      wrapper: 'bg-chip-amber-bg/70 border-chip-amber-border',
      iconBg: 'bc-chip-amber border',
      icon: 'schedule',
    },
    cancelled: {
      wrapper: 'bg-error/10 border-error/30',
      iconBg: 'bg-chip-danger-bg text-chip-danger-fg',
      icon: 'cancel',
    },
    refunded: {
      wrapper: 'bg-section-band border-outline-variant',
      iconBg: 'bg-brand-soft text-brand-soft-text',
      icon: 'currency_exchange',
    },
  }[status];

  return (
    <Card variant="panel" padding="md" className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">timeline</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            {t('tracking.timeline.title')}
          </h2>
        </div>

        {order?.isFreeOrder && (
          <span className="text-xs font-semibold text-brand-soft-text bg-brand-soft px-3 py-1 rounded-full">
            {t('tracking.timeline.freeOrderNote')}
          </span>
        )}
      </div>

      {/* Gradient Progress Bar */}
      <div className="w-full h-2 rounded-full bg-section-band overflow-hidden border border-outline-variant/60" aria-hidden="true">
        <div
          className={clsx(
            'h-full rounded-full transition-[width] duration-300 ease-nexus',
            status === 'rejected' || status === 'cancelled'
              ? 'bg-error'
              : 'bg-primary-gradient'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Special Variant Banner */}
      {isVariantStatus && variantTone && (
        <div
          role={status === 'rejected' || status === 'cancelled' ? 'alert' : 'status'}
          className={clsx(
            'rounded-xl border p-4 sm:p-5 flex items-start gap-3.5',
            variantTone.wrapper
          )}
        >
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              variantTone.iconBg
            )}
          >
            <span className="material-symbols-rounded text-[22px]" aria-hidden="true">
              {variantTone.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-on-surface">
              {t(`tracking.timeline.variants.${status}.title`)}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t(`tracking.timeline.variants.${status}.description`)}
            </p>

            {status === 'rejected' && order?.payment?.rejectionReason && (
              <div className="p-3 rounded-lg bg-card border border-error/30 text-xs sm:text-sm">
                <span className="font-semibold text-error">
                  {t('tracking.timeline.variants.rejected.reasonLabel')}{' '}
                </span>
                <span className="text-on-surface">
                  {order.payment.rejectionReason}
                </span>
              </div>
            )}

            {status === 'expired' && (
              <div className="pt-1">
                <Button
                  to={
                    order?.snapshot?.slug
                      ? projectDetailsPath(order.snapshot.slug)
                      : ROUTES.PROJECTS
                  }
                  variant="outline"
                  size="sm"
                >
                    {t('tracking.timeline.variants.expired.reorderCta')}
                  </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4-Step Linear Progress */}
      <Stagger as="ol" inView={false} className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted =
            status === 'delivered' ||
            (activeStepIndex > index && status !== 'rejected') ||
            (status === 'rejected' && index === 0);
          const isCurrent =
            (status === 'rejected' && index === 1) ||
            (!isVariantStatus && activeStepIndex === index && status !== 'delivered');
          const isRejectedStep = status === 'rejected' && index === 1;

          return (
            <StaggerItem
              as="li"
              variants={fadeUp}
              key={step.key}
              className={clsx(
                'relative p-4 rounded-xl border transition-colors duration-300 ease-nexus flex flex-col gap-2.5',
                isRejectedStep
                  ? 'bg-error/5 border-error/40'
                  : isCompleted
                    ? 'bg-brand-soft/45 border-primary/35'
                    : isCurrent
                      ? 'bg-card border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'bg-section-band/70 border-card-border opacity-80'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    isRejectedStep
                      ? 'bg-chip-danger-bg text-chip-danger-fg'
                      : isCompleted || isCurrent
                        ? 'btn-primary-gradient text-white'
                        : 'bg-card border border-outline-variant text-muted'
                  )}
                >
                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                    {isRejectedStep
                      ? 'close'
                      : isCompleted
                        ? 'check'
                        : step.icon}
                  </span>
                </div>

                <span className="font-mono text-[11px] font-bold text-muted">
                  0{index + 1}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {t(`tracking.timeline.steps.${step.key}.title`)}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {t(`tracking.timeline.steps.${step.key}.description`)}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Card>
  );
}
