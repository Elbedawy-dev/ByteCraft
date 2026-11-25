import React from 'react';
import { Skeleton } from '@/components/ui';

/**
 * Loading skeleton matching the two-column desktop / stacked mobile checkout layout.
 */
export function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full overflow-hidden" aria-busy="true">
      <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
        <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="h-3.5 w-72 max-w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-12 w-full md:col-span-2 rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full md:col-span-2 rounded-lg" />
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-40 max-w-full" />
              <Skeleton className="h-3.5 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>

      <div className="lg:col-span-5 min-w-0">
        <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-32 max-w-full" />
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
          </div>
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton.Text lines={4} />
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="pt-3 border-t border-outline-variant/60 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
