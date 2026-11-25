import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/routes';
import { getApiErrorMessage } from '@/api/client';
import { formatNumber } from '@/lib/format';
import { Button, Pagination, Skeleton, Spinner } from '@/components/ui';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { EmptyState, ErrorState, ProjectCard } from '@/components/shared';

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
    <section aria-label={t('results.archBadge')} className="space-y-6">
      {/* Status & Total Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-muted text-xs">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-soft text-brand-soft-text text-[11px] font-semibold">
              <Spinner size="sm" />
              <span>{t('results.updating')}</span>
            </span>
          )}
        </div>

        <span className="hidden sm:inline-block text-muted font-mono">
          <bdi dir="ltr">{t('results.archBadge')}</bdi>
        </span>
      </div>

      {/* State 1: Loading Skeleton Grid (3 / 2 / 1 columns) */}
      {isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton.Card key={idx} />
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
          icon={hasActiveFilters ? 'search_off' : 'deployed_code'}
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
                  <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
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
                  iconTrailing={
                    <span className="material-symbols-rounded text-[18px] rtl:-scale-x-100" aria-hidden="true">
                      arrow_forward
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

      {/* State 4: Results Grid (3 / 2 / 1 columns of ProjectCard) */}
      {!isPending && !isError && projects.length > 0 && (
        <>
          <Stagger
            key={`${currentPage}-${projects.map((p) => p.id || p._id || p.slug).slice(0, 3).join(',')}`}
            inView={false}
            className={clsx(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ease-nexus',
              isPlaceholderData && isFetching && 'opacity-70'
            )}
          >
            {projects.map((project) => (
              <StaggerItem key={project.id || project._id || project.slug} className="min-w-0 h-full">
                <MarketplaceProjectCard project={project} />
              </StaggerItem>
            ))}
          </Stagger>

          {/* Pill Pagination + Footnote */}
          <div className="pt-6 flex flex-col items-center justify-center gap-4">
            {totalPages > 1 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}

            <div className="flex items-start sm:items-center justify-center gap-2 text-center text-muted text-xs sm:text-sm">
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
