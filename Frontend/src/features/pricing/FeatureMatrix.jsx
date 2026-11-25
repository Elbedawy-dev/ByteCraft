import React, { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '@/app/providers';
import { localized } from '@/lib/localized';
import { formatMoney } from '@/lib/money';
import { contactPath } from '@/config/routes';
import { SectionHeader } from '@/components/shared';

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

  const uniqueFeatures = useMemo(
    () => collectUniquePlanFeatures(plans, lang, 8),
    [plans, lang]
  );

  return (
    <section className="my-14 lg:my-20 space-y-8">
      {/* Soft Card Container for Technical Baseline + Comparison Table */}
      <div className="rounded-2xl bg-section-band border border-card-border p-6 sm:p-8 lg:p-10 space-y-8">
        <SectionHeader
          align="start"
          badge={t('matrix.eyebrow')}
          title={plans.length >= 2 ? t('matrix.tableTitle') : t('matrix.title')}
          subtitle={plans.length >= 2 ? t('matrix.tableSubtitle') : t('matrix.description')}
        />

        {plans.length >= 2 && (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby={captionId}
            className="w-full overflow-x-auto rounded-xl border border-card-border bg-card shadow-card focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[600px] border-separate border-spacing-0 text-start text-sm">
              <caption id={captionId} className="sr-only">
                {t('matrix.tableCaption')}
              </caption>
              <thead>
                <tr className="bg-section-band text-on-surface">
                  <th
                    scope="col"
                    className="sticky start-0 z-20 bg-section-band py-4 px-4 sm:px-5 text-start font-bold text-sm border-b border-e border-card-border min-w-[200px]"
                  >
                    {t('matrix.featureCol')}
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className={clsx(
                        'py-4 px-4 text-center font-bold text-sm border-b border-card-border min-w-[150px]',
                        plan.isPopular && 'bg-brand-soft/70 text-primary'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{localized(plan.name, lang)}</span>
                        {plan.isPopular && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full btn-primary-gradient text-white text-[10px] font-bold">
                            {t('card.popular')}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-card-border">
                {/* Starting Price */}
                <tr>
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-card py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-card-border"
                  >
                    {t('matrix.rows.startingPrice')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-price`}
                      className={clsx(
                        'py-3.5 px-4 text-center font-mono font-bold text-primary whitespace-nowrap',
                        plan.isPopular && 'bg-brand-soft/25'
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
                    className="sticky start-0 z-10 bg-card py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-card-border"
                  >
                    {t('matrix.rows.delivery')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-days`}
                      className={clsx(
                        'py-3.5 px-4 text-center text-on-surface-variant whitespace-nowrap',
                        plan.isPopular && 'bg-brand-soft/25'
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
                    className="sticky start-0 z-10 bg-card py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-card-border"
                  >
                    {t('matrix.rows.sourceCode')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-source`}
                      className={clsx(
                        'py-3.5 px-4 text-center text-primary font-mono font-semibold whitespace-nowrap',
                        plan.isPopular && 'bg-brand-soft/25'
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-rounded icon-gradient text-[18px]" aria-hidden="true">
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
                    className="sticky start-0 z-10 bg-card py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-card-border"
                  >
                    {t('matrix.rows.guarantee')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-guarantee`}
                      className={clsx(
                        'py-3.5 px-4 text-center text-on-surface-variant whitespace-nowrap',
                        plan.isPopular && 'bg-brand-soft/25'
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
                    className="sticky start-0 z-10 bg-card py-3.5 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-card-border"
                  >
                    {t('matrix.rows.responsive')}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.id}-rtl`}
                      className={clsx(
                        'py-3.5 px-4 text-center',
                        plan.isPopular && 'bg-brand-soft/25'
                      )}
                    >
                      <span className="material-symbols-rounded icon-gradient text-[20px]" aria-hidden="true">
                        check_circle
                      </span>
                      <span className="sr-only">{t('matrix.rows.included')}</span>
                    </td>
                  ))}
                </tr>

                {/* Dynamic Feature Rows */}
                {uniqueFeatures.map((feat) => (
                  <tr key={feat.key} className="even:bg-section-band/40">
                    <th
                      scope="row"
                      className="sticky start-0 z-10 bg-card py-3.5 px-4 sm:px-5 text-start font-medium text-on-surface-variant border-e border-card-border"
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
                            plan.isPopular && 'bg-brand-soft/25'
                          )}
                        >
                          {hasIt ? (
                            <>
                              <span
                                className="material-symbols-rounded icon-gradient text-[20px]"
                                aria-hidden="true"
                              >
                                check_circle
                              </span>
                              <span className="sr-only">{t('matrix.rows.included')}</span>
                            </>
                          ) : (
                            <>
                              <span
                                className="material-symbols-rounded text-muted/60 text-[20px]"
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
                    className="sticky start-0 z-10 bg-card py-4 px-4 sm:px-5 text-start font-semibold text-on-surface border-e border-card-border"
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
                          plan.isPopular && 'bg-brand-soft/25'
                        )}
                      >
                        <Link
                          to={contactPath({ plan: plan.id })}
                          aria-label={t('card.ctaAria', { action: label, name: planName })}
                          className={clsx(
                            'inline-flex items-center justify-center min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap',
                            plan.isPopular
                              ? 'btn-primary-gradient text-white'
                              : 'bg-surface text-primary border border-primary/45 hover:bg-brand-soft'
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
        )}
      </div>
    </section>
  );
}
