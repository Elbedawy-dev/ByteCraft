import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'bc-skeleton rounded-lg',
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
            'h-3.5 bc-skeleton rounded-full',
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
        'p-6 rounded-xl border border-card-border bg-card shadow-card space-y-4',
        className
      )}
      aria-hidden="true"
    >
      <div className="aspect-[16/10] bc-skeleton rounded-lg w-full" />
      <div className="space-y-2">
        <div className="h-5 bc-skeleton rounded-full w-3/4" />
        <div className="h-3.5 bc-skeleton rounded-full w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-4 bc-skeleton rounded-full w-1/4" />
        <div className="h-10 bc-skeleton rounded-full w-28" />
      </div>
    </div>
  );
};
