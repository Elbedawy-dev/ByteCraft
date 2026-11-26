import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { m } from 'framer-motion';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { MOTION_TRANSITION } from '@/lib/motion';
import { contactPath } from '@/config/routes';
import { Button } from '@/components/ui/Button';

export function ServicePlanCard({ plan }) {
  const { t } = useTranslation('pricing');
  const { lang } = useLang();

  const planName = localized(plan?.name, lang);
  const planDescription = localized(plan?.description, lang);
  const isPopular = Boolean(plan?.isPopular);
  const deliveryDays = Number(plan?.deliveryDays) || 1;
  const numericPrice = formatMoney(plan?.startingPrice ?? 0, lang, { includeCurrency: false });
  const features = Array.isArray(plan?.features)
    ? plan.features.map((f) => localized(f, lang)).filter(Boolean)
    : [];

  const ctaLabel = isPopular ? t('card.ctaPopular') : t('card.ctaDefault');

  const innerCard = (
    <m.article
      data-fm-hover={!isPopular ? 'true' : undefined}
      whileHover={!isPopular ? { y: -4 } : undefined}
      transition={MOTION_TRANSITION}
      className={clsx(
        'relative flex flex-col justify-between flex-1 p-6 sm:p-7 bg-card transition-colors duration-300 ease-nexus',
        isPopular
          ? 'rounded-[14px]'
          : 'bc-card-hover rounded-xl'
      )}
    >
      <div>
        {/* Card Header: Name + Delivery Days Pill */}
        <div className={clsx('flex items-start justify-between gap-3 mb-4', isPopular && 'mt-1')}>
          <h3
            className={clsx(
              'text-headline-md font-bold leading-snug',
              isPopular ? 'text-primary' : 'text-on-surface'
            )}
          >
            {planName}
          </h3>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-soft text-brand-soft-text text-xs font-semibold shrink-0">
            <span className="material-symbols-rounded text-[15px]" aria-hidden="true">
              schedule
            </span>
            <span>{t('card.deliveryDays', { count: deliveryDays })}</span>
          </span>
        </div>

        {/* Starting Price */}
        <div className="mb-5">
          <span className="block text-xs font-semibold text-muted mb-1">
            {t('card.startingFrom')}
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {lang === 'en' && (
              <span className="text-sm font-bold text-primary">
                EGP
              </span>
            )}
            <bdi
              dir="ltr"
              className="text-headline-xl font-extrabold text-on-surface font-mono tabular-nums tracking-tight"
            >
              {numericPrice}
            </bdi>
            {lang !== 'en' && (
              <span className="text-sm font-bold text-primary">
                ج.م
              </span>
            )}
          </div>

          {planDescription && (
            <p className="text-sm text-muted mt-2.5 leading-relaxed">
              {planDescription}
            </p>
          )}
        </div>

        <div className="w-full h-px bg-outline-variant mb-5" aria-hidden="true" />

        {/* Gradient-Check Feature List */}
        {features.length > 0 ? (
          <ul className="space-y-3 mb-7 list-none p-0 m-0">
            {features.map((featureText, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span
                  className="material-symbols-rounded icon-gradient text-[20px] shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span className="text-sm sm:text-base text-on-surface leading-relaxed">
                  {featureText}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted mb-7 leading-relaxed">
            {t('card.noFeatures')}
          </p>
        )}
      </div>

      {/* Pill CTA Button */}
      <Button
        to={contactPath({ plan: plan.id })}
        aria-label={t('card.ctaAria', { action: ctaLabel, name: planName })}
        variant={isPopular ? 'primary-gradient' : 'outline'}
        size="md"
        className="w-full mt-auto"
        tabIndex={-1}
        iconTrailing={
            <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
              arrow_forward
            </span>
          }
      >
          {ctaLabel}
        </Button>
    </m.article>
  );

  if (!isPopular) {
    return innerCard;
  }

  // Popular plan: 2px brand-gradient border + floating gradient pill
  return (
    <m.div
      data-fm-hover="true"
      whileHover={{ y: -4 }}
      transition={MOTION_TRANSITION}
      className="relative rounded-xl p-[2px] bg-primary-gradient shadow-card-hover flex flex-col"
    >
      <div className="absolute -top-3.5 inset-x-0 flex justify-center pointer-events-none z-10">
        <span className="btn-primary-gradient px-4 py-1 rounded-full text-xs font-bold text-white inline-flex items-center gap-1.5">
          <span className="material-symbols-rounded text-[15px]" aria-hidden="true">
            auto_awesome
          </span>
          <span>{t('card.popular')}</span>
        </span>
      </div>
      {innerCard}
    </m.div>
  );
}
