import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { AccessibleDialog } from './AccessibleDialog';
import { DemoCredentialsCard } from './DemoCredentialsCard';

const DEVICE_WIDTHS = [
  { id: 'desktop', icon: 'desktop_windows', widthClass: 'w-full' },
  { id: 'tablet', icon: 'tablet_mac', widthClass: 'w-[768px] max-w-full' },
  { id: 'mobile', icon: 'smartphone', widthClass: 'w-[375px] max-w-full' },
];

export function LivePreviewModal({ isOpen, onClose, project }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  const preview = project?.preview;
  const previewUrl = preview?.url?.trim() || '';
  const title = localized(project?.title, lang) || '';

  const [device, setDevice] = useState('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeState, setIframeState] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIframeState('loading');
    setSlowNotice(false);
    setDevice('desktop');
    setIsFullscreen(false);

    const timer = setTimeout(() => {
      setSlowNotice(true);
    }, 6500);

    return () => clearTimeout(timer);
  }, [isOpen, previewUrl]);

  if (!previewUrl) return null;

  const activeDevice = DEVICE_WIDTHS.find((d) => d.id === device) || DEVICE_WIDTHS[0];

  return (
    <AccessibleDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="live-preview-dialog-title"
      dialogClassName={isFullscreen ? '!p-0' : 'p-2 sm:p-4'}
      panelClassName={clsx(
        'transition-[width,height,border-radius] duration-300 ease-nexus',
        isFullscreen
          ? 'w-[100dvw] h-[100dvh] max-w-none rounded-none border-0'
          : 'w-full max-w-7xl h-[92dvh] sm:h-[90dvh]'
      )}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3 border-b border-card-border bg-card shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <h2
            id="live-preview-dialog-title"
            className="text-sm sm:text-base font-bold text-on-surface truncate"
          >
            {t('livePreview.modalTitle', { title })}
          </h2>
        </div>

        {/* Device Width Segmented Control */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={t('livePreview.deviceLabel')}
            className="hidden md:inline-flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant/60"
          >
            {DEVICE_WIDTHS.map((item) => {
              const active = item.id === device;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDevice(item.id)}
                  aria-pressed={active}
                  aria-label={t(`livePreview.${item.id}`)}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
                    active
                      ? 'bg-surface-container-highest text-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{t(`livePreview.${item.id}`)}</span>
                </button>
              );
            })}
          </div>

          {/* Open in New Tab */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              open_in_new
            </span>
            <span className="hidden sm:inline">{t('livePreview.openNewTab')}</span>
          </a>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-pressed={isFullscreen}
            aria-label={
              isFullscreen ? t('livePreview.exitFullscreen') : t('livePreview.enterFullscreen')
            }
            className="hidden sm:inline-flex w-10 h-10 rounded-xl items-center justify-center bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('livePreview.close')}
            autoFocus
            className="min-w-[40px] min-h-[40px] rounded-xl inline-flex items-center justify-center bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>
      </div>

      {/* Demo Credentials Bar (if available) */}
      <DemoCredentialsCard preview={preview} compact />

      {/* Iframe Viewport Stage */}
      <div className="relative flex-1 min-h-0 bg-surface-dim flex items-stretch justify-center p-0 sm:p-3 bc-scroll overflow-x-auto">
        <div
          className={clsx(
            'relative h-full bg-background transition-[width,max-width,border-radius,box-shadow] duration-300 ease-nexus flex flex-col overflow-hidden',
            activeDevice.widthClass,
            device !== 'desktop'
              ? 'border border-card-border rounded-xl shadow-card mx-auto'
              : 'rounded-none sm:rounded-xl sm:border sm:border-card-border'
          )}
        >
          {/* Loading Overlay */}
          {iframeState === 'loading' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-container-lowest/95 p-6 text-center">
              <Spinner size="lg" className="text-primary" />
              <p className="text-sm font-medium text-on-surface">{t('livePreview.loading')}</p>
              {slowNotice && (
                <div className="max-w-md space-y-3 pt-2">
                  <p className="text-xs text-on-surface-variant">
                    {t('livePreview.fallbackDescription')}
                  </p>
                  <Button
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary-gradient"
                    size="sm"
                    iconLeading={
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                          open_in_new
                        </span>
                      }
                  >
                      {t('livePreview.openNewTab')}
                    </Button>
                </div>
              )}
            </div>
          )}

          {/* Error Fallback State */}
          {iframeState === 'error' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
                  web_asset_off
                </span>
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-base font-bold text-on-surface">
                  {t('livePreview.fallbackTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {t('livePreview.fallbackDescription')}
                </p>
              </div>
              <Button
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary-gradient"
                size="md"
                iconLeading={
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      open_in_new
                    </span>
                  }
              >
                  {t('livePreview.openNewTab')}
                </Button>
            </div>
          ) : (
            <iframe
              key={previewUrl}
              src={previewUrl}
              title={t('livePreview.iframeTitle', { title })}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setIframeState('loaded')}
              onError={() => setIframeState('error')}
              className="w-full h-full flex-1 border-0 bg-white"
            />
          )}
        </div>
      </div>

      {/* Persistent Graceful Fallback Strip */}
      <div className="px-4 py-2 border-t border-outline-variant/60 bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">
            info
          </span>
          <span>{t('livePreview.fallbackBanner')}</span>
        </span>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          <span>{t('livePreview.openNewTab')}</span>
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            open_in_new
          </span>
        </a>
      </div>
    </AccessibleDialog>
  );
}
