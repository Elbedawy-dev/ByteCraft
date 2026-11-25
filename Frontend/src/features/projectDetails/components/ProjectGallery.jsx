import React, { useState, useMemo, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { MotionImage } from '../../../components/ui/Motion';
import { AccessibleDialog } from './AccessibleDialog';

export function ProjectGallery({ project, onOpenLiveDemo }) {
  const { t } = useTranslation('projectDetails');
  const { lang, dir } = useLang();

  const title = localized(project?.title, lang) || '';
  const hasPreview = Boolean(project?.preview?.url?.trim());

  const images = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addImage = (img) => {
      const url = typeof img === 'string' ? img.trim() : img?.url?.trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      list.push({
        url,
        publicId: typeof img === 'object' ? img.publicId : url,
      });
    };

    if (project?.thumbnail) addImage(project.thumbnail);
    if (Array.isArray(project?.gallery)) {
      project.gallery.forEach(addImage);
    }
    return list;
  }, [project]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState(() => new Set());

  useEffect(() => {
    setActiveIndex(0);
    setLightboxOpen(false);
    setFailedUrls(new Set());
  }, [project?.slug]);

  const safeIndex = images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0;
  const currentImage = images[safeIndex] || null;
  const isCurrentBroken = !currentImage || failedUrls.has(currentImage.url);

  const markBroken = useCallback((url) => {
    if (!url) return;
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleGalleryKeyDown = (e) => {
    if (images.length <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (dir === 'rtl') goNext();
      else goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (dir === 'rtl') goPrev();
      else goNext();
    }
  };

  return (
    <section className="flex flex-col gap-3 sm:gap-4" aria-label={title}>
      {/* Primary Showcase Container (20px radius = rounded-2xl) */}
      <div className="relative rounded-2xl overflow-hidden bg-card border border-card-border shadow-card group">
        <div className="relative aspect-[16/10] w-full bg-section-band overflow-hidden">
          {!isCurrentBroken ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={t('gallery.openLightbox')}
              className="block w-full h-full relative text-start cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <MotionImage
                key={currentImage.url}
                src={currentImage.url}
                alt={t('gallery.imageAlt', { title, index: safeIndex + 1 })}
                onError={() => markBroken(currentImage.url)}
                className="w-full h-full object-cover transition-transform duration-300 ease-nexus group-hover:scale-[1.015]"
              />
              {/* Subtle zoom hint pill */}
              <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/95 backdrop-blur-md border border-card-border text-xs font-semibold text-on-surface shadow-sm transition-colors group-hover:border-primary/50">
                <span className="material-symbols-rounded text-[16px] text-primary" aria-hidden="true">
                  zoom_in
                </span>
                <span className="hidden sm:inline">{t('gallery.openLightbox')}</span>
                {images.length > 1 && (
                  <bdi dir="ltr" className="font-mono text-[11px] text-muted">
                    {t('gallery.counter', { current: safeIndex + 1, total: images.length })}
                  </bdi>
                )}
              </span>
            </button>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-section-band via-brand-soft/60 to-section-band text-muted p-6 text-center">
              <span className="material-symbols-rounded icon-gradient text-[48px] mb-2" aria-hidden="true">
                code_blocks
              </span>
              <span className="text-xs font-semibold text-muted">{t('gallery.placeholder')}</span>
            </div>
          )}

          {/* Top Status Pills */}
          {(hasPreview || project?.isFeatured) && (
            <div className="absolute top-3 start-3 end-3 flex flex-wrap items-center gap-2 pointer-events-none z-10">
              {hasPreview && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-soft/95 backdrop-blur-md border border-chip-mint-border text-brand-soft-text font-semibold text-xs shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                  <span>{t('badges.livePreview')}</span>
                </span>
              )}
            </div>
          )}

          {/* Sibling Live Demo Pill Button */}
          {hasPreview && onOpenLiveDemo && (
            <button
              type="button"
              onClick={onOpenLiveDemo}
              className="absolute bottom-3 end-3 z-20 inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-full bg-card/95 hover:bg-brand-soft text-primary font-semibold text-xs border border-primary/40 hover:border-primary backdrop-blur-md transition-all shadow-sm"
            >
              <span className="material-symbols-rounded text-[16px]" aria-hidden="true">
                {project?.preview?.mode === 'external' ? 'open_in_new' : 'desktop_windows'}
              </span>
              <span className="sm:hidden">{t('common:actions.liveDemo')}</span>
              <span className="hidden sm:inline">{t('packages.liveDemo')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3"
          onKeyDown={handleGalleryKeyDown}
        >
          {images.map((img, idx) => {
            const isActive = idx === safeIndex;
            const broken = failedUrls.has(img.url);

            return (
              <button
                key={`${img.url}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-pressed={isActive}
                aria-label={t('gallery.selectImage', { index: idx + 1, total: images.length })}
                className={clsx(
                  'relative rounded-lg overflow-hidden bg-surface-container-low aspect-video transition-all border',
                  isActive
                    ? 'ring-2 ring-primary border-primary opacity-100 shadow-md'
                    : 'border-outline-variant/60 opacity-70 hover:opacity-100 hover:border-outline'
                )}
              >
                {!broken ? (
                  <img
                    src={img.url}
                    alt={t('gallery.imageAlt', { title, index: idx + 1 })}
                    loading="lazy"
                    onError={() => markBroken(img.url)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px] opacity-60" aria-hidden="true">
                      broken_image
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Keyboard-Accessible Lightbox Dialog */}
      <AccessibleDialog
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        labelledBy="lightbox-dialog-title"
        panelClassName="max-w-5xl max-h-[92dvh] bg-surface-container-lowest"
      >
        <div
          className="flex flex-col h-full max-h-[92dvh]"
          onKeyDown={handleGalleryKeyDown}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-outline-variant/60 bg-surface-container-low shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <h2
                id="lightbox-dialog-title"
                className="text-sm sm:text-base font-bold text-on-surface truncate"
              >
                {t('gallery.lightboxTitle', { title })}
              </h2>
              {images.length > 0 && (
                <bdi
                  dir="ltr"
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-container border border-outline-variant/50 text-on-surface-variant shrink-0"
                >
                  {t('gallery.counter', { current: safeIndex + 1, total: images.length })}
                </bdi>
              )}
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label={t('gallery.closeLightbox')}
              autoFocus
              className="min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>

          {/* Lightbox Main Image Stage */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center bg-surface-dim p-3 sm:p-6">
            {!isCurrentBroken ? (
              <img
                src={currentImage.url}
                alt={t('gallery.imageAlt', { title, index: safeIndex + 1 })}
                onError={() => markBroken(currentImage.url)}
                className="max-h-[65dvh] max-w-full w-auto object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-on-surface-variant p-12">
                <span className="material-symbols-outlined text-[48px] text-primary/40 mb-2" aria-hidden="true">
                  broken_image
                </span>
                <span className="text-sm">{t('gallery.placeholder')}</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t('gallery.previousImage')}
                  className="absolute start-3 sm:start-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container/90 hover:bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary flex items-center justify-center shadow-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px] rtl:-scale-x-100" aria-hidden="true">
                    chevron_left
                  </span>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t('gallery.nextImage')}
                  className="absolute end-3 sm:end-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container/90 hover:bg-surface-container-high border border-outline-variant text-on-surface hover:text-primary flex items-center justify-center shadow-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px] rtl:-scale-x-100" aria-hidden="true">
                    chevron_right
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t border-outline-variant/60 bg-surface-container-low overflow-x-auto shrink-0">
              {images.map((img, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={`lb-${img.url}-${idx}`}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-pressed={isActive}
                    aria-label={t('gallery.selectImage', { index: idx + 1, total: images.length })}
                    className={clsx(
                      'w-16 sm:w-20 aspect-video rounded-md overflow-hidden shrink-0 border transition-all',
                      isActive
                        ? 'ring-2 ring-primary border-primary opacity-100'
                        : 'border-outline-variant opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </AccessibleDialog>
    </section>
  );
}
