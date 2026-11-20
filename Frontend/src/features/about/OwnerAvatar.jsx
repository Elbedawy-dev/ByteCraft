import React, { useState } from 'react';
import clsx from 'clsx';

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
  initials = 'BC',
  alt = 'ByteCraft Founder',
  variant = 'portrait', // 'portrait' | 'circle'
  className = '',
  imageClassName = '',
  badgeOffset = false,
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(resolvedPhotoUrl) && !imgError;

  const displayInitials = String(initials || 'BC')
    .trim()
    .slice(0, 3)
    .toUpperCase();

  if (variant === 'circle') {
    return (
      <div
        className={clsx(
          'relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-outline-variant/80 bg-surface-container-high shadow-sm',
          className
        )}
      >
        {showImage ? (
          <img
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
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-container-high via-surface-container to-primary/20 text-primary font-code font-bold text-sm tracking-wider select-none"
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
        'relative w-full h-full overflow-hidden bg-surface-container',
        className
      )}
    >
      {showImage ? (
        <img
          src={resolvedPhotoUrl}
          alt={alt}
          loading="lazy"
          onError={() => setImgError(true)}
          className={clsx(
            'w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105',
            imageClassName
          )}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className={clsx(
            'relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-lowest via-surface-container to-surface-container-high select-none',
            badgeOffset && 'pb-16'
          )}
        >
          {/* Subtle architectural dot pattern & radial highlight */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(rgb(var(--bc-primary) / 0.35) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/15 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-container-low/90 border border-primary/35 shadow-primary-glow flex items-center justify-center">
              <span className="font-code text-3xl sm:text-4xl font-extrabold tracking-widest text-primary">
                <bdi dir="ltr">{displayInitials}</bdi>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low/80 border border-outline-variant/60 text-[11px] font-code text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">
                terminal
              </span>
              <bdi dir="ltr">ByteCraft Studio</bdi>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
