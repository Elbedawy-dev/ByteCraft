import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { formatNumber } from '../../../lib/format';
import { ROUTES } from '../../../config/routes';
import { Rating } from '../../../components/shared/Rating';
import { Reveal, Stagger, StaggerItem } from '../../../components/ui/Motion';

export function ProjectTitleBar({ project }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  const title = localized(project?.title, lang);
  const tagline = localized(project?.tagline, lang);
  const categoryName = localized(project?.category?.name, lang);
  const categoryKey = project?.category?.key;
  const avgRating = project?.reviewsSummary?.average || 0;
  const reviewsCount = project?.reviewsSummary?.count || 0;

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {categoryName && (
            <Link
              to={`${ROUTES.PROJECTS}?category=${encodeURIComponent(categoryKey || '')}`}
              className="px-3.5 py-1.5 rounded-full bg-brand-soft border border-chip-mint-border text-brand-soft-text font-semibold text-xs hover:border-primary transition-colors"
            >
              {categoryName}
            </Link>
          )}
          {project?.isFeatured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-section-band border border-outline-variant text-on-surface text-xs font-semibold">
              <span className="material-symbols-rounded text-[15px] text-star" aria-hidden="true">
                workspace_premium
              </span>
              <span>{t('badges.featured')}</span>
            </span>
          )}
        </div>

        <a
          href="#reviews"
          className="inline-flex items-center gap-2 bg-card border border-card-border shadow-card hover:border-primary/45 px-3.5 py-1.5 rounded-full transition-colors"
        >
          <Rating rating={avgRating} showCount={false} size="sm" />
          <span className="text-muted text-xs font-medium">
            {t('ratings.count', { count: reviewsCount })}
          </span>
        </a>
      </div>

      <h1 className="text-headline-xl-mobile sm:text-headline-xl font-extrabold text-on-surface tracking-tight leading-tight">
        {title}
      </h1>

      {tagline && (
        <p className="text-body-md sm:text-body-lg text-muted max-w-3xl">
          {tagline}
        </p>
      )}
    </section>
  );
}

export function ProjectHeader({ project, selectedPackage, guaranteeDays = 30 }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  const description = localized(project?.description, lang);
  const purchasesCount = project?.stats?.purchases || 0;
  const viewsCount = project?.stats?.views || 0;
  const supportDays = selectedPackage?.supportDays ?? guaranteeDays;
  const licenseLabel =
    selectedPackage?.licenseType === 'multi'
      ? t('packages.multiLicense')
      : t('packages.singleLicense');
  const techCount = Array.isArray(project?.techStack) ? project.techStack.length : 0;

  return (
    <>
      {/* 4 Real Data Highlight Tiles */}
      <Stagger as="section" className="grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label={t('sections.overviewTitle')}>
        <StaggerItem className="p-4 sm:p-5 rounded-xl bg-section-band border border-card-border flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
              {purchasesCount > 0 ? 'shopping_bag' : 'visibility'}
            </span>
          </div>
          <span className="text-lg sm:text-xl text-on-surface font-extrabold font-mono">
            {formatNumber(purchasesCount > 0 ? purchasesCount : viewsCount)}
          </span>
          <span className="text-xs text-muted font-medium">
            {purchasesCount > 0 ? t('highlights.purchases') : t('highlights.views')}
          </span>
        </StaggerItem>

        <StaggerItem className="p-4 sm:p-5 rounded-xl bg-section-band border border-card-border flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
              verified_user
            </span>
          </div>
          <span className="text-lg sm:text-xl text-on-surface font-extrabold">
            {t('highlights.supportDays', { days: supportDays })}
          </span>
          <span className="text-xs text-muted font-medium">
            {t('highlights.support')}
          </span>
        </StaggerItem>

        <StaggerItem className="p-4 sm:p-5 rounded-xl bg-section-band border border-card-border flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
              workspace_premium
            </span>
          </div>
          <span className="text-sm sm:text-base text-on-surface font-bold leading-snug line-clamp-2">
            {licenseLabel}
          </span>
          <span className="text-xs text-muted font-medium">
            {t('highlights.license')}
          </span>
        </StaggerItem>

        <StaggerItem className="p-4 sm:p-5 rounded-xl bg-section-band border border-card-border flex flex-col gap-2">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <span className="material-symbols-rounded icon-gradient text-[22px]" aria-hidden="true">
              layers
            </span>
          </div>
          <span className="text-lg sm:text-xl text-on-surface font-extrabold">
            {t('highlights.techUnit', { count: techCount })}
          </span>
          <span className="text-xs text-muted font-medium">
            {t('highlights.techCount')}
          </span>
        </StaggerItem>
      </Stagger>

      {/* Project Description Card */}
      {description && (
        <Reveal as="section" className="p-6 sm:p-7 rounded-xl bg-card border border-card-border shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
                description
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-on-surface">
              {t('sections.overviewTitle')}
            </h2>
          </div>
          <p className="text-body-md text-on-surface-variant whitespace-pre-line">
            {description}
          </p>
        </Reveal>
      )}
    </>
  );
}
