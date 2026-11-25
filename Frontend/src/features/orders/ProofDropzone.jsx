import React, { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { formatFileSize } from '../../lib/format';
import {
  ALLOWED_PROOF_MIMES,
  MAX_PROOF_FILE_SIZE,
} from '../../api/orderTracking';

function detectMimeByName(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return '';
}

export function ProofDropzone({ file, onChange, disabled = false }) {
  const { t } = useTranslation('orders');
  const { lang } = useLang();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const mime = (file.type || '').toLowerCase() || detectMimeByName(file.name);
    if (mime.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const validateAndSelect = (incomingFile) => {
    if (disabled || !incomingFile) return;
    setLocalError('');

    const mime =
      (incomingFile.type || '').toLowerCase() || detectMimeByName(incomingFile.name);
    if (!ALLOWED_PROOF_MIMES.includes(mime)) {
      setLocalError(t('tracking.payment.manual.invalidFileType'));
      return;
    }

    if (incomingFile.size > MAX_PROOF_FILE_SIZE) {
      setLocalError(t('tracking.payment.manual.fileTooLarge'));
      return;
    }

    onChange?.(incomingFile);
  };

  return (
    <div className="space-y-2.5">
      {!file ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            validateAndSelect(e.dataTransfer?.files?.[0]);
          }}
          className={clsx(
            'relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed text-center transition-all duration-300 ease-nexus select-none',
            'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary',
            isDragOver
              ? 'border-primary bg-brand-soft/80'
              : 'border-primary/35 bg-brand-soft/35 hover:border-primary hover:bg-brand-soft/60',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ALLOWED_PROOF_MIMES.join(',')}
            disabled={disabled}
            aria-describedby={localError ? errorId : undefined}
            onChange={(e) => {
              validateAndSelect(e.target.files?.[0]);
              e.target.value = '';
            }}
            className="sr-only"
          />

          <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center mb-3">
            <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">
              cloud_upload
            </span>
          </div>

          <span className="text-sm font-semibold text-on-surface">
            {t('tracking.payment.manual.dropLabel')}
          </span>
          <span className="text-xs text-on-surface-variant mt-1">
            {t('tracking.payment.manual.dropHint')}
          </span>
        </label>
      ) : (
        <div className="p-3.5 rounded-xl bg-surface-container border border-primary/35 flex items-center gap-3.5">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-outline-variant/70 bg-surface-container-low"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-error/10 border border-error/25 text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">
                picture_as_pdf
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs font-mono text-on-surface-variant mt-0.5">
              {formatFileSize(file.size, lang)}
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setLocalError('');
              onChange?.(null);
            }}
            aria-label={t('common:actions.remove')}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      )}

      {localError && (
        <p
          id={errorId}
          role="alert"
          className="text-xs sm:text-[13px] text-error flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">
            error
          </span>
          <span>{localError}</span>
        </p>
      )}
    </div>
  );
}
