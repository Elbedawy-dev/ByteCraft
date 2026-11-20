import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { useProjectReviews } from '../../../api/projectDetails';
import { getApiErrorMessage } from '../../../api/client';
import { formatDate } from '../../../lib/format';
import { Rating } from '../../../components/shared/Rating';
import { EmptyState } from '../../../components/shared/EmptyState';
import { ErrorState } from '../../../components/shared/ErrorState';
import { Pagination } from '../../../components/ui/Pagination';
import { Skeleton } from '../../../components/ui/Skeleton';

export function ProjectReviews({ slug, reviewsSummary }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const { data, isLoading, isError, error, refetch, isFetching } = useProjectReviews(slug, {
    page,
    limit: 5,
  });

  const reviews = data?.reviews || [];
  const meta = data?.meta || { page: 1, total: 0, totalPages: 1 };
  const totalCount = reviewsSummary?.count ?? meta.total ?? 0;
  const averageRating = reviewsSummary?.average ?? 0;

  return (
    <section
      id="reviews"
      aria-labelledby="project-reviews-heading"
      className="p-5 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-5 scroll-mt-24"
    >
      {/* Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant/50">
        <div>
          <h2 id="project-reviews-heading" className="text-lg sm:text-headline-lg font-bold text-on-surface">
            {t('sections.reviewsTitle')}
          </h2>
          <p className="text-xs sm:text-body-sm text-on-surface-variant mt-0.5">
            {t('sections.reviewsSubtitle')}
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/60">
            <Rating rating={averageRating} showCount={false} size="sm" />
            <bdi dir="ltr" className="font-mono text-xs text-on-surface-variant">
              / 5.0
            </bdi>
            <span className="text-xs text-on-surface-variant">
              {t('ratings.count', { count: totalCount })}
            </span>
          </div>
        )}
      </div>

      {/* Reviews List States */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-surface-container border border-outline-variant/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton.Text lines={2} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={getApiErrorMessage(error, t)}
          onRetry={refetch}
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="rate_review"
          title={t('reviews.emptyTitle')}
          description={t('reviews.emptyDescription')}
          className="bg-surface-container/40"
        />
      ) : (
        <div className={isFetching ? 'opacity-75 transition-opacity space-y-4' : 'space-y-4'}>
          <ul className="space-y-3.5">
            {reviews.map((review, index) => {
              const initial = (review.customerName || 'C').trim().charAt(0).toUpperCase();
              const hasResponse = Boolean(review.ownerResponse && review.ownerResponse.trim());

              return (
                <li
                  key={review._id || `review-${index}`}
                  className="p-4 sm:p-5 rounded-xl bg-surface-container border border-outline-variant/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 text-primary font-bold text-sm flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-on-surface">
                            {review.customerName}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                              verified
                            </span>
                            <span>{t('badges.verifiedBuyer')}</span>
                          </span>
                        </div>
                        {review.createdAt && (
                          <time
                            dateTime={review.createdAt}
                            className="block text-[11px] text-on-surface-variant mt-0.5"
                          >
                            {formatDate(review.createdAt, lang)}
                          </time>
                        )}
                      </div>
                    </div>

                    <Rating rating={review.rating} showCount={false} size="sm" />
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {review.comment}
                  </p>

                  {hasResponse && (
                    <div className="mt-3 ps-3.5 pe-3 py-3 rounded-lg bg-surface-container-low border-s-2 border-primary space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                          support_agent
                        </span>
                        <span>{t('reviews.ownerResponseLabel')}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-line">
                        {review.ownerResponse}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {meta.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                page={meta.page || page}
                totalPages={meta.totalPages}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
