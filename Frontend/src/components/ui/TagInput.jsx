import React, { useState } from 'react';
import clsx from 'clsx';
import { Badge } from './Badge';

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tag and press Enter...',
  disabled = false,
  className = '',
  maxTags,
}) {
  const [inputVal, setInputVal] = useState('');

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
        'w-full min-h-[48px] p-2 rounded-lg bg-surface-container-low border border-outline-variant hover:border-outline focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all flex flex-wrap items-center gap-1.5',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {value.map((tag, idx) => (
        <Badge
          key={`${tag}-${idx}`}
          variant="primary"
          size="sm"
          className="ps-2 pe-1 py-1"
        >
          <span>{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ms-1 p-0.5 rounded hover:bg-primary/20 text-primary transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <span className="material-symbols-outlined text-[14px] block">close</span>
            </button>
          )}
        </Badge>
      ))}

      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(inputVal)}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled || (maxTags && value.length >= maxTags)}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-on-surface placeholder:text-muted/60 outline-none px-2 py-1"
      />
    </div>
  );
}
