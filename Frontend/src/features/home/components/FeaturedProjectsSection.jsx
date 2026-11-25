import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { LayoutGroup, m } from 'framer-motion';
import { ROUTES } from '@/config/routes';
import { useLang } from '@/app/providers';
import { useFeaturedProjects, usePortfolioProjects } from '@/api/home';
import { useCategories } from '@/api/projects';
import { getApiErrorMessage } from '@/api/client';
import { localized } from '@/lib/localized';
import { MOTION_TRANSITION } from '@/lib/motion';
import {
  ProjectCard,
  SectionHeader,
  EmptyState,
  ErrorState,
  HeroCubes,
} from '@/components/shared';
import { Button, Skeleton } from '@/components/ui';
import { LayoutMotion, Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

export function FeaturedProjectsSection() {
  const { t } = useTranslation(['home', 'common']);
  const { lang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const baseQuery = useFeaturedProjects();
  const filteredQuery = usePortfolioProjects(selectedCategory, {
    enabled: selectedCategory !== 'all',
  });
  const { data: rawCategories = [] } = useCategories();

  const categories = useMemo(
    () =>
      Array.isArray(rawCategories)
        ? rawCategories.filter((cat) => cat && cat.isActive !== false && cat.key)
        : [],
    [rawCategories]
  );

  const baseProjects = baseQuery.data?.projects || [];
  const activeQuery = selectedCategory === 'all' ? baseQuery : filteredQuery;
  const projects = activeQuery.data?.projects || [];

  // Hide entire portfolio section when there are zero published projects overall
  if (!baseQuery.isLoading && !baseQuery.isError && baseProjects.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-featured-heading"
      className="relative w-full py-16 lg:py-24 overflow-hidden"
    >
      {/* Decorative small corner cubes like reference */}
      <div
        aria-hidden="true"
        className="hidden xl:block pointer-events-none absolute top-10 end-8 w-36 opacity-55 dark:opacity-35"
      >
        <HeroCubes className="w-full h-auto rtl:-scale-x-100" />
      </div>

      <div className="relative z-10 max-w-container mx-auto px-4 sm:px-6">
        <Reveal id="home-featured-heading" className="mb-8">
          <SectionHeader
            align="center"
            badge={t('home:featured.eyebrow')}
            title={t('home:featured.title')}
            accent={t('home:featured.titleAccent')}
            subtitle={t('home:featured.subtitle')}
          />
        </Reveal>

        {/* Category Filter Pills (active = animated layoutId brand gradient) */}
        {categories.length > 0 && (
          <LayoutMotion>
            <LayoutGroup id="home-featured-category-tabs">
              <div
                role="tablist"
                aria-label={t('home:featured.filterLabel')}
                className="flex flex-wrap items-center justify-center gap-2.5 mb-12"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  className={clsx(
                    'relative px-5 py-2.5 min-h-[40px] rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 ease-nexus select-none',
                    selectedCategory === 'all'
                      ? 'text-white'
                      : 'bg-section-band text-on-surface-variant border border-outline-variant hover:bg-brand-soft hover:text-primary'
                  )}
                >
                  {selectedCategory === 'all' && (
                    <m.span
                      layoutId="home-featured-cat-pill"
                      transition={MOTION_TRANSITION}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full btn-primary-gradient"
                    />
                  )}
                  <span className="relative z-10">{t('home:featured.allCategories')}</span>
                </button>

                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat._id || cat.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={clsx(
                        'relative px-5 py-2.5 min-h-[40px] rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 ease-nexus select-none',
                        isActive
                          ? 'text-white'
                          : 'bg-section-band text-on-surface-variant border border-outline-variant hover:bg-brand-soft hover:text-primary'
                      )}
                    >
                      {isActive && (
                        <m.span
                          layoutId="home-featured-cat-pill"
                          transition={MOTION_TRANSITION}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full btn-primary-gradient"
                        />
                      )}
                      <span className="relative z-10">{localized(cat.name, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </LayoutMotion>
        )}

        {/* Loading Skeletons */}
        {activeQuery.isLoading && (
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

        {/* Error State */}
        {!activeQuery.isLoading && activeQuery.isError && (
          <ErrorState
            title={t('home:featured.errorTitle')}
            message={getApiErrorMessage(activeQuery.error, t)}
            onRetry={() => activeQuery.refetch()}
          />
        )}

        {/* Filtered Category Empty State */}
        {!activeQuery.isLoading && !activeQuery.isError && projects.length === 0 && (
          <EmptyState
            icon="folder_open"
            title={t('home:featured.emptyCategoryTitle')}
            description={t('home:featured.emptyCategoryDescription')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                {t('home:featured.allCategories')}
              </Button>
            }
          />
        )}

        {/* 3 Real ProjectCards */}
        {!activeQuery.isLoading && !activeQuery.isError && projects.length > 0 && (
          <Stagger
            key={selectedCategory}
            inView={false}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {projects.map((project) => (
              <StaggerItem key={project.id || project._id || project.slug} className="flex">
                <ProjectCard project={project} className="w-full" />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Centered Outline Pill "View all projects" */}
        <div className="mt-12 flex justify-center">
          <Link to={ROUTES.PROJECTS}>
            <Button
              variant="outline"
              size="md"
              iconTrailing={
                <span
                  className="material-symbols-rounded text-[18px] rtl:-scale-x-100"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              }
            >
              {t('home:featured.viewAll')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
