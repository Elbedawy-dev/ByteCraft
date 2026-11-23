import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { getApiErrorMessage } from '@/api/client';
import { useDeleteOwnerUpload, useUploadOwnerImages } from '@/api/owner/uploads';
import { useToast } from '@/app/providers';
import { formatNumber } from '@/lib/format';
import { Badge, Button } from '@/components/ui';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

export function ProjectMediaSection({
  thumbnail,
  gallery = [],
  onChangeMedia,
  errorMessage,
}) {
  const { t } = useTranslation('ownerProjects');
  const toast = useToast();

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [clientErrors, setClientErrors] = useState([]);
  const [deletingPublicId, setDeletingPublicId] = useState(null);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const uploadMutation = useUploadOwnerImages();
  const deleteMutation = useDeleteOwnerUpload();

  const totalCount = (thumbnail ? 1 : 0) + gallery.length;

  const allItems = [
    ...(thumbnail ? [{ ...thumbnail, isCover: true, galleryIndex: -1 }] : []),
    ...gallery.map((img, idx) => ({ ...img, isCover: false, galleryIndex: idx })),
  ];

  const handleFilesSelected = async (rawFiles) => {
    const fileList = Array.from(rawFiles || []);
    if (fileList.length === 0) return;

    setClientErrors([]);
    const validationIssues = [];
    const validFiles = [];

    for (const file of fileList) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        validationIssues.push(t('modal.media.validation.invalidType', { name: file.name }));
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        validationIssues.push(t('modal.media.validation.tooLarge', { name: file.name }));
        continue;
      }
      validFiles.push(file);
    }

    if (validationIssues.length > 0) {
      setClientErrors(validationIssues);
    }

    if (validFiles.length === 0) return;

    setUploadProgress(5);
    try {
      const uploadedImages = await uploadMutation.mutateAsync({
        files: validFiles,
        onProgress: (pct) => setUploadProgress(pct),
      });

      if (uploadedImages.length > 0) {
        const normalized = uploadedImages.map((img) => ({
          url: img.url,
          publicId: img.publicId,
        }));

        if (!thumbnail) {
          const [first, ...rest] = normalized;
          onChangeMedia({
            thumbnail: first,
            gallery: [...gallery, ...rest],
          });
        } else {
          onChangeMedia({
            thumbnail,
            gallery: [...gallery, ...normalized],
          });
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetAsCover = (galleryIndex) => {
    const chosen = gallery[galleryIndex];
    if (!chosen) return;

    const remaining = gallery.filter((_, idx) => idx !== galleryIndex);
    const nextGallery = thumbnail ? [thumbnail, ...remaining] : remaining;
    onChangeMedia({
      thumbnail: chosen,
      gallery: nextGallery,
    });
    setStatusAnnouncement(t('modal.media.reorderAnnouncement', { count: totalCount }));
  };

  const handleMoveGallery = (galleryIndex, direction) => {
    const targetIndex = galleryIndex + direction;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const nextGallery = [...gallery];
    const [moved] = nextGallery.splice(galleryIndex, 1);
    nextGallery.splice(targetIndex, 0, moved);

    onChangeMedia({
      thumbnail,
      gallery: nextGallery,
    });
    setStatusAnnouncement(t('modal.media.reorderAnnouncement', { count: totalCount }));
  };

  const handleRemoveImage = async (item) => {
    if (!item?.publicId) return;
    setDeletingPublicId(item.publicId);
    try {
      await deleteMutation.mutateAsync(item.publicId);
      toast.success(t('toasts.imageRemoved'));
    } catch (err) {
      // Best effort: remove from form even if already missing remotely, while notifying on non-404 errors
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingPublicId(null);
    }

    if (item.isCover) {
      if (gallery.length > 0) {
        const [promoted, ...rest] = gallery;
        onChangeMedia({ thumbnail: promoted, gallery: rest });
      } else {
        onChangeMedia({ thumbnail: null, gallery: [] });
      }
    } else {
      onChangeMedia({
        thumbnail,
        gallery: gallery.filter((_, idx) => idx !== item.galleryIndex),
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
          <span>{t('modal.media.heading')}</span>
          <span className="text-primary font-bold" aria-hidden="true">
            *
          </span>
        </h3>
        <span className="text-xs font-mono text-on-surface-variant">
          {t('modal.media.countLabel', { count: formatNumber(totalCount) })}
        </span>
      </div>

      {/* Drag & Drop Upload Zone (Stitch Screen 7 style) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploadMutation.isPending) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploadMutation.isPending) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (!uploadMutation.isPending && e.dataTransfer.files?.length) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        className={clsx(
          'rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all cursor-pointer select-none text-center',
          isDragOver
            ? 'border-primary bg-chip-mint-bg/60'
            : errorMessage
              ? 'border-error/70 bg-input hover:border-error'
              : 'border-input-border bg-input hover:border-primary/60 hover:bg-card',
          uploadMutation.isPending && 'opacity-65 cursor-wait'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploadMutation.isPending}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="sr-only"
        />

        <div className="w-12 h-12 rounded-full bc-chip-mint border flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
        </div>

        <p className="text-sm font-semibold text-on-surface">{t('modal.media.dropzoneTitle')}</p>
        <span className="text-xs font-mono text-on-surface-variant">
          {t('modal.media.dropzoneHint')}
        </span>
      </div>

      {/* Active Upload Progress Bar */}
      {uploadMutation.isPending && (
        <div
          className="p-3 rounded-xl bg-surface-container border border-primary/30 space-y-2"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-xs font-medium text-primary">
            <span>{t('modal.media.uploadingProgress', { percent: formatNumber(uploadProgress) })}</span>
            <span className="font-mono">{formatNumber(uploadProgress)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full bg-primary-gradient transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Client File Validation Errors */}
      {clientErrors.length > 0 && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-error/10 border border-error/30 space-y-1 text-xs text-error"
        >
          {clientErrors.map((msg, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Form-level Thumbnail Error */}
      {errorMessage && (
        <p role="alert" className="text-xs sm:text-[13px] text-error flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Screen reader status for gallery reorder */}
      <p role="status" className="visually-hidden">
        {statusAnnouncement}
      </p>

      {/* Media Preview Strip */}
      {allItems.length === 0 ? (
        <p className="text-xs text-on-surface-variant p-4 rounded-xl bg-surface-container border border-outline-variant/50 text-center">
          {t('modal.media.emptyMedia')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {allItems.map((item, idx) => {
            const isDeleting = deletingPublicId === item.publicId;
            return (
              <div
                key={`${item.publicId}-${idx}`}
                className={clsx(
                  'relative bg-surface-container rounded-xl overflow-hidden border transition-all flex flex-col',
                  item.isCover ? 'border-primary/70 ring-1 ring-primary/20' : 'border-outline-variant'
                )}
              >
                <div className="relative w-full aspect-video bg-surface-container-high overflow-hidden">
                  <img
                    src={item.url}
                    alt={
                      item.isCover
                        ? t('modal.media.primaryCoverBadge')
                        : t('modal.media.galleryItemLabel', { index: item.galleryIndex + 1 })
                    }
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {item.isCover && (
                    <span className="absolute top-2 start-2 bg-primary text-on-primary text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-sm inline-flex items-center gap-1">
                      <span className="material-symbols-outlined material-symbols-filled text-[14px]">
                        star
                      </span>
                      <span>{t('modal.media.primaryCoverBadge')}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewImage(item)}
                    aria-label={t('modal.media.zoomImage')}
                    title={t('modal.media.zoomImage')}
                    className="absolute top-2 end-2 w-8 h-8 rounded-lg bg-surface/90 text-on-surface border border-card-border hover:bg-surface flex items-center justify-center transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                  </button>
                </div>

                {/* Persistent Touch-Friendly Action Strip */}
                <div className="p-2 bg-surface-container-high/80 flex items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1 min-w-0">
                    {!item.isCover ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetAsCover(item.galleryIndex)}
                          className="px-2 py-1.5 rounded-lg bg-surface border border-card-border text-primary hover:bg-primary hover:text-on-primary font-medium transition-colors truncate"
                          title={t('modal.media.setAsCover')}
                        >
                          {t('modal.media.setAsCover')}
                        </button>
                        <button
                          type="button"
                          disabled={item.galleryIndex === 0}
                          onClick={() => handleMoveGallery(item.galleryIndex, -1)}
                          aria-label={t('modal.media.moveEarlier')}
                          title={t('modal.media.moveEarlier')}
                          className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-35 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[16px] rtl:-scale-x-100">
                            arrow_back
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={item.galleryIndex === gallery.length - 1}
                          onClick={() => handleMoveGallery(item.galleryIndex, 1)}
                          aria-label={t('modal.media.moveLater')}
                          title={t('modal.media.moveLater')}
                          className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-35 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[16px] rtl:-scale-x-100">
                            arrow_forward
                          </span>
                        </button>
                      </>
                    ) : (
                      <Badge variant="primary" size="sm">
                        {t('modal.media.primaryCoverBadge')}
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    loading={isDeleting}
                    disabled={isDeleting || uploadMutation.isPending}
                    onClick={() => handleRemoveImage(item)}
                    aria-label={t('modal.media.removeImage')}
                    title={t('modal.media.removeImage')}
                    className="text-error hover:bg-error/15 !w-8 !h-8 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Quick Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-surface rounded-2xl overflow-hidden border border-outline-variant shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-outline-variant bg-card">
              <span className="text-xs font-mono text-on-surface-variant truncate">
                <bdi dir="ltr">{previewImage.publicId}</bdi>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                aria-label={t('modal.closeLabel')}
                className="w-9 h-9 rounded-lg bg-surface border border-card-border text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-2 bg-surface-dim flex items-center justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.publicId}
                className="max-h-[75dvh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
