import React from 'react';
import clsx from 'clsx';

export function Tabs({
  tabs = [], // [{ id, label, icon, badge }]
  activeTab,
  onChange,
  variant = 'pills', // 'pills' | 'underline'
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={clsx(
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar',
        variant === 'underline' && 'border-b border-outline-variant gap-4',
        variant === 'pills' && 'p-1 rounded-xl bg-surface-container-low border border-outline-variant/60 w-fit',
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
                'relative pb-3 pt-1 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {tab.icon && <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container-high font-mono">
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
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
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-2 select-none',
              isActive
                ? 'bg-surface text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
            )}
          >
            {tab.icon && <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-surface-container-highest font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
