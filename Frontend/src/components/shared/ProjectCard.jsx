import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { localized } from '../../lib/localized';
import { Rating } from './Rating';
import { PriceTag } from './PriceTag';
import { Button } from '../ui/Button';

export function ProjectCard({
  project,
  className = '',
}) {
  const { t } = useTranslation('common');
  const { lang } = useLang();
  const [imgError, setImgError] = useState(false);

  if (!project) return null;

  const title = localized(project.title, lang) || project.title || '';
  const tagline = localized(project.tagline, lang) || project.tagline || '';
  const categoryName = project.category
    ? (localized(project.category.name, lang) || project.category.name || project.category)
    : null;

  // Determine cheapest active package or startingPrice
  let startingPiasters = project.startingPrice || 0;
  let cheapestPackageKey = 'standard';

  if (project.packages && Array.isArray(project.packages) && project.packages.length > 0) {
    const activePackages = project.packages.filter((p) => p.isActive !== false);
    if (activePackages.length > 0) {
      const sorted = [...activePackages].sort((a, b) => (a.price || 0) - (b.price || 0));
      startingPiasters = sorted[0].price;
      cheapestPackageKey = sorted[0].key || sorted[0].name || 'standard';
    }
  }

  // Rating from reviewsSummary or direct props
  const ratingVal =
    project.reviewsSummary?.averageRating ??
    project.reviewsSummary?.rating ??
    project.rating ??
    0;
  const ratingCount =
    project.reviewsSummary?.totalReviews ??
    project.reviewsSummary?.count ??
    project.reviewsCount ??
    0;

  // Tech stack items
  const techStack = Array.isArray(project.techStack) ? project.techStack.slice(0, 4) : [];

  // Thumbnail URL
  const thumbnail = project.thumbnailUrl || project.images?.[0]?.url || project.thumbnail;

  return (
    <article
      className={clsx(
        'group flex flex-col bg-surface-container rounded-2xl border border-outline-variant/80 overflow-hidden shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1',
        className
      )}
    >
      {/* Thumbnail Aspect Video Container */}
      <Link
        to={`/projects/${project.slug}`}
        className="relative w-full aspect-video bg-surface-container-low overflow-hidden block select-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-container via-surface-container-high to-surface-container-highest text-on-surface-variant">
            <span className="material-symbols-outlined text-[44px] text-primary/40 mb-1">
              code_blocks
            </span>
            <span className="text-xs font-mono opacity-60">ByteCraft Engine</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/20 pointer-events-none" />

        {/* Category Badge */}
        {categoryName && (
          <div className="absolute top-3 end-3 z-10">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface/90 text-primary backdrop-blur-md border border-outline-variant/40 shadow-sm">
              {categoryName}
            </span>
          </div>
        )}

        {/* Version or Ready Tag */}
        <div className="absolute bottom-3 start-3 z-10">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-surface/85 backdrop-blur-md text-on-surface-variant border border-outline-variant/30 flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[13px]">bolt</span>
            <span>Production Ready</span>
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Title + Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base sm:text-lg text-on-surface group-hover:text-primary transition-colors line-clamp-1">
              <Link to={`/projects/${project.slug}`}>
                {title}
              </Link>
            </h3>
            {ratingVal > 0 && (
              <Rating rating={ratingVal} count={ratingCount} size="sm" showCount={false} />
            )}
          </div>

          {/* Tagline */}
          {tagline && (
            <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
              {tagline}
            </p>
          )}

          {/* Tech Stack Chips */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech, idx) => (
                <span
                  key={`${tech}-${idx}`}
                  className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-surface-container-high text-on-surface-variant border border-outline-variant/40"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Price + Actions */}
        <div className="pt-3 border-t border-outline-variant/60 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-on-surface-variant">
              {t('actions.startingPrice', { defaultValue: 'Starting from:' })}
            </span>
            <PriceTag piasters={startingPiasters} size="md" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  iconLeading={<span className="material-symbols-outlined text-[16px]">visibility</span>}
                >
                  {t('actions.liveDemo', { defaultValue: 'Live Demo' })}
                </Button>
              </a>
            ) : (
              <Link to={`/projects/${project.slug}`} className="w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  iconLeading={<span className="material-symbols-outlined text-[16px]">visibility</span>}
                >
                  {t('actions.viewDetails', { defaultValue: 'Details' })}
                </Button>
              </Link>
            )}

            <Link
              to={`/checkout?project=${project.slug}&package=${cheapestPackageKey}`}
              className="w-full"
            >
              <Button
                variant="primary-gradient"
                size="sm"
                className="w-full text-xs"
                iconLeading={<span className="material-symbols-outlined text-[16px]">shopping_cart</span>}
              >
                {t('actions.buy', { defaultValue: 'Buy now' })}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
