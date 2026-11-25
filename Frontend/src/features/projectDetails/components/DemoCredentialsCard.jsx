import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import { useLang } from '../../../app/providers';
import { localized } from '../../../lib/localized';
import { MOTION_TRANSITION } from '../../../lib/motion';

function CredentialCopyRow({ label, value, copyAriaLabel }) {
  const { t } = useTranslation('projectDetails');
  const [status, setStatus] = useState('idle'); // 'idle' | 'copied' | 'failed'
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!value) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) {
      try {
        const field = Object.assign(document.createElement('textarea'), { value });
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
        document.body.append(field);
        field.select();
        ok = document.execCommand('copy');
        field.remove();
      } catch {
        ok = false;
      }
    }

    setStatus(ok ? 'copied' : 'failed');
    timerRef.current = setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-lowest/90 border border-outline-variant/60 px-3 py-2">
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] text-on-surface-variant mb-0.5">{label}</span>
        <bdi
          dir="ltr"
          className="block font-label-code text-xs text-on-surface select-all truncate text-start"
        >
          {value}
        </bdi>
      </div>

      <div className="relative flex items-center shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copyAriaLabel}
          className={clsx(
            'min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-lg inline-flex items-center justify-center transition-colors duration-300 ease-nexus border',
            status === 'copied'
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:text-primary hover:border-primary/40'
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={status === 'copied' ? 'copied' : 'idle'}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={MOTION_TRANSITION}
              className="material-symbols-outlined text-[18px] block"
              aria-hidden="true"
            >
              {status === 'copied' ? 'check' : 'content_copy'}
            </m.span>
          </AnimatePresence>
        </button>
        <span role="status" className="visually-hidden">
          {status === 'copied' ? t('credentials.copied') : ''}
        </span>
      </div>
    </div>
  );
}

export function DemoCredentialsCard({ preview, compact = false, className = '' }) {
  const { t } = useTranslation('projectDetails');
  const { lang } = useLang();

  if (!preview?.url?.trim()) return null;

  const note = localized(preview.demoNote, lang);
  const creds = preview.demoCredentials || {};
  const label = (creds.label || '').trim();
  const email = (creds.email || '').trim();
  const password = (creds.password || '').trim();

  if (!note && !email && !password) return null;

  if (compact) {
    return (
      <div
        className={clsx(
          'flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/60 text-xs',
          className
        )}
      >
        <div className="flex items-center gap-1.5 text-primary font-semibold">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            key
          </span>
          <span>{label || t('credentials.title')}</span>
        </div>

        {note && <span className="text-on-surface-variant">{note}</span>}

        <div className="flex flex-wrap items-center gap-2 ms-auto">
          {email && (
            <CompactCopyChip
              prefix={t('credentials.email')}
              value={email}
              ariaLabel={t('credentials.copyEmail')}
              copiedMsg={t('credentials.copied')}
            />
          )}
          {password && (
            <CompactCopyChip
              prefix={t('credentials.password')}
              value={password}
              ariaLabel={t('credentials.copyPassword')}
              copiedMsg={t('credentials.copied')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-xl bg-surface-container border border-outline-variant/70 p-3.5 space-y-2.5',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
          <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">
            key
          </span>
          <span>{t('credentials.title')}</span>
        </div>
        {label && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-high text-primary border border-primary/20">
            <bdi dir="ltr">{label}</bdi>
          </span>
        )}
      </div>

      {note && <p className="text-xs text-on-surface-variant leading-relaxed">{note}</p>}

      {(email || password) && (
        <div className="space-y-2">
          {email && (
            <CredentialCopyRow
              label={t('credentials.email')}
              value={email}
              copyAriaLabel={t('credentials.copyEmail')}
            />
          )}
          {password && (
            <CredentialCopyRow
              label={t('credentials.password')}
              value={password}
              copyAriaLabel={t('credentials.copyPassword')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CompactCopyChip({ prefix, value, ariaLabel, copiedMsg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const field = Object.assign(document.createElement('textarea'), { value });
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
      document.body.append(field);
      field.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } finally {
        field.remove();
      }
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container border border-outline-variant/60 ps-2.5 pe-1 py-1">
      <span className="text-[11px] text-on-surface-variant">{prefix}:</span>
      <bdi dir="ltr" className="font-label-code text-xs text-on-surface select-all">
        {value}
      </bdi>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel}
        className={clsx(
          'w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors duration-300 ease-nexus',
          copied
            ? 'text-primary bg-primary/10'
            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={copied ? 'copied' : 'idle'}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={MOTION_TRANSITION}
            className="material-symbols-outlined text-[15px] block"
            aria-hidden="true"
          >
            {copied ? 'check' : 'content_copy'}
          </m.span>
        </AnimatePresence>
      </button>
      <span role="status" className="visually-hidden">
        {copied ? copiedMsg : ''}
      </span>
    </span>
  );
}
