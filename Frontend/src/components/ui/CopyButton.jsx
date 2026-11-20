import React, { useState } from 'react';
import clsx from 'clsx';
import { Button } from './Button';

export function CopyButton({
  text,
  label,
  copiedLabel = 'Copied!',
  size = 'icon-sm',
  variant = 'ghost',
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard fails
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleCopy}
      className={clsx('transition-colors', className)}
      title={copied ? copiedLabel : (label || 'Copy to clipboard')}
      aria-label={copied ? copiedLabel : (label || 'Copy to clipboard')}
    >
      <span
        className={clsx(
          'material-symbols-outlined text-[18px] transition-transform',
          copied && 'text-primary scale-110'
        )}
      >
        {copied ? 'check' : 'content_copy'}
      </span>
      {label && <span className="ms-1.5">{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
