import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { getApiErrorMessage } from '@/api/client';
import { formatNumber } from '@/lib/format';
import { Button, Pagination, Skeleton, Spinner } from '@/components/ui';
import { EmptyState, ErrorState, ProjectCard } from '@/components/shared';

function ProjectCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col h-full bg-surface-container rounded-2xl border border-outline-variant/80 overflow-hidden"
    >
      <Skeleton className="w-full aspect-video rounded-none" />
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
        <div className="pt-3 border-t border-outline-variant/60 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps shared ProjectCard so:
 * 1. `thumbnail` is never an object (avoids `[object Object]` when thumbnailUrl is empty).
 * 2. Every card fills full row height (`h-full`) for uniform card heights across 2-column rows.
 */
function MarketplaceProjectCard({ project }) {
  const cardProject = {
    ...project,
    thumbnail: project.thumbnailUrl || null,
  };
  return <ProjectCard project={cardProject} className="h-full" />;
}

export function MarketplaceGrid({
  projects = [],
  meta,
  isPending = false,
  isFetching = false,
  isPlaceholderData = false,
  isError = false,
  error = null,
  hasActiveFilters = false,
  onRetry,
  onClearFilters,
  onPageChange,
}) {
  const { t } = useTranslation('marketplace');
  const { t: tCommon } = useTranslation('common');

  const total = meta?.total ?? projects.length;
  const currentPage = meta?.page ?? 1;
  const limit = meta?.limit ?? 12;
  const totalPages = meta?.totalPages ?? 1;

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(currentPage * limit, total);

  let statusLabel;
  if (isPending) {
    statusLabel = t('results.loadingCount');
  } else if (total === 0) {
    statusLabel = t('results.showingZero');
  } else if (total === 1) {
    statusLabel = t('results.showingSingle');
  } else {
    statusLabel = t('results.showingRange', {
      from: formatNumber(rangeStart),
      to: formatNumber(rangeEnd),
      total: formatNumber(total),
    });
  }

  return (
    <section aria-label={t('results.archBadge')} className="space-y-space-lg">
      {/* Status & Total Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-on-surface-variant font-label-code text-label-code">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 min-w-0"
        >
          <span
            className={clsx(
              'w-2 h-2 rounded-full shrink-0',
              isError ? 'bg-error' : 'bg-primary'
            )}
            aria-hidden="true"
          />
          <span className="text-on-surface-variant font-sans text-sm font-medium">
            {statusLabel}
          </span>
          {isFetching && !isPending && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/60 text-primary text-[11px] font-medium">
              <Spinner size="sm" />
              <span>{t('results.updating')}</span>
            </span>
          )}
        </div>

        <span className="hidden sm:inline-block text-on-surface-variant/75">
          <bdi dir="ltr">{t('results.archBadge')}</bdi>
        </span>
      </div>

      {/* State 1: Initial Loading Skeleton Grid */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ProjectCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* State 2: Error + Retry */}
      {!isPending && isError && (
        <ErrorState
          title={t('results.error.title')}
          message={getApiErrorMessage(error, tCommon)}
          onRetry={onRetry}
        />
      )}

      {/* State 3: Empty Results */}
      {!isPending && !isError && projects.length === 0 && (
        <EmptyState
          icon={hasActiveFilters ? 'search_off' : 'inventory_2'}
          title={
            hasActiveFilters
              ? t('results.empty.filteredTitle')
              : t('results.empty.catalogTitle')
          }
          description={
            hasActiveFilters
              ? t('results.empty.filteredDescription')
              : t('results.empty.catalogDescription')
          }
          action={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="primary-gradient"
                size="md"
                onClick={onClearFilters}
                iconLeading={
                  <span className="material-symbols-outlined text-[18px]">
                    filter_alt_off
                  </span>
                }
              >
                {t('results.empty.clearAction')}
              </Button>
            ) : (
              <Link to={ROUTES.CONTACT}>
                <Button
                  variant="primary-gradient"
                  size="md"
                  iconLeading={
                    <span className="material-symbols-outlined text-[18px]">
                      add_circle
                    </span>
                  }
                >
                  {t('results.empty.contactAction')}
                </Button>
              </Link>
            )
          }
        />
      )}

      {/* State 4: Results Grid (1 column on mobile, 2 on desktop, equal heights) */}
      {!isPending && !isError && projects.length > 0 && (
        <>
          <div
            className={clsx(
              'grid grid-cols-1 md:grid-cols-2 gap-space-lg transition-opacity duration-200',
              isPlaceholderData && isFetching && 'opacity-70'
            )}
          >
            {projects.map((project) => (
              <div key={project.id || project.slug} className="min-w-0 h-full">
                <MarketplaceProjectCard project={project} />
              </div>
            ))}
          </div>

          {/* Pagination + Footnote */}
          <div className="pt-space-md flex flex-col items-center justify-center gap-space-md">
            {totalPages > 1 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}

            <div className="flex items-start sm:items-center justify-center gap-2 text-center text-on-surface-variant font-body-sm text-xs sm:text-body-sm">
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2 sm:mt-0"
                aria-hidden="true"
              />
              <span>{t('results.catalogFootnote')}</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
