import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { contactPath } from '@/config/routes';
import { Button } from '@/components/ui/Button';

const ACCENT_CLASSES = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
};

export function ServicePlanCard({ plan, accent = 'primary' }) {
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

  const accentTextClass = ACCENT_CLASSES[accent] || ACCENT_CLASSES.primary;
  const ctaLabel = isPopular ? t('card.ctaPopular') : t('card.ctaDefault');

  return (
    <article
      className={clsx(
        'relative rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1',
        isPopular
          ? 'bg-surface-container border border-primary/50 shadow-primary-glow'
          : 'bg-surface-container-low border border-outline-variant/80 hover:border-outline shadow-md'
      )}
    >
      {/* Floating Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center pointer-events-none">
          <span className="btn-primary-gradient px-4 py-1 rounded-full text-label-md font-bold shadow-md inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              local_fire_department
            </span>
            <span>{t('card.popular')}</span>
          </span>
        </div>
      )}

      <div>
        {/* Card Header: Name + Delivery Days Badge */}
        <div className={clsx('flex items-start justify-between gap-3 mb-4', isPopular && 'mt-1')}>
          <h3
            className={clsx(
              'text-headline-md font-bold leading-snug',
              isPopular ? 'text-primary' : 'text-on-surface'
            )}
          >
            {planName}
          </h3>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/60 font-code text-label-code text-on-surface-variant shrink-0">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              schedule
            </span>
            <span>{t('card.deliveryDays', { count: deliveryDays })}</span>
          </span>
        </div>

        {/* Starting Price */}
        <div className="mb-5">
          <span className="block text-label-md text-on-surface-variant mb-1">
            {t('card.startingFrom')}
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {lang === 'en' && (
              <span className={clsx('text-body-md font-bold', accentTextClass)}>
                EGP
              </span>
            )}
            <bdi
              dir="ltr"
              className="text-headline-xl font-extrabold text-on-surface font-code tabular-nums tracking-tight"
            >
              {numericPrice}
            </bdi>
            {lang !== 'en' && (
              <span className={clsx('text-body-md font-bold', accentTextClass)}>
                ج.م
              </span>
            )}
          </div>

          {planDescription && (
            <p className="text-body-sm text-on-surface-variant mt-2.5 leading-relaxed">
              {planDescription}
            </p>
          )}
        </div>

        <div className="w-full h-px bg-outline-variant/50 mb-5" aria-hidden="true" />

        {/* Feature List */}
        {features.length > 0 ? (
          <ul className="space-y-3 mb-7 list-none p-0 m-0">
            {features.map((featureText, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span
                  className={clsx(
                    'material-symbols-outlined text-[20px] shrink-0 mt-0.5',
                    accentTextClass
                  )}
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span className="text-body-md text-on-surface leading-relaxed">
                  {featureText}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-on-surface-variant mb-7 leading-relaxed">
            {t('card.noFeatures')}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Link
        to={contactPath({ plan: plan.id })}
        aria-label={t('card.ctaAria', { action: ctaLabel, name: planName })}
        className="block w-full mt-auto"
      >
        <Button
          variant={isPopular ? 'primary-gradient' : 'secondary'}
          size="md"
          className="w-full font-bold"
          tabIndex={-1}
        >
          {ctaLabel}
        </Button>
      </Link>
    </article>
  );
}
