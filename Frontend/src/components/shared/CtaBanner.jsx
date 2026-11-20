import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '../ui/Button';

export function CtaBanner({
  icon = 'auto_awesome',
  title,
  description,
  primaryAction, // { label, to, href, onClick, icon }
  secondaryAction, // { label, to, href, onClick, icon }
  features = [], // ['No hidden fees', 'Free consultation']
  className = '',
}) {
  return (
    <section className={clsx('relative w-full max-w-7xl mx-auto py-8 sm:py-12', className)}>
      <div className="relative rounded-3xl bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container border border-outline-variant p-6 sm:p-10 lg:p-14 overflow-hidden shadow-2xl flex flex-col items-center text-center">
        {/* Mint Ambient Accent Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl flex flex-col items-center gap-4 sm:gap-6">
          {icon && (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary shadow-md border border-outline-variant/60">
              <span className="material-symbols-outlined text-[32px] sm:text-[36px]">
                {icon}
              </span>
            </div>
          )}

          {title && (
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-snug">
              {title}
            </h2>
          )}

          {description && (
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {description}
            </p>
          )}

          {/* Action buttons */}
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
              {primaryAction && (
                primaryAction.to ? (
                  <Link to={primaryAction.to} className="w-full sm:w-auto">
                    <Button
                      variant="primary-gradient"
                      size="lg"
                      className="w-full sm:w-auto"
                      iconLeading={
                        primaryAction.icon ? (
                          <span className="material-symbols-outlined text-[20px]">
                            {primaryAction.icon}
                          </span>
                        ) : undefined
                      }
                    >
                      {primaryAction.label}
                    </Button>
                  </Link>
                ) : primaryAction.href ? (
                  <a
                    href={primaryAction.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="primary-gradient"
                      size="lg"
                      className="w-full sm:w-auto"
                      iconLeading={
                        primaryAction.icon ? (
                          <span className="material-symbols-outlined text-[20px]">
                            {primaryAction.icon}
                          </span>
                        ) : undefined
                      }
                    >
                      {primaryAction.label}
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="primary-gradient"
                    size="lg"
                    onClick={primaryAction.onClick}
                    className="w-full sm:w-auto"
                    iconLeading={
                      primaryAction.icon ? (
                        <span className="material-symbols-outlined text-[20px]">
                          {primaryAction.icon}
                        </span>
                      ) : undefined
                    }
                  >
                    {primaryAction.label}
                  </Button>
                )
              )}

              {secondaryAction && (
                secondaryAction.to ? (
                  <Link to={secondaryAction.to} className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto"
                      iconLeading={
                        secondaryAction.icon ? (
                          <span className="material-symbols-outlined text-[20px] text-primary">
                            {secondaryAction.icon}
                          </span>
                        ) : undefined
                      }
                    >
                      {secondaryAction.label}
                    </Button>
                  </Link>
                ) : secondaryAction.href ? (
                  <a
                    href={secondaryAction.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto"
                      iconLeading={
                        secondaryAction.icon ? (
                          <span className="material-symbols-outlined text-[20px] text-primary">
                            {secondaryAction.icon}
                          </span>
                        ) : undefined
                      }
                    >
                      {secondaryAction.label}
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={secondaryAction.onClick}
                    className="w-full sm:w-auto"
                    iconLeading={
                      secondaryAction.icon ? (
                        <span className="material-symbols-outlined text-[20px] text-primary">
                          {secondaryAction.icon}
                        </span>
                      ) : undefined
                    }
                  >
                    {secondaryAction.label}
                  </Button>
                )
              )}
            </div>
          )}

          {/* Guarantees / Features */}
          {features && features.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-on-surface-variant text-xs sm:text-sm pt-2">
              {features.map((feat, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    check
                  </span>
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
