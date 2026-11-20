import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useOwnerPageTitle } from '@/components/layout/OwnerLayout';
import { getApiErrorMessage } from '@/api/client';
import { useOwnerReviews } from '@/api/owner/reviews';
import { Badge, Button, Card, Pagination, Select, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { ReviewModerationCard } from '@/features/ownerReviews/ReviewModerationCard';

const PAGE_LIMIT = 12;
const RATING_OPTIONS = [5, 4, 3, 2, 1];

export default function OwnerReviewsPage() {
  const { t } = useTranslation(['ownerReviews', 'common']);

  useOwnerPageTitle(t('ownerReviews:title'));

  const [visibility, setVisibility] = useState(''); // '' | 'true' | 'false'
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = {
    isPublished: visibility || undefined,
    rating: rating || undefined,
    page,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useOwnerReviews(queryParams);

  const reviews = data?.reviews || [];
  const meta = data?.meta || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 };
  const hasActiveFilters = Boolean(visibility || rating);

  const handleResetFilters = () => {
    setVisibility('');
    setRating('');
    setPage(1);
  };

  const rangeFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeTo = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low p-5 sm:p-6">
        <div
          className="pointer-events-none absolute -top-20 -end-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {t('ownerReviews:title')}
              </h1>
              <Badge variant="neutral" size="md">
                <bdi dir="ltr" className="font-mono">
                  {meta.total}
                </bdi>
              </Badge>
            </div>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
              {t('ownerReviews:subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <Card variant="flat" padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Published / Hidden Segmented Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container border border-outline-variant w-fit max-w-full overflow-x-auto">
            {[
              { value: '', label: t('ownerReviews:filters.all') },
              { value: 'true', label: t('ownerReviews:filters.published') },
              { value: 'false', label: t('ownerReviews:filters.hidden') },
            ].map((tab) => {
              const active = visibility === tab.value;
              return (
                <button
                  key={tab.value || 'all'}
                  type="button"
                  onClick={() => {
                    setVisibility(tab.value);
                    setPage(1);
                  }}
                  className={clsx(
                    'px-4 h-10 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Rating Filter + Clear */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-full sm:w-48">
              <label htmlFor="reviews-rating-filter" className="sr-only">
                {t('ownerReviews:filters.ratingLabel')}
              </label>
              <Select
                id="reviews-rating-filter"
                value={rating}
                onChange={(e) => {
                  setRating(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('ownerReviews:filters.allRatings')}</option>
                {RATING_OPTIONS.map((stars) => (
                  <option key={stars} value={String(stars)}>
                    {stars === 1
                      ? t('ownerReviews:filters.starSingle')
                      : t('ownerReviews:filters.stars', { count: stars })}
                  </option>
                ))}
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                iconLeading={
                  <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                }
              >
                {t('ownerReviews:filters.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Content */}
      {isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="reviews"
          title={
            hasActiveFilters
              ? t('ownerReviews:empty.title')
              : t('ownerReviews:empty.noReviewsTitle')
          }
          description={
            hasActiveFilters
              ? t('ownerReviews:empty.description')
              : t('ownerReviews:empty.noReviewsDescription')
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                {t('ownerReviews:filters.clearFilters')}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className={clsx('space-y-4 transition-opacity', isFetching && 'opacity-70')}>
          {reviews.map((review) => (
            <ReviewModerationCard key={review._id || review.id} review={review} />
          ))}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs font-mono text-on-surface-variant">
              {t('ownerReviews:stats.showing', {
                from: rangeFrom,
                to: rangeTo,
                total: meta.total,
              })}
            </span>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
