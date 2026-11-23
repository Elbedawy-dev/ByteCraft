import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { formatNumber } from '../../../lib/format';
import { ROUTES } from '../../../config/routes';
import { Rating } from '../../../components/shared/Rating';

export function ProjectHeader({ project, selectedPackage, guaranteeDays = 30 }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  const title = localized(project?.title, lang);
  const tagline = localized(project?.tagline, lang);
  const description = localized(project?.description, lang);
  const categoryName = localized(project?.category?.name, lang);
  const categoryKey = project?.category?.key;

  const avgRating = project?.reviewsSummary?.average || 0;
  const reviewsCount = project?.reviewsSummary?.count || 0;
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
      {/* Category, Badges, Rating, Title & Tagline */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <Link
                to={`${ROUTES.PROJECTS}?category=${encodeURIComponent(categoryKey || '')}`}
                className="px-3 py-1 rounded-full bg-badge-green-bg border border-primary/25 text-badge-green-text font-semibold text-xs sm:text-sm hover:border-primary/50 transition-colors"
              >
                {categoryName}
              </Link>
            )}
            {categoryKey && (
              <span className="px-3 py-1 rounded-full bg-card border border-card-border text-on-surface-variant font-label-code text-xs">
                <bdi dir="ltr">{categoryKey}</bdi>
              </span>
            )}
          </div>

          <a
            href="#reviews"
            className="inline-flex items-center gap-2 bg-card border border-card-border shadow-card hover:bg-card-hover hover:border-card-hover-border px-3 py-1.5 rounded-xl transition-colors"
          >
            <Rating rating={avgRating} showCount={false} size="sm" />
            {reviewsCount > 0 ? (
              <>
                <bdi dir="ltr" className="font-mono text-xs text-on-surface-variant">
                  / 5.0
                </bdi>
                <span className="text-on-surface-variant text-xs">
                  {t('ratings.count', { count: reviewsCount })}
                </span>
              </>
            ) : (
              <span className="text-on-surface-variant text-xs">
                {t('ratings.count', { count: 0 })}
              </span>
            )}
          </a>
        </div>

        <h1 className="text-headline-xl-mobile sm:text-headline-xl font-extrabold text-on-surface tracking-tight leading-tight">
          {title}
        </h1>

        {tagline && (
          <p className="text-base sm:text-body-lg text-on-surface-variant leading-relaxed">
            {tagline}
          </p>
        )}
      </section>

      {/* 4 Real Data Highlight Tiles (matching Stitch bytecraft_3 4-card strip) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label={t('sections.overviewTitle')}>
        <div className="p-4 rounded-xl bg-card border border-card-border shadow-card flex flex-col gap-1">
          <span className="material-symbols-outlined text-chip-mint-fg text-[26px]" aria-hidden="true">
            {purchasesCount > 0 ? 'shopping_bag' : 'visibility'}
          </span>
          <span className="text-lg sm:text-headline-md text-on-surface font-bold font-mono">
            {formatNumber(purchasesCount > 0 ? purchasesCount : viewsCount)}
          </span>
          <span className="text-xs sm:text-body-sm text-on-surface-variant">
            {purchasesCount > 0 ? t('highlights.purchases') : t('highlights.views')}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-card-border shadow-card flex flex-col gap-1">
          <span className="material-symbols-outlined text-chip-sky-fg text-[26px]" aria-hidden="true">
            verified_user
          </span>
          <span className="text-lg sm:text-headline-md text-on-surface font-bold">
            {t('highlights.supportDays', { days: supportDays })}
          </span>
          <span className="text-xs sm:text-body-sm text-on-surface-variant">
            {t('highlights.support')}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-card-border shadow-card flex flex-col gap-1">
          <span className="material-symbols-outlined text-chip-violet-fg text-[26px]" aria-hidden="true">
            workspace_premium
          </span>
          <span className="text-sm sm:text-base text-on-surface font-bold leading-snug line-clamp-2">
            {licenseLabel}
          </span>
          <span className="text-xs sm:text-body-sm text-on-surface-variant">
            {t('highlights.license')}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-card-border shadow-card flex flex-col gap-1">
          <span className="material-symbols-outlined text-chip-amber-fg text-[26px]" aria-hidden="true">
            layers
          </span>
          <span className="text-lg sm:text-headline-md text-on-surface font-bold">
            {t('highlights.techUnit', { count: techCount })}
          </span>
          <span className="text-xs sm:text-body-sm text-on-surface-variant">
            {t('highlights.techCount')}
          </span>
        </div>
      </section>

      {/* Project Description Card */}
      {description && (
        <section className="p-5 sm:p-6 rounded-xl bg-card border border-card-border shadow-card space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-badge-green-bg text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                description
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-on-surface">
              {t('sections.overviewTitle')}
            </h2>
          </div>
          <p className="text-sm sm:text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </section>
      )}
    </>
  );
}
