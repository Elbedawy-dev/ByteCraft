import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'animate-pulse rounded-md bg-surface-container-high',
        className
      )}
      {...props}
    />
  );
}

Skeleton.Text = function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={clsx('space-y-2.5', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'h-3.5 bg-surface-container-high rounded animate-pulse',
            i === lines - 1 ? 'w-3/5' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

Skeleton.Card = function SkeletonCard({ className = '' }) {
  return (
    <div
      className={clsx(
        'p-5 rounded-xl border border-outline-variant bg-surface-container space-y-4 animate-pulse',
        className
      )}
      aria-hidden="true"
    >
      <div className="h-44 bg-surface-container-high rounded-lg w-full" />
      <div className="space-y-2">
        <div className="h-5 bg-surface-container-high rounded w-3/4" />
        <div className="h-3.5 bg-surface-container-high rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-4 bg-surface-container-high rounded w-1/4" />
        <div className="h-9 bg-surface-container-high rounded-xl w-24" />
      </div>
    </div>
  );
};
