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
      className="space-y-5 scroll-mt-24"
    >
      {/* Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
              forum
            </span>
          </div>
          <div>
            <h2 id="project-reviews-heading" className="text-lg sm:text-headline-lg font-bold text-on-surface">
              {t('sections.reviewsTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              {t('sections.reviewsSubtitle')}
            </p>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-section-band border border-card-border">
            <Rating rating={averageRating} showCount={false} size="sm" />
            <bdi dir="ltr" className="font-mono text-xs text-muted">
              / 5.0
            </bdi>
            <span className="text-xs text-muted font-medium">
              {t('ratings.count', { count: totalCount })}
            </span>
          </div>
        )}
      </div>

      {/* Reviews List as Soft Testimonial Cards */}
      {isLoading ? (
        <div className="space-y-3.5" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-xl bg-section-band border border-card-border space-y-3"
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
        />
      ) : (
        <div className={isFetching ? 'opacity-75 transition-opacity space-y-4' : 'space-y-4'}>
          <ul className="space-y-4">
            {reviews.map((review, index) => {
              const initial = (review.customerName || 'N').trim().charAt(0).toUpperCase();
              const hasResponse = Boolean(review.ownerResponse && review.ownerResponse.trim());

              return (
                <li
                  key={review._id || `review-${index}`}
                  className="p-5 sm:p-6 rounded-xl bg-section-band border border-card-border space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full bg-brand-soft text-brand-soft-text font-bold text-sm flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">
                            {review.customerName}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-soft text-brand-soft-text">
                            <span className="material-symbols-rounded text-[13px]" aria-hidden="true">
                              verified
                            </span>
                            <span>{t('badges.verifiedBuyer')}</span>
                          </span>
                        </div>
                        {review.createdAt && (
                          <time
                            dateTime={review.createdAt}
                            className="block text-[11px] text-muted mt-0.5"
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
                    <div className="mt-3 ps-4 pe-3.5 py-3.5 rounded-xl bg-card border-s-2 border-primary space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <span className="material-symbols-rounded text-[16px]" aria-hidden="true">
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
