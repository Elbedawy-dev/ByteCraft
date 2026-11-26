import React, { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';

export function TagInput({
  id,
  value = [],
  onChange,
  placeholder,
  disabled = false,
  error = false,
  className = '',
  maxTags,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) {
  const { t } = useTranslation('common');
  const [inputVal, setInputVal] = useState('');
  const resolvedPlaceholder = placeholder || t('tagInput.placeholder', { defaultValue: 'Add a tag and press Enter...' });

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange?.([...value, trimmed]);
    setInputVal('');
  };

  const removeTag = (indexToRemove) => {
    onChange?.(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div
      className={clsx(
        'w-full min-h-[48px] p-2 rounded-lg bg-input border transition-all duration-300 ease-nexus flex flex-wrap items-center gap-1.5',
        error
          ? 'border-error focus-within:border-error focus-within:ring-[3px] focus-within:ring-error/20'
          : 'border-input-border hover:border-outline focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {value.map((tag, idx) => (
        <Badge
          key={`${tag}-${idx}`}
          variant="primary"
          size="sm"
          className="ps-2.5 pe-1 py-1"
        >
          <span>{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ms-1 p-0.5 rounded-full hover:bg-primary/20 text-brand-soft-text transition-colors"
              aria-label={t('tagInput.removeTag', { tag, defaultValue: `Remove ${tag}` })}
            >
              <span className="material-symbols-rounded text-[14px] block" aria-hidden="true">close</span>
            </button>
          )}
        </Badge>
      ))}

      <input
        id={id}
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputVal)}
        placeholder={value.length === 0 ? resolvedPlaceholder : ''}
        disabled={disabled || (maxTags && value.length >= maxTags)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : undefined}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-on-surface placeholder:text-placeholder outline-none focus-visible:outline-none px-2 py-1"
      />
    </div>
  );
}
