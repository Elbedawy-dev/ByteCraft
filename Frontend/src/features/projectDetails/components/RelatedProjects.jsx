import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { useRelatedProjects } from '../../../api/projectDetails';
import { localized } from '../../../lib/localized';
import { ROUTES, projectDetailsPath } from '../../../config/routes';
import { PriceTag } from '../../../components/shared/PriceTag';
import { Rating } from '../../../components/shared/Rating';
import { Skeleton } from '../../../components/ui/Skeleton';

function RelatedProjectCard({ project }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);

  const title = localized(project.title, lang);
  const tagline = localized(project.tagline, lang);
  const categoryName = localized(project.category?.name, lang);
  const thumbUrl = project.thumbnail?.url || '';
  const techList = Array.isArray(project.techStack) ? project.techStack.slice(0, 3) : [];
  const avgRating = project.reviewsSummary?.average || 0;
  const ratingCount = project.reviewsSummary?.count || 0;

  let startingPrice = project.startingPrice;
  if (startingPrice === null || startingPrice === undefined) {
    const activePkgs = Array.isArray(project.packages)
      ? project.packages.filter((p) => p.isActive !== false)
      : [];
    startingPrice = activePkgs.length > 0 ? Math.min(...activePkgs.map((p) => p.price || 0)) : 0;
  }

  return (
    <article className="rounded-xl bg-surface-container-low border border-outline-variant/80 shadow-md overflow-hidden group hover:-translate-y-1 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between">
      <div className="flex flex-col">
        <Link
          to={projectDetailsPath(project.slug)}
          className="aspect-video w-full overflow-hidden bg-surface-dim relative block"
          tabIndex={-1}
          aria-hidden="true"
        >
          {thumbUrl && !imgFailed ? (
            <img
              src={thumbUrl}
              alt={title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container-highest text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] text-primary/40 mb-1" aria-hidden="true">
                code_blocks
              </span>
              <span className="text-[11px] font-mono opacity-60">ByteCraft</span>
            </div>
          )}

          {categoryName && (
            <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-surface-dim/85 backdrop-blur-md border border-outline-variant/50 text-primary font-label-md text-xs">
              {categoryName}
            </span>
          )}
        </Link>

        <div className="p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant">
            {techList.length > 0 ? (
              <bdi dir="ltr" className="font-label-code truncate">
                {techList.join(' + ')}
              </bdi>
            ) : (
              <span />
            )}

            {ratingCount > 0 && (
              <div className="shrink-0">
                <Rating rating={avgRating} count={ratingCount} showCount={true} size="sm" />
              </div>
            )}
          </div>

          <h3 className="text-base sm:text-lg text-on-surface font-bold group-hover:text-primary transition-colors line-clamp-2">
            <Link to={projectDetailsPath(project.slug)}>{title}</Link>
          </h3>

          {tagline && (
            <p className="text-xs sm:text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
              {tagline}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-3">
        <div>
          <span className="block text-[11px] text-on-surface-variant leading-tight mb-0.5">
            {t('related.startingFrom')}
          </span>
          <PriceTag piasters={startingPrice} size="md" />
        </div>

        <Link
          to={projectDetailsPath(project.slug)}
          className="px-3.5 py-2 min-h-[40px] inline-flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-on-surface hover:text-primary text-xs font-bold transition-colors shrink-0"
        >
          {t('related.viewDetails')}
        </Link>
      </div>
    </article>
  );
}

export function RelatedProjects({ categoryKey, currentSlug }) {
  const { t } = useTranslation('projectDetails');
  const { data: related = [], isLoading } = useRelatedProjects(categoryKey, currentSlug, {
    enabled: Boolean(categoryKey),
  });

  if (!categoryKey) return null;
  if (!isLoading && related.length === 0) return null;

  return (
    <section aria-labelledby="related-projects-heading" className="pt-8 lg:pt-12 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <div>
          <span className="font-label-code text-xs text-primary uppercase tracking-wider block mb-1">
            {t('sections.relatedEyebrow')}
          </span>
          <h2 id="related-projects-heading" className="text-2xl sm:text-headline-xl font-bold text-on-surface">
            {t('sections.relatedTitle')}
          </h2>
        </div>

        <Link
          to={ROUTES.PROJECTS}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-secondary transition-colors"
        >
          <span>{t('sections.browseAllProjects')}</span>
          <span className="material-symbols-outlined text-[18px] rtl:-scale-x-100" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((item) => (
            <RelatedProjectCard key={item.id || item.slug} project={item} />
          ))}
        </div>
      )}
    </section>
  );
}
