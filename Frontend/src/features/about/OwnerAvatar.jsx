import React, { useState } from 'react';
import clsx from 'clsx';
import { BRAND } from '../../config/brand';
import { LogoMark } from '../../components/shared/LogoMark';
import { MotionImage } from '../../components/ui/Motion';

const OWNER_PHOTO_MODULES = import.meta.glob(
  '../../assets/owner-photo.{jpg,jpeg,png,webp}',
  { eager: true, import: 'default' }
);

function resolveOwnerPhotoUrl() {
  const entries = Object.entries(OWNER_PHOTO_MODULES);
  if (entries.length === 0) return null;

  const preferredOrder = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of preferredOrder) {
    const match = entries.find(([filePath]) => filePath.toLowerCase().endsWith(ext));
    if (match?.[1]) return match[1];
  }

  return entries[0]?.[1] || null;
}

const resolvedPhotoUrl = resolveOwnerPhotoUrl();

export function OwnerAvatar({
  initials = 'NX',
  alt = `${BRAND.name} Founder`,
  variant = 'portrait',
  className = '',
  imageClassName = '',
  badgeOffset = false,
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(resolvedPhotoUrl) && !imgError;

  const displayInitials = String(initials || 'NX')
    .trim()
    .slice(0, 3)
    .toUpperCase();

  if (variant === 'circle') {
    return (
      <div
        className={clsx(
          'relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-card-border bg-brand-soft shadow-sm',
          className
        )}
      >
        {showImage ? (
          <MotionImage
            src={resolvedPhotoUrl}
            alt={alt}
            loading="lazy"
            onError={() => setImgError(true)}
            className={clsx('w-full h-full object-cover object-top', imageClassName)}
          />
        ) : (
          <div
            role="img"
            aria-label={alt}
            className="w-full h-full flex items-center justify-center bg-brand-soft text-brand-soft-text font-mono font-bold text-sm tracking-wider select-none"
          >
            <bdi dir="ltr">{displayInitials}</bdi>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'relative w-full h-full overflow-hidden bg-section-band',
        className
      )}
    >
      {showImage ? (
        <MotionImage
          src={resolvedPhotoUrl}
          alt={alt}
          loading="lazy"
          onError={() => setImgError(true)}
          className={clsx(
            'w-full h-full object-cover object-top transition-transform duration-300 ease-nexus group-hover:scale-105',
            imageClassName
          )}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className={clsx(
            'relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-section-band via-brand-soft/65 to-section-band select-none',
            badgeOffset && 'pb-16'
          )}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgb(var(--bc-primary) / 0.35) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center gap-3.5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-card border border-card-border shadow-card flex items-center justify-center">
              <LogoMark className="w-14 h-14 sm:w-16 sm:h-16" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card border border-card-border text-xs font-bold tracking-wider text-on-surface">
              <span className="material-symbols-rounded icon-gradient text-[16px]" aria-hidden="true">
                code_blocks
              </span>
              <bdi dir="ltr">{BRAND.wordmark}</bdi>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
