import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { useFeaturedProjects } from '@/api/home';
import { getApiErrorMessage } from '@/api/client';
import { ProjectCard, SectionHeader, ErrorState } from '@/components/shared';
import { Skeleton } from '@/components/ui';

export function FeaturedProjectsSection() {
  const { t } = useTranslation(['home', 'common']);
  const { data, isLoading, isError, error, refetch } = useFeaturedProjects();

  const projects = data?.projects || [];

  // Empty state: hide section gracefully when there are no published projects
  if (!isLoading && !isError && projects.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-section-band border-y border-outline-variant/70">
      <section
        aria-labelledby="home-featured-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full"
      >
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <SectionHeader
            align="start"
            badge={
              <div className="inline-flex items-center gap-2 text-primary text-label-md font-bold">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  inventory_2
                </span>
                <span>{t('home:featured.eyebrow')}</span>
              </div>
            }
            title={
              <span id="home-featured-heading">
                {t('home:featured.title')}
              </span>
            }
          />

          <Link
            to={ROUTES.PROJECTS}
            className="group inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-surface border border-outline-variant text-label-lg font-semibold text-on-surface hover:text-primary hover:border-card-hover-border hover:bg-card-hover hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 shadow-card w-full sm:w-auto shrink-0"
          >
            <span>{t('home:featured.viewAll')}</span>
            <span
              className="material-symbols-outlined text-[18px] rtl:-scale-x-100 transition-transform duration-200 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label={t('home:featured.loadingLabel')}
          >
            <Skeleton.Card />
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
        )}

        {/* Error State with Retry */}
        {!isLoading && isError && (
          <ErrorState
            title={t('home:featured.errorTitle')}
            message={getApiErrorMessage(error, t)}
            onRetry={() => refetch()}
          />
        )}

        {/* Featured (or fallback newest) Projects Grid */}
        {!isLoading && !isError && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id || project.slug} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
