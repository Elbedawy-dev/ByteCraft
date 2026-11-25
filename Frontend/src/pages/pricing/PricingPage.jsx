import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { LayoutGroup, m } from 'framer-motion';
import { useLang } from '@/app/providers';
import { useServicePlans } from '@/api/servicePlans';
import { useMeta } from '@/api/meta';
import { ROUTES } from '@/config/routes';
import { MOTION_TRANSITION, fade, slideFromEnd } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { LayoutMotion, Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';
import { EmptyState, ErrorState, HeroCubes, SectionHeader } from '@/components/shared';
import { getGroupMeta, groupServicePlans } from '@/features/pricing/groupConfig';
import { ServicePlanCard } from '@/features/pricing/ServicePlanCard';
import { ServicePlanSkeleton } from '@/features/pricing/ServicePlanSkeleton';
import { FeatureMatrix } from '@/features/pricing/FeatureMatrix';
import { CustomSolutionBanner } from '@/features/pricing/CustomSolutionBanner';
import { PricingFaq } from '@/features/pricing/PricingFaq';

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const { dir } = useLang();
  const { data: plans = [], isLoading, isError, error, refetch } = useServicePlans();
  const { data: meta } = useMeta();

  const [activeGroup, setActiveGroup] = useState('all');
  const tabRefs = useRef(new Map());

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
  const guaranteeDays = Number(meta?.guaranteeDays) || 30;

  return (
    <div className="relative w-full overflow-x-clip flex-1 flex flex-col">
      {/* 1. Hero Header + Group Pill Chips */}
      <div className="relative w-full bc-hero-wash py-14 lg:py-20 border-b border-outline-variant overflow-hidden">
        <Reveal
          variants={slideFromEnd}
          custom={dir}
          aria-hidden="true"
          className="hidden xl:block pointer-events-none absolute top-10 end-10 w-44 opacity-55 dark:opacity-35"
        >
          <HeroCubes className="w-full h-auto rtl:-scale-x-100" />
        </Reveal>

        <Reveal variants={fade} className="relative z-10 max-w-container mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          <SectionHeader
            align="center"
            as="h1"
            badge={t('hero.badge')}
            title={t('hero.title')}
            subtitle={t('hero.subtitle')}
          />

          {tabs.length > 0 && (
            <div className="w-full flex justify-center mt-8">
              <LayoutMotion>
                <LayoutGroup id="pricing-group-tabs">
                  <div
                    role="tablist"
                    aria-label={t('tabs.ariaLabel')}
                    className="flex flex-wrap items-center justify-center gap-2.5"
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
                            'relative min-h-[42px] px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 ease-nexus whitespace-nowrap inline-flex items-center gap-2 border select-none',
                            isSelected
                              ? 'text-white border-transparent'
                              : 'bg-card border-outline-variant text-on-surface-variant hover:bg-brand-soft hover:text-primary'
                          )}
                        >
                          {isSelected && (
                            <m.span
                              layoutId="pricing-group-pill"
                              transition={MOTION_TRANSITION}
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full btn-primary-gradient"
                            />
                          )}
                          <span className="relative z-10 material-symbols-rounded text-[18px]" aria-hidden="true">
                            {tab.icon}
                          </span>
                          <span className="relative z-10">{tab.label}</span>
                          <span
                            className={clsx(
                              'relative z-10 px-2 py-0.5 rounded-full font-mono text-[11px] font-bold',
                              isSelected
                                ? 'bg-white text-[#3A3F8F]'
                                : 'bg-section-band text-muted'
                            )}
                          >
                            <bdi dir="ltr">{tab.count}</bdi>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </LayoutGroup>
              </LayoutMotion>
            </div>
          )}
        </Reveal>
      </div>

      {/* Main Content Container */}
      <div className="max-w-container w-full mx-auto px-4 sm:px-6 py-14 lg:py-20 flex-1">
        {/* 2. 3 Value-Prop Pillars */}
        {pillars.length > 0 && (
          <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {pillars.map((pillar) => (
              <StaggerItem
                key={pillar.id}
                className="p-6 rounded-xl bg-card border border-card-border flex items-start gap-4 shadow-card"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded icon-gradient text-[26px]" aria-hidden="true">
                    {pillar.icon}
                  </span>
                </div>
                <div>
                  <div className="text-base font-bold text-on-surface leading-snug">
                    {pillar.title}
                  </div>
                  <div className="text-sm text-muted mt-1 leading-relaxed">
                    {pillar.description}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* 3. 3-Column Service Plans Grid */}
        <div
          role={tabs.length > 0 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 0 ? `pricing-tab-${effectiveGroup}` : undefined}
          className="space-y-16"
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
                  <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div id={`group-heading-${groupEntry.group}`}>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-soft text-brand-soft-text mb-2">
                        <bdi dir="ltr">{groupMeta.eyebrow}</bdi>
                      </span>
                      <h2 className="text-headline-lg text-on-surface font-bold">
                        {groupMeta.title}
                      </h2>
                    </div>
                    <p className="text-body-md text-muted max-w-md">
                      {groupMeta.description}
                    </p>
                  </Reveal>

                  <Stagger key={`${effectiveGroup}-${groupEntry.group}`} inView={false} className={gridLayoutClass}>
                    {groupEntry.plans.map((plan) => (
                      <StaggerItem key={plan.id} className="flex">
                        <ServicePlanCard
                          plan={plan}
                          accent={groupMeta.accent}
                        />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </section>
              );
            })
          )}
        </div>

        {/* 4. Comparison Table in a Soft Card */}
        <Reveal>
          <FeatureMatrix plans={visiblePlans} guaranteeDays={guaranteeDays} />
        </Reveal>

        {/* 5. FAQ Accordion */}
        <Reveal>
          <PricingFaq />
        </Reveal>
      </div>

      {/* 6. Custom-Solution CTA Band */}
      <CustomSolutionBanner />
    </div>
  );
}
