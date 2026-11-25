import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/app/providers';
import { useLatestReviews } from '@/api/home';
import { localized } from '@/lib/localized';
import { SectionHeader, Rating } from '@/components/shared';
import { Skeleton } from '@/components/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Motion';

function extractInitials(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function TestimonialsSection() {
  const { t } = useTranslation('home');
  const { lang } = useLang();
  const { data: reviews = [], isLoading } = useLatestReviews(3);

  // Content rule: hide section completely when no real reviews exist
  if (!isLoading && (!Array.isArray(reviews) || reviews.length === 0)) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-testimonials-heading"
      className="w-full py-16 lg:py-24"
    >
      <div className="max-w-container mx-auto px-4 sm:px-6">
        <Reveal id="home-testimonials-heading" className="mb-12">
          <SectionHeader
            align="center"
            badge={t('testimonials.eyebrow')}
            title={t('testimonials.title')}
            accent={t('testimonials.titleAccent')}
            subtitle={t('testimonials.subtitle')}
          />
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-section-band border border-card-border p-6 sm:p-7 space-y-4"
              >
                <Skeleton className="h-6 w-28" />
                <Skeleton.Text lines={3} />
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => {
              const initials = extractInitials(review.customerName);
              const projectTitle = localized(review.projectTitle, lang);

              return (
                <StaggerItem
                  as="article"
                  key={review._id || `testimonial-${index}`}
                  className="rounded-xl bg-section-band border border-card-border p-6 sm:p-7 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="material-symbols-rounded icon-gradient text-[34px] leading-none"
                        aria-hidden="true"
                      >
                        format_quote
                      </span>
                      <Rating rating={review.rating} showCount={false} size="sm" />
                    </div>

                    <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed line-clamp-4">
                      {review.comment}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-outline-variant flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-brand-soft text-brand-soft-text font-bold text-sm flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-on-surface truncate">
                        {review.customerName}
                      </div>
                      {projectTitle && (
                        review.projectSlug ? (
                          <Link
                            to={`/projects/${review.projectSlug}`}
                            className="text-xs text-primary hover:underline truncate block mt-0.5"
                          >
                            {projectTitle}
                          </Link>
                        ) : (
                          <div className="text-xs text-muted truncate mt-0.5">
                            {projectTitle}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </section>
  );
}
