import React from 'react';
import clsx from 'clsx';

/**
 * Renders a heading string in the Nexus two-tone style:
 * first word(s) in heading color, trailing word(s) in brand gradient.
 * Works naturally in both LTR (English) and RTL (Arabic).
 */
export function TwoToneText({ text, accent, highlightWords }) {
  if (accent) {
    return (
      <>
        {text ? <span>{text} </span> : null}
        <span className="text-brand-gradient">{accent}</span>
      </>
    );
  }

  if (typeof text !== 'string') {
    return text;
  }

  const trimmed = text.trim();
  if (!trimmed) return null;

  const words = trimmed.split(/\s+/);
  if (words.length <= 1) {
    return <span className="text-brand-gradient">{trimmed}</span>;
  }

  const count =
    typeof highlightWords === 'number' && highlightWords > 0
      ? Math.min(highlightWords, words.length - 1)
      : words.length >= 4
        ? 2
        : 1;

  const startPart = words.slice(0, words.length - count).join(' ');
  const endPart = words.slice(words.length - count).join(' ');

  return (
    <>
      <span>{startPart} </span>
      <span className="text-brand-gradient">{endPart}</span>
    </>
  );
}

export function SectionHeader({
  badge,
  title,
  accent,
  highlightWords,
  subtitle,
  action,
  align = 'center', // 'start' | 'center'
  as: HeadingTag = 'h2',
  className = '',
}) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-start',
        className
      )}
    >
      {badge && (
        <div>
          {typeof badge === 'string' ? (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-soft text-brand-soft-text border border-chip-mint-border select-none">
              {badge}
            </span>
          ) : (
            badge
          )}
        </div>
      )}

      {(title || accent) && (
        <HeadingTag className="text-headline-xl-mobile md:text-headline-xl font-extrabold text-on-surface">
          <TwoToneText text={title} accent={accent} highlightWords={highlightWords} />
        </HeadingTag>
      )}

      {subtitle && (
        <p className="text-body-md text-muted max-w-[560px]">
          {subtitle}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
