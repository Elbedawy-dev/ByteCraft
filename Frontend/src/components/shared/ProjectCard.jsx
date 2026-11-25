import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { useLang } from '../../app/providers';
import { BRAND } from '../../config/brand';
import { localized } from '../../lib/localized';
import { MOTION_TRANSITION } from '../../lib/motion';
import { LogoMark } from './LogoMark';
import { Rating } from './Rating';
import { PriceTag } from './PriceTag';
import { Button } from '../ui/Button';
import { MotionImage } from '../ui/Motion';

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

  const techStack = Array.isArray(project.techStack) ? project.techStack.slice(0, 4) : [];
  const thumbnail = project.thumbnailUrl || project.images?.[0]?.url || project.thumbnail;

  return (
    <m.article
      data-fm-hover="true"
      whileHover={{ y: -4 }}
      transition={MOTION_TRANSITION}
      className={clsx(
        'group flex flex-col bc-card-hover rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Top 16:10 Image */}
      <Link
        to={`/projects/${project.slug}`}
        className="relative w-full aspect-[16/10] bg-section-band overflow-hidden block select-none border-b border-card-border"
        tabIndex={-1}
        aria-hidden="true"
      >
        {thumbnail && !imgError ? (
          <MotionImage
            src={thumbnail}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-nexus group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-section-band via-brand-soft/60 to-section-band text-muted gap-2">
            <LogoMark className="w-11 h-11 opacity-85" />
            <span className="text-xs font-semibold tracking-wide text-muted">{BRAND.name}</span>
          </div>
        )}

        {categoryName && (
          <div className="absolute top-3.5 start-3.5 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-soft/95 text-brand-soft-text backdrop-blur-md border border-chip-mint-border shadow-sm">
              {categoryName}
            </span>
          </div>
        )}
      </Link>

      {/* Card Body (24-28px rhythm) */}
      <div className="p-6 flex flex-col flex-1 justify-between gap-5">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors duration-300 line-clamp-1">
              <Link to={`/projects/${project.slug}`}>
                {title}
              </Link>
            </h3>
            {ratingVal > 0 && (
              <Rating rating={ratingVal} count={ratingCount} size="sm" showCount={false} />
            )}
          </div>

          {tagline && (
            <p className="text-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
              {tagline}
            </p>
          )}

          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech, idx) => (
                <span
                  key={`${tech}-${idx}`}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-soft text-brand-soft-text"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price + Actions */}
        <div className="pt-4 border-t border-outline-variant space-y-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              {t('actions.startingPrice', { defaultValue: 'Starting from:' })}
            </span>
            <PriceTag piasters={startingPiasters} size="md" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
                  iconLeading={<span className="material-symbols-rounded text-[16px]" aria-hidden="true">visibility</span>}
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
                  iconTrailing={<span className="material-symbols-rounded text-[16px] rtl:-scale-x-100" aria-hidden="true">arrow_forward</span>}
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
                iconTrailing={<span className="material-symbols-rounded text-[16px] rtl:-scale-x-100" aria-hidden="true">arrow_forward</span>}
              >
                {t('actions.buy', { defaultValue: 'Buy now' })}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </m.article>
  );
}
