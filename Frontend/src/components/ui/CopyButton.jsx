import React, { useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';
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
      className={clsx('transition-colors duration-300 ease-nexus', copied && 'text-primary', className)}
      title={copied ? copiedLabel : (label || 'Copy to clipboard')}
      aria-label={copied ? copiedLabel : (label || 'Copy to clipboard')}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={copied ? 'copied' : 'idle'}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={MOTION_TRANSITION}
          className={clsx(
            'material-symbols-rounded text-[18px] block',
            copied && 'text-primary'
          )}
          aria-hidden="true"
        >
          {copied ? 'check' : 'content_copy'}
        </m.span>
      </AnimatePresence>
      {label && <span className="ms-1.5">{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
