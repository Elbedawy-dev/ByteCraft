import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/app/providers';
import { formatDateTime } from '@/lib/format';
import { Button, CopyButton } from '@/components/ui';
import { OwnerModal } from './NativeDialog';
import { isPdfProofUrl } from './orderMeta';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function PaymentProofViewer({ proof }) {
  const { t } = useTranslation(['ownerOrders', 'common']);
  const { lang } = useLang();
  const [zoom, setZoom] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [imgError, setImgError] = useState(false);

  const url = proof?.url || '';
  const isPdf = isPdfProofUrl(url);

  useEffect(() => {
    setZoom(1);
    setLightboxZoom(1);
    setImgError(false);
  }, [url]);

  if (!proof || !url) {
    return (
      <div className="rounded-xl border border-dashed border-card-border bg-card p-4 text-sm text-on-surface-variant flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">receipt_long</span>
        <span>{t('ownerOrders:drawer.proof.noProof')}</span>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));
  const handleReset = () => setZoom(1);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
      {/* Proof metadata row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-on-surface-variant">{t('ownerOrders:drawer.proof.reference')}:</span>
          {proof.reference ? (
            <div className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant">
              <bdi dir="ltr" className="font-mono text-on-surface font-medium">
                {proof.reference}
              </bdi>
              <CopyButton
                text={proof.reference}
                size="icon-sm"
                className="!w-6 !h-6"
                copiedLabel={t('common:actions.copied')}
              />
            </div>
          ) : (
            <span className="text-on-surface-variant">{t('ownerOrders:drawer.proof.noReference')}</span>
          )}
        </div>

        {proof.submittedAt && (
          <span className="text-on-surface-variant font-mono">
            {t('ownerOrders:drawer.proof.submittedAt')}: {formatDateTime(proof.submittedAt, lang)}
          </span>
        )}
      </div>

      {isPdf ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">picture_as_pdf</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-on-surface">
                {t('ownerOrders:drawer.proof.pdfLabel')}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t('ownerOrders:drawer.proof.pdfHint')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-xs font-semibold btn-primary-gradient"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span>{t('ownerOrders:drawer.proof.openPdf')}</span>
            </a>
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-medium border border-outline-variant bg-surface-container-high text-on-surface hover:border-primary/50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{t('ownerOrders:drawer.proof.downloadPdf')}</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-container border border-outline-variant">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM || imgError}
                className="w-9 h-9 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
                aria-label={t('ownerOrders:drawer.proof.zoomOut')}
                title={t('ownerOrders:drawer.proof.zoomOut')}
              >
                <span className="material-symbols-outlined text-[18px]">zoom_out</span>
              </button>
              <span className="px-2 text-xs font-mono font-semibold text-on-surface min-w-[3.25rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM || imgError}
                className="w-9 h-9 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
                aria-label={t('ownerOrders:drawer.proof.zoomIn')}
                title={t('ownerOrders:drawer.proof.zoomIn')}
              >
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 h-9 rounded-md text-xs font-medium text-primary hover:bg-surface-container-high transition-colors"
                >
                  {t('ownerOrders:drawer.proof.resetZoom')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!imgError && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setLightboxZoom(1);
                    setLightboxOpen(true);
                  }}
                  iconLeading={<span className="material-symbols-outlined text-[18px]">fullscreen</span>}
                >
                  {t('ownerOrders:drawer.proof.fullscreen')}
                </Button>
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-medium border border-outline-variant bg-surface-container text-on-surface hover:border-primary/50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>{t('ownerOrders:drawer.proof.openOriginal')}</span>
              </a>
            </div>
          </div>

          {/* Image preview box */}
          {imgError ? (
            <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center space-y-2">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                broken_image
              </span>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                {t('ownerOrders:drawer.proof.imageLoadError')}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest bc-scroll overflow-x-auto max-h-80 flex items-center justify-center p-2">
              <img
                src={url}
                alt={t('ownerOrders:drawer.sections.proof')}
                loading="lazy"
                onError={() => setImgError(true)}
                onClick={() => {
                  setLightboxZoom(1);
                  setLightboxOpen(true);
                }}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
                className="max-h-72 w-auto object-contain rounded-lg transition-transform duration-300 ease-nexus cursor-zoom-in"
              />
            </div>
          )}

          {/* Fullscreen Lightbox Modal */}
          <OwnerModal
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            size="full"
            title={t('ownerOrders:drawer.proof.lightboxTitle')}
            footer={
              <div className="w-full flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-container border border-outline-variant">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))))
                    }
                    disabled={lightboxZoom <= MIN_ZOOM}
                    className="w-10 h-10 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    aria-label={t('ownerOrders:drawer.proof.zoomOut')}
                  >
                    <span className="material-symbols-outlined text-[20px]">zoom_out</span>
                  </button>
                  <span className="px-3 text-xs font-mono font-semibold text-on-surface">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))))
                    }
                    disabled={lightboxZoom >= MAX_ZOOM}
                    className="w-10 h-10 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                    aria-label={t('ownerOrders:drawer.proof.zoomIn')}
                  >
                    <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxZoom(1)}
                    className="px-2.5 h-10 rounded-md text-xs font-medium text-primary hover:bg-surface-container-high"
                  >
                    {t('ownerOrders:drawer.proof.resetZoom')}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-xs font-medium border border-outline-variant bg-surface-container text-on-surface hover:border-primary/50"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    <span>{t('ownerOrders:drawer.proof.openOriginal')}</span>
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => setLightboxOpen(false)}>
                    {t('common:actions.close')}
                  </Button>
                </div>
              </div>
            }
          >
            <div className="bc-scroll overflow-x-auto max-h-[65dvh] rounded-xl bg-surface-container-lowest border border-outline-variant p-4 flex items-center justify-center">
              <img
                src={url}
                alt={t('ownerOrders:drawer.sections.proof')}
                style={{
                  transform: `scale(${lightboxZoom})`,
                  transformOrigin: 'center center',
                }}
                className="max-h-[60dvh] w-auto object-contain transition-transform duration-300 ease-nexus"
              />
            </div>
          </OwnerModal>
        </div>
      )}
    </div>
  );
}
