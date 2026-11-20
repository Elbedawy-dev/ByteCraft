import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '../../components/ui';
import { projectDetailsPath, ROUTES } from '../../config/routes';

const TIMELINE_STEPS = [
  { key: 'pending_payment', icon: 'payments' },
  { key: 'awaiting_review', icon: 'fact_check' },
  { key: 'paid', icon: 'verified' },
  { key: 'delivered', icon: 'rocket_launch' },
];

function getStepIndex(status) {
  if (status === 'pending_payment') return 0;
  if (status === 'awaiting_review') return 1;
  if (status === 'paid') return 2;
  if (status === 'delivered') return 3;
  if (status === 'rejected') return 1; // Stuck at review step
  return -1;
}

export function OrderStatusTimeline({ order }) {
  const { t } = useTranslation('orders');
  const status = order?.status;
  const activeStepIndex = getStepIndex(status);
  const isVariantStatus = ['rejected', 'expired', 'cancelled', 'refunded'].includes(
    status
  );

  const variantTone = {
    rejected: {
      wrapper: 'bg-error/10 border-error/30',
      iconBg: 'bg-error/15 text-error',
      icon: 'report',
    },
    expired: {
      wrapper: 'bg-amber-500/10 border-amber-500/30',
      iconBg: 'bg-amber-500/15 text-amber-400',
      icon: 'schedule',
    },
    cancelled: {
      wrapper: 'bg-error/10 border-error/30',
      iconBg: 'bg-error/15 text-error',
      icon: 'cancel',
    },
    refunded: {
      wrapper: 'bg-surface-container-high border-outline-variant',
      iconBg: 'bg-surface-container text-on-surface-variant',
      icon: 'currency_exchange',
    },
  }[status];

  return (
    <Card variant="flat" padding="md" className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/70 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">timeline</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            {t('tracking.timeline.title')}
          </h2>
        </div>

        {order?.isFreeOrder && (
          <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/25 px-3 py-1 rounded-full">
            {t('tracking.timeline.freeOrderNote')}
          </span>
        )}
      </div>

      {/* Special Variant Banner (rejected / expired / cancelled / refunded) */}
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
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              variantTone.iconBg
            )}
          >
            <span className="material-symbols-outlined text-[22px]">
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
              <div className="p-3 rounded-lg bg-surface-container border border-error/30 text-xs sm:text-sm">
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
                <Link
                  to={
                    order?.snapshot?.slug
                      ? projectDetailsPath(order.snapshot.slug)
                      : ROUTES.PROJECTS
                  }
                >
                  <Button variant="outline" size="sm">
                    {t('tracking.timeline.variants.expired.reorderCta')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4-Step Linear Progress */}
      <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
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
            <li
              key={step.key}
              className={clsx(
                'relative p-4 rounded-xl border transition-colors flex flex-col gap-2.5',
                isRejectedStep
                  ? 'bg-error/5 border-error/40'
                  : isCompleted
                    ? 'bg-primary/5 border-primary/35'
                    : isCurrent
                      ? 'bg-surface-container border-primary shadow-sm'
                      : 'bg-surface-container/50 border-outline-variant/60 opacity-75'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    isRejectedStep
                      ? 'bg-error/15 text-error'
                      : isCompleted
                        ? 'bg-primary text-on-primary'
                        : isCurrent
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isRejectedStep
                      ? 'close'
                      : isCompleted
                        ? 'check'
                        : step.icon}
                  </span>
                </div>

                <span className="font-mono text-[11px] font-semibold text-on-surface-variant">
                  0{index + 1}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  {t(`tracking.timeline.steps.${step.key}.title`)}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t(`tracking.timeline.steps.${step.key}.description`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
