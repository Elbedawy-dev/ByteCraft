import React, { useId } from 'react';
import clsx from 'clsx';
import { LayoutGroup, m } from 'framer-motion';
import { MOTION_TRANSITION } from '../../lib/motion';
import { LayoutMotion } from './Motion';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills',
  className = '',
}) {
  const groupId = useId();

  return (
    <LayoutMotion>
      <LayoutGroup id={`tabs-${groupId}`}>
        <div
          role="tablist"
          className={clsx(
            'flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar',
            variant === 'underline' && 'border-b border-outline-variant gap-6',
            variant === 'pills' && 'p-1 rounded-full bg-section-band border border-outline-variant w-fit max-w-full',
            className
          )}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            if (variant === 'underline') {
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={clsx(
                    'relative pb-3 pt-1 text-sm font-semibold transition-colors duration-300 ease-nexus whitespace-nowrap flex items-center gap-2',
                    isActive
                      ? 'text-primary'
                      : 'text-muted hover:text-on-surface'
                  )}
                >
                  {tab.icon && (
                    <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-soft text-brand-soft-text font-mono">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <m.span
                      layoutId={`tab-underline-${groupId}`}
                      transition={MOTION_TRANSITION}
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-[2px] bg-primary-gradient rounded-full"
                    />
                  )}
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={clsx(
                  'relative px-4 py-2 min-h-[38px] rounded-full text-sm font-semibold transition-colors duration-300 ease-nexus whitespace-nowrap flex items-center gap-2 select-none shrink-0',
                  isActive
                    ? 'text-white'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-card/80'
                )}
              >
                {isActive && (
                  <m.span
                    layoutId={`tab-pill-${groupId}`}
                    transition={MOTION_TRANSITION}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full btn-primary-gradient"
                  />
                )}
                {tab.icon && (
                  <span className="relative z-10 material-symbols-rounded text-[18px]" aria-hidden="true">
                    {tab.icon}
                  </span>
                )}
                <span className="relative z-10">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={clsx(
                      'relative z-10 text-[11px] px-2 py-0.5 rounded-full font-mono font-bold',
                      isActive
                        ? 'bg-white text-[#3A3F8F]'
                        : 'bg-card text-on-surface-variant'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </LayoutMotion>
  );
}
