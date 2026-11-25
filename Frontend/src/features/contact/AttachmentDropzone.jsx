import React, { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { formatFileSize } from '../../lib/format';
import {
  ALLOWED_INQUIRY_MIMES,
  MAX_INQUIRY_FILES,
  MAX_INQUIRY_FILE_SIZE,
} from '../../api/inquiries';

function getFileExtensionMime(fileName = '') {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return '';
}

function isAllowedAttachment(file) {
  const mime = (file?.type || '').toLowerCase() || getFileExtensionMime(file?.name);
  return ALLOWED_INQUIRY_MIMES.includes(mime);
}

export function AttachmentDropzone({ files = [], onChange, disabled = false }) {
  const { t } = useTranslation('contact');
  const { lang } = useLang();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => {
      const mime = (file.type || '').toLowerCase() || getFileExtensionMime(file.name);
      const isImage = mime.startsWith('image/');
      return {
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
      };
    });

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [files]);

  const handleIncomingFiles = (incomingList) => {
    if (disabled) return;
    setLocalError('');
    const incoming = Array.from(incomingList || []);
    if (incoming.length === 0) return;

    const accepted = [...files];
    let firstError = '';

    for (const file of incoming) {
      if (!isAllowedAttachment(file)) {
        if (!firstError) {
          firstError = t('form.errors.invalidFileType', { name: file.name });
        }
        continue;
      }

      if (file.size > MAX_INQUIRY_FILE_SIZE) {
        if (!firstError) {
          firstError = t('form.errors.fileTooLarge', { name: file.name });
        }
        continue;
      }

      const duplicate = accepted.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );
      if (duplicate) continue;

      if (accepted.length >= MAX_INQUIRY_FILES) {
        if (!firstError) {
          firstError = t('form.errors.maxFiles');
        }
        break;
      }

      accepted.push(file);
    }

    if (firstError) {
      setLocalError(firstError);
    }

    onChange?.(accepted);
  };

  const handleFileInputChange = (event) => {
    handleIncomingFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    handleIncomingFiles(event.dataTransfer?.files);
  };

  const handleRemove = (indexToRemove) => {
    setLocalError('');
    const next = files.filter((_, idx) => idx !== indexToRemove);
    onChange?.(next);
  };

  const isMaxReached = files.length >= MAX_INQUIRY_FILES;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-on-surface flex items-center gap-1.5 select-none"
        >
          <span className="material-symbols-outlined text-primary text-[18px]">
            attach_file
          </span>
          <span>{t('form.fields.attachments.label')}</span>
        </label>

        {files.length > 0 && (
          <span className="text-xs font-mono text-primary">
            {t('form.fields.attachments.selectedCount', {
              count: files.length,
              max: MAX_INQUIRY_FILES,
            })}
          </span>
        )}
      </div>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !isMaxReached) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
        className={clsx(
          'relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed text-center transition-all duration-300 ease-nexus select-none',
          'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary',
          isDragOver
            ? 'border-primary bg-brand-soft/80'
            : 'border-primary/35 bg-brand-soft/35 hover:border-primary hover:bg-brand-soft/60',
          (disabled || isMaxReached) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ALLOWED_INQUIRY_MIMES.join(',')}
          disabled={disabled || isMaxReached}
          aria-describedby={localError ? errorId : undefined}
          onChange={handleFileInputChange}
          className="sr-only"
        />

        <div className="w-12 h-12 rounded-lg bg-brand-soft flex items-center justify-center mb-3">
          <span className="material-symbols-rounded icon-gradient text-[24px]" aria-hidden="true">cloud_upload</span>
        </div>

        <span className="text-sm font-semibold text-on-surface">
          {t('form.fields.attachments.dropLabel')}
        </span>
        <span className="text-xs text-on-surface-variant mt-1">
          {t('form.fields.attachments.dropHint')}
        </span>
      </label>

      {localError && (
        <p
          id={errorId}
          role="alert"
          className="text-xs sm:text-[13px] text-error flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{localError}</span>
        </p>
      )}

      {/* Previews list */}
      {previews.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {previews.map((item, idx) => (
            <li
              key={item.key}
              className="relative flex items-center gap-3 p-2.5 rounded-xl bg-surface-container border border-outline-variant/80 min-w-0"
            >
              {item.isImage && item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-outline-variant/60 bg-surface-container-low"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-error/10 border border-error/25 text-error flex flex-col items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate" title={item.file.name}>
                  {item.file.name}
                </p>
                <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                  {formatFileSize(item.file.size, lang)}
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => handleRemove(idx)}
                aria-label={t('form.fields.attachments.removeFile', { name: item.file.name })}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
