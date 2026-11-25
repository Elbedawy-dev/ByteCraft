import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../app/providers';
import { slideFromEnd } from '../../lib/motion';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Motion';
import { HeroCubes } from './HeroCubes';
import { TwoToneText } from './SectionHeader';

function resolveIcon(iconName, fallback = 'arrow_forward') {
  return iconName || fallback;
}

function ActionButton({ action, variant = 'primary-gradient' }) {
  if (!action) return null;

  const isPrimary = variant === 'primary-gradient';
  const iconName = resolveIcon(action.icon, isPrimary ? 'arrow_forward' : null);
  const isDirectionalArrow =
    iconName === 'arrow_forward' || iconName === 'arrow_right_alt' || iconName === 'east';

  const iconEl = iconName ? (
    <span
      className={clsx(
        'material-symbols-rounded text-[19px]',
        isDirectionalArrow && 'rtl:-scale-x-100'
      )}
      aria-hidden="true"
    >
      {iconName}
    </span>
  ) : undefined;

  const buttonNode = (
    <Button
      variant={variant}
      size="lg"
      onClick={action.onClick}
      className="w-full sm:w-auto"
      iconLeading={!isPrimary && !isDirectionalArrow ? iconEl : undefined}
      iconTrailing={isPrimary || isDirectionalArrow ? iconEl : undefined}
    >
      {action.label}
    </Button>
  );

  if (action.to) {
    return (
      <Link to={action.to} className="w-full sm:w-auto">
        {buttonNode}
      </Link>
    );
  }

  if (action.href) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto"
      >
        {buttonNode}
      </a>
    );
  }

  return buttonNode;
}

export function CtaBanner({
  badge,
  title,
  accent,
  description,
  primaryAction,
  secondaryAction,
  features = [],
  className = '',
}) {
  const { t } = useTranslation('common');
  const { dir } = useLang();
  const resolvedBadge = badge || t('cta.badge', { defaultValue: 'Get in Touch' });

  return (
    <section
      className={clsx(
        'relative w-full bc-band-wash border-t border-outline-variant overflow-hidden py-16 lg:py-24',
        className
      )}
    >
      {/* Decorative translucent angled corner shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -start-16 w-64 h-64 rotate-12 rounded-3xl bg-gradient-to-br from-[#2B72CF]/10 to-transparent dark:from-[#2B72CF]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -end-16 w-72 h-72 -rotate-12 rounded-3xl bg-gradient-to-tl from-[#5443A9]/10 to-transparent dark:from-[#5443A9]/15"
      />

      <div className="relative z-10 max-w-container mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8">
        {/* Start Column: Copy + Pill Actions */}
        <Reveal className="lg:col-span-7 flex flex-col items-start text-start gap-3">
          {resolvedBadge && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-soft text-brand-soft-text border border-chip-mint-border select-none">
              {resolvedBadge}
            </span>
          )}

          {(title || accent) && (
            <h2 className="text-headline-xl-mobile md:text-headline-xl font-extrabold text-on-surface">
              <TwoToneText text={title} accent={accent} />
            </h2>
          )}

          {description && (
            <p className="text-body-md text-muted max-w-[540px]">
              {description}
            </p>
          )}

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-3.5 pt-3 w-full sm:w-auto">
              <ActionButton action={primaryAction} variant="primary-gradient" />
              <ActionButton action={secondaryAction} variant="secondary" />
            </div>
          )}

          {features && features.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-on-surface-variant text-xs sm:text-sm pt-3">
              {features.map((feat, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-rounded icon-gradient text-[18px]" aria-hidden="true">
                    check_circle
                  </span>
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          )}
        </Reveal>

        {/* End Column: Isometric 3D Cubes */}
        <Reveal variants={slideFromEnd} custom={dir} className="lg:col-span-5 flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-6 rounded-full bg-gradient-to-tr from-[#2B72CF]/18 to-[#5443A9]/18 dark:from-[#2B72CF]/12 dark:to-[#5443A9]/12 blur-2xl"
            />
            <HeroCubes className="relative w-full h-auto rtl:-scale-x-100 select-none pointer-events-none" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
