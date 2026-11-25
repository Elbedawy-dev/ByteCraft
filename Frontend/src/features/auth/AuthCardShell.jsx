import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, HeroCubes } from '../../components/shared';
import { ROUTES } from '../../config/routes';

/**
 * Shared centered 24px-radius card on `.bc-hero-wash` glow background
 * with `BrandLogo` on top, used by all auth pages (`/login`, `/register`,
 * `/forgot-password`, `/reset-password`, `/verify-email`).
 */
export function AuthCardShell({
  badge,
  title,
  subtitle,
  headingId,
  children,
  footer,
}) {
  return (
    <section className="flex-1 bc-hero-wash relative overflow-hidden flex flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      {/* Subtle decorative radial blobs clipped inside section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -start-24 w-80 h-80 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -end-20 w-96 h-96 rounded-full bg-secondary/10 dark:bg-secondary/5 blur-3xl"
      />

      {/* Subtle Isometric Cubes accent on large screens (never overlapping text) */}
      <div
        aria-hidden="true"
        className="hidden xl:block pointer-events-none select-none absolute bottom-8 end-10 w-56 opacity-80 dark:opacity-50 rtl:-scale-x-100"
      >
        <HeroCubes className="w-full h-auto" />
      </div>

      <div className="w-full max-w-[460px] flex flex-col items-center gap-5 relative z-10">
        {/* Top BrandLogo */}
        <Link
          to={ROUTES.HOME}
          className="inline-flex flex-col items-center gap-2 select-none"
          aria-label="Nexus"
        >
          <BrandLogo tone="auto" size="lg" />
        </Link>

        {badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold text-brand-soft-text tracking-wide">
              {badge}
            </span>
          </div>
        )}

        {/* Centered 24px radius (rounded-3xl) Card */}
        <div className="w-full bg-card border border-card-border rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-0 h-1 bg-primary-gradient"
          />

          {(title || subtitle) && (
            <div className="flex flex-col gap-1.5 mb-6 text-start">
              {title && (
                <h1
                  id={headingId}
                  className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight"
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </div>

        {footer && (
          <div className="w-full text-center text-sm text-on-surface-variant">
            {footer}
          </div>
        )}
      </div>
    </section>
  );
}
