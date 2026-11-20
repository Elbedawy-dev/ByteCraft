import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useLang } from '@/app/providers';
import { useServicePlans } from '@/api/servicePlans';
import { useMeta } from '@/api/meta';
import { ROUTES, contactPath } from '@/config/routes';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { getGroupMeta, groupServicePlans } from '@/features/pricing/groupConfig';
import { ServicePlanCard } from '@/features/pricing/ServicePlanCard';
import { ServicePlanSkeleton } from '@/features/pricing/ServicePlanSkeleton';
import { FeatureMatrix } from '@/features/pricing/FeatureMatrix';
import { CustomSolutionBanner } from '@/features/pricing/CustomSolutionBanner';
import { PricingFaq } from '@/features/pricing/PricingFaq';

const PILLAR_ICON_ACCENTS = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
};

const GROUP_ACCENT_TEXT = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
};

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const { dir } = useLang();
  const { data: plans = [], isLoading, isError, error, refetch } = useServicePlans();
  const { data: meta } = useMeta();

  const [activeGroup, setActiveGroup] = useState('all');
  const tabRefs = useRef(new Map());

  useEffect(() => {
    document.title = t('meta.title');
  }, [t]);

  const groupedPlans = useMemo(() => groupServicePlans(plans), [plans]);

  const effectiveGroup = useMemo(() => {
    if (activeGroup === 'all') return 'all';
    const exists = groupedPlans.some((g) => g.group === activeGroup);
    return exists ? activeGroup : 'all';
  }, [activeGroup, groupedPlans]);

  const tabs = useMemo(() => {
    if (groupedPlans.length <= 1) return [];
    return [
      {
        id: 'all',
        label: t('tabs.allLabel'),
        icon: 'apps',
        count: plans.length,
      },
      ...groupedPlans.map((entry) => {
        const groupMeta = getGroupMeta(entry.group, t);
        return {
          id: entry.group,
          label: groupMeta.tabLabel,
          icon: groupMeta.icon,
          count: entry.plans.length,
        };
      }),
    ];
  }, [groupedPlans, plans.length, t]);

  const visibleGroups = useMemo(() => {
    if (effectiveGroup === 'all') return groupedPlans;
    return groupedPlans.filter((entry) => entry.group === effectiveGroup);
  }, [effectiveGroup, groupedPlans]);

  const visiblePlans = useMemo(
    () => visibleGroups.flatMap((entry) => entry.plans),
    [visibleGroups]
  );

  const selectTab = (tabId, { focusTab = false } = {}) => {
    setActiveGroup(tabId);
    const el = tabRefs.current.get(tabId);
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (focusTab) el.focus();
    }
  };

  const handleTabKeyDown = (event, currentIndex) => {
    if (tabs.length === 0) return;
    const isRtl = dir === 'rtl';
    let nextIndex = null;

    if (event.key === 'ArrowRight') {
      nextIndex = isRtl
        ? (currentIndex - 1 + tabs.length) % tabs.length
        : (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = isRtl
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      selectTab(tabs[nextIndex].id, { focusTab: true });
    }
  };

  const rawPillars = t('pillars', { returnObjects: true });
  const pillars = Array.isArray(rawPillars) ? rawPillars : [];

  const whatsappNumber = typeof meta?.contact?.whatsapp === 'string'
    ? meta.contact.whatsapp.replace(/[^0-9]/g, '')
    : '';
  const guaranteeDays = Number(meta?.guaranteeDays) || 30;

  return (
    <div className="relative w-full overflow-x-clip bg-surface-container-lowest">
      {/* Ambient Background Glows */}
      <div
        className="absolute top-0 end-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-52 start-10 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-14 relative z-10">
        {/* 1. Centered Hero + Group Tabs */}
        <header className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/60 text-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              verified
            </span>
            <span className="font-code text-label-code">
              <bdi dir="ltr">{t('hero.badge')}</bdi>
            </span>
          </div>

          <h1 className="text-headline-xl-mobile sm:text-headline-xl lg:text-display-lg text-on-surface font-extrabold tracking-tight mb-3">
            {t('hero.title')}
          </h1>

          <p className="text-body-md sm:text-body-lg text-on-surface-variant leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* Group Switcher Tabs (single-row scrollable container per modern-web-guidance: tabs) */}
          {tabs.length > 0 && (
            <div className="w-full flex justify-center mt-7">
              <div
                role="tablist"
                aria-label={t('tabs.ariaLabel')}
                className="inline-flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar p-1.5 rounded-xl bg-surface-container-low border border-outline-variant/60 shadow-sm"
              >
                {tabs.map((tab, index) => {
                  const isSelected = effectiveGroup === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        if (el) tabRefs.current.set(tab.id, el);
                        else tabRefs.current.delete(tab.id);
                      }}
                      id={`pricing-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => selectTab(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(e, index)}
                      className={clsx(
                        'relative flex-none min-h-[44px] px-4 sm:px-5 py-2 rounded-lg text-label-lg transition-colors whitespace-nowrap flex items-center gap-2',
                        isSelected
                          ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 font-medium'
                      )}
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 rounded-full font-code text-[11px]',
                          isSelected
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        <bdi dir="ltr">{tab.count}</bdi>
                      </span>
                      {isSelected && (
                        <span
                          className="absolute bottom-0 inset-x-3 border-b-2 border-primary"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* 2. 3 Value-Prop Pillars */}
        {pillars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-12">
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center gap-4 shadow-sm"
              >
                <div
                  className={clsx(
                    'w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/50 flex items-center justify-center shrink-0',
                    PILLAR_ICON_ACCENTS[pillar.accent] || PILLAR_ICON_ACCENTS.primary
                  )}
                >
                  <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                    {pillar.icon}
                  </span>
                </div>
                <div>
                  <div className="text-body-lg text-on-surface font-bold leading-snug">
                    {pillar.title}
                  </div>
                  <div className="text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                    {pillar.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Real Service Plans Panel */}
        <div
          role={tabs.length > 0 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 0 ? `pricing-tab-${effectiveGroup}` : undefined}
          className="space-y-14"
        >
          {isLoading ? (
            <ServicePlanSkeleton />
          ) : isError ? (
            <ErrorState message={error?.message} onRetry={refetch} />
          ) : visibleGroups.length === 0 ? (
            <EmptyState
              icon="sell"
              title={t('empty.title')}
              description={t('empty.description')}
              action={
                <Link to={ROUTES.CONTACT}>
                  <Button variant="primary-gradient" size="md">
                    {t('empty.cta')}
                  </Button>
                </Link>
              }
            />
          ) : (
            visibleGroups.map((groupEntry) => {
              const groupMeta = getGroupMeta(groupEntry.group, t);
              const count = groupEntry.plans.length;
              const gridLayoutClass =
                count === 1
                  ? 'grid grid-cols-1 max-w-lg mx-auto gap-6 pt-4'
                  : count === 2
                    ? 'grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 pt-4'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch pt-4';

              return (
                <section
                  key={groupEntry.group}
                  aria-labelledby={`group-heading-${groupEntry.group}`}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div
                        className={clsx(
                          'font-code text-label-code uppercase tracking-wider mb-1',
                          GROUP_ACCENT_TEXT[groupMeta.accent] || GROUP_ACCENT_TEXT.primary
                        )}
                      >
                        <bdi dir="ltr">{groupMeta.eyebrow}</bdi>
                      </div>
                      <h2
                        id={`group-heading-${groupEntry.group}`}
                        className="text-headline-lg text-on-surface font-bold"
                      >
                        {groupMeta.title}
                      </h2>
                    </div>
                    <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">
                      {groupMeta.description}
                    </p>
                  </div>

                  <div className={gridLayoutClass}>
                    {groupEntry.plans.map((plan) => (
                      <ServicePlanCard
                        key={plan.id}
                        plan={plan}
                        accent={groupMeta.accent}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        {/* 4. Feature Matrix & Side-by-Side Comparison */}
        <FeatureMatrix plans={visiblePlans} guaranteeDays={guaranteeDays} />

        {/* 5. Custom Solution Banner */}
        <CustomSolutionBanner />

        {/* 6. FAQ Accordion */}
        <PricingFaq />

        {/* 7. Bottom Help Strip */}
        <div className="p-6 sm:p-7 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-start shadow-sm">
          <div>
            <div className="text-body-lg text-on-surface font-bold">
              {t('helpStrip.title')}
            </div>
            <div className="text-body-sm text-on-surface-variant mt-1">
              {t('helpStrip.subtitle')}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:text-primary hover:border-primary/60 text-label-lg font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                  chat
                </span>
                <span>{t('helpStrip.whatsappCta')}</span>
              </a>
            )}

            <Link
              to={contactPath({ type: 'consulting' })}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary text-label-lg font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                headset_mic
              </span>
              <span>{t('helpStrip.cta')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
