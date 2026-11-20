import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function ServicePlanSkeleton() {
  return (
    <div className="space-y-12" aria-busy="true">
      {/* Group header skeleton */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-8 w-72 max-w-full" />
          </div>
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-outline-variant bg-surface-container-low p-6 sm:p-7 space-y-5 animate-pulse"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>

              <div className="w-full h-px bg-outline-variant/40" />

              <div className="space-y-3">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              <Skeleton className="h-12 w-full rounded-xl mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
