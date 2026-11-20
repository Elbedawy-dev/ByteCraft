import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';

export function ProjectDetailsSkeleton() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6 lg:space-y-8"
      aria-busy="true"
    >
      {/* Breadcrumbs Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery */}
          <div className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          </div>

          {/* Header & Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-8 w-40 rounded-xl" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton.Text lines={2} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Features Card */}
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>

        {/* Purchase Sidebar Skeleton */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton.Text lines={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
