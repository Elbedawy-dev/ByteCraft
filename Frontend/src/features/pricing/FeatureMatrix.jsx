import React, { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { contactPath } from '@/config/routes';

function collectUniquePlanFeatures(plans, lang, limit = 8) {
  const seen = new Map();

  for (const plan of plans) {
    const rawFeatures = Array.isArray(plan?.features) ? plan.features : [];
    for (const feat of rawFeatures) {
      const label = localized(feat, lang).trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { key, label });
      }
      if (seen.size >= limit) {
        return Array.from(seen.values());
      }
    }
  }

  return Array.from(seen.values());
}

function planHasFeature(plan, featureKey, lang) {
  const rawFeatures = Array.isArray(plan?.features) ? plan.features : [];
  return rawFeatures.some((f) => localized(f, lang).trim().toLowerCase() === featureKey);
}

export function FeatureMatrix({ plans = [], guaranteeDays = 30 }) {
  const { t } = useTranslation('pricing');
  const { lang } = useLang();
  const captionId = useId();

  const rawMetrics = t('matrix.metrics', { returnObjects: true });
  const metrics = Array.isArray(rawMetrics) ? rawMetrics : [];

  const uniqueFeatures = useMemo(
    () => collectUniquePlanFeatures(plans, lang, 8),
    [plans, lang]
  );

  return (
    <section className="my-12 sm:my-14 space-y-6">
      {/* Lighthouse & Technical Baseline Card (Stitch bytecraft_4) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-5 sm:p-6 rounded-xl bg-surface-container border border-outline-variant/50">
          <div className="space-y-1.5 max-w-xl">
            <span className="font-code text-label-code text-primary uppercase tracking-wider block">
              <bdi dir="ltr">{t('matrix.eyebrow')}</bdi>
            </span>
            <h2 className="text-headline-md font-bold text-on-surface">
              {t('matrix.title')}
            </h2>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {t('matrix.description')}
            </p>
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <div className="flex justify-between items-center mb-1.5 gap-2">
              <span className="text-body-sm text-on-surface font-medium">
                {t('matrix.lighthouseLabel')}
              </span>
              <span className="font-code text-label-code text-primary font-bold">
                <bdi dir="ltr">{t('matrix.lighthouseScore')}</bdi>
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={98}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('matrix.lighthouseLabel')}
              className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden"
            >
              <div
                className="h-full bg-primary-gradient rounded-full"
                style={{ width: '98%' }}
              />
            </div>

            <div className="flex justify-between items-center text-on-surface-variant font-code text-label-code mt-2">
              {metrics.map((metric, idx) => (
                <span key={idx}>
                  {metric.label}: <bdi dir="ltr">{metric.value}</bdi>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix when 2+ plans exist */}
      {plans.length >= 2 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h3 className="text-headline-md font-bold text-on-surface">
                {t('matrix.tableTitle')}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {t('matrix.tableSubtitle')}
              </p>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby={captionId}
            className="w-full overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low shadow-sm focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[600px] border-separate border-spacing-0 text-start text-sm">
              <caption id={captionId} className="sr-only">
                {t('matrix.tableCaption')}
              </caption>
              <thead>
                <tr className="bg-surface-container text-on-surface">
                  <th
                    scope="col"
                    className="sticky start-0 z-20 bg-surface-container py-4 px-4 sm:px-5 text-start font-bold text-label-lg border-b border-e border-outline-variant/70 min-w-[200px]"
                  >
                    {t('matrix.featureCol')}
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className={clsx(
                        'py-4 px-4 text-center font-bold text-label-lg border-b border-outline-variant/70 min-w-[150px]',
                        plan.isPopular && 'bg-primary/5 text-primary'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{localized(plan.name, lang)}</span>
                        {plan.isPopular && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary font-code text-[11px] font-semibold">
                            {t('card.popular')}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/50">
                {/* Starting Price */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface-container-low py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-outline-variant/60"
                  >
                    {t('matrix.rows.startingPrice')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-price`}
                      className={clsx(
                        'py-3.5 px-4 text-center font-code font-bold text-on-surface whitespace-nowrap',
                        plan.isPopular && 'bg-primary/5'
                      )}
                    >
                      {formatMoney(plan.startingPrice ?? 0, lang)}
                    </td>
                  ))}
                </tr>

                {/* Delivery Days */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface-container-low py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-outline-variant/60"
                  >
                    {t('matrix.rows.delivery')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-days`}
                      className={clsx(
                        'py-3.5 px-4 text-center text-on-surface-variant whitespace-nowrap',
                        plan.isPopular && 'bg-primary/5'
                      )}
                    >
                      {t('matrix.rows.deliveryValue', { count: Number(plan.deliveryDays) || 1 })}
                    </td>
                  ))}
                </tr>

                {/* Full Source Code Ownership */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface-container-low py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-outline-variant/60"
                  >
                    {t('matrix.rows.sourceCode')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-source`}
                      className={clsx(
                        'py-3.5 px-4 text-center text-primary font-code font-semibold whitespace-nowrap',
                        plan.isPopular && 'bg-primary/5'
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          check_circle
                        </span>
                        <bdi dir="ltr">{t('matrix.rows.sourceCodeValue')}</bdi>
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Guarantee Days */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface-container-low py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-outline-variant/60"
                  >
                    {t('matrix.rows.guarantee')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-guarantee`}
                      className={clsx(
                        'py-3.5 px-4 text-center text-on-surface-variant whitespace-nowrap',
                        plan.isPopular && 'bg-primary/5'
                      )}
                    >
                      {t('matrix.rows.guaranteeDays', { count: guaranteeDays })}
                    </td>
                  ))}
                </tr>

                {/* Bilingual RTL/LTR & Dark/Light */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface-container-low py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-outline-variant/60"
                  >
                    {t('matrix.rows.responsive')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-rtl`}
                      className={clsx(
                        'py-3.5 px-4 text-center',
                        plan.isPopular && 'bg-primary/5'
                      )}
                    >
                      <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">
                        check_circle
                      </span>
                      <span className="sr-only">{t('matrix.rows.included')}</span>
                    </td>
                  ))}
                </tr>

                {/* Dynamic Feature Rows extracted from active plans */}
                {uniqueFeatures.map((feat) => (
                  <tr key={feat.key}>
                    <th
                      scope="row"
                      className="sticky start-0 z-10 bg-surface-container-low py-3.5 px-4 sm:px-5 text-start font-medium text-on-surface-variant border-e border-outline-variant/60"
                    >
                      {feat.label}
                    </th>
                    {plans.map((plan) => {
                      const hasIt = planHasFeature(plan, feat.key, lang);
                      return (
                        <td
                          key={`${plan.id}-${feat.key}`}
                          className={clsx(
                            'py-3.5 px-4 text-center',
                            plan.isPopular && 'bg-primary/5'
                          )}
                        >
                          {hasIt ? (
                            <>
                              <span
                                className="material-symbols-outlined text-primary text-[20px]"
                                aria-hidden="true"
                              >
                                check_circle
                              </span>
                              <span className="sr-only">{t('matrix.rows.included')}</span>
                            </>
                          ) : (
                            <>
                              <span
                                className="material-symbols-outlined text-outline text-[20px]"
                                aria-hidden="true"
                              >
                                remove
                              </span>
                              <span className="sr-only">{t('matrix.rows.notIncluded')}</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Action Row */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface-container-low py-4 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-outline-variant/60"
                  >
                    {t('matrix.rows.selectPlan')}
                  </th>
                  {plans.map((plan) => {
                    const planName = localized(plan.name, lang);
                    const label = t('matrix.rows.selectPlan');
                    return (
                      <td
                        key={`${plan.id}-cta`}
                        className={clsx(
                          'py-4 px-4 text-center',
                          plan.isPopular && 'bg-primary/5'
                        )}
                      >
                        <Link
                          to={contactPath({ plan: plan.id })}
                          aria-label={t('card.ctaAria', { action: label, name: planName })}
                          className={clsx(
                            'inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-label-md font-bold transition-all whitespace-nowrap',
                            plan.isPopular
                              ? 'btn-primary-gradient'
                              : 'bg-surface-container-high text-on-surface border border-outline-variant hover:border-primary/60 hover:text-primary'
                          )}
                        >
                          {label}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
