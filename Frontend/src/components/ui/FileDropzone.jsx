import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { formatFileSize } from '../../lib/format';

export function FileDropzone({
  onFilesSelected,
  accept = '*/*',
  maxSize, // in bytes
  multiple = false,
  disabled = false,
  label = 'Drag & drop files here, or click to browse',
  hint,
  className = '',
}) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndPass = (files) => {
    setError(null);
    const validFiles = [];

    for (const file of files) {
      if (maxSize && file.size > maxSize) {
        setError(`File ${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected?.(multiple ? validFiles : validFiles[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(Array.from(e.target.files));
    }
  };

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={clsx(
          'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all duration-150 text-center cursor-pointer select-none',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant hover:border-outline bg-surface-container-low hover:bg-surface-container',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
        />

        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-3">
          <span className="material-symbols-outlined text-[24px]">
            cloud_upload
          </span>
        </div>

        <p className="text-sm font-medium text-on-surface mb-1">
          {label}
        </p>

        {hint && (
          <p className="text-xs text-on-surface-variant">
            {hint}
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
