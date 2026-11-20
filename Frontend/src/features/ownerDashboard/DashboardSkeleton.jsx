import React from 'react';
import { Card, Skeleton } from '../../components/ui';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Greeting Banner Skeleton */}
      <Card variant="flat" className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </Card>

      {/* 6 KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx} variant="flat" className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2.5 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card variant="flat" className="lg:col-span-2 space-y-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </Card>
        <Card variant="flat" className="space-y-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </Card>
      </div>

      {/* Top Projects Skeleton */}
      <Card variant="flat" className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-xl" />
          ))}
        </div>
      </Card>

      {/* Bottom Tables Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card variant="flat" className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </Card>
        <Card variant="flat" className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </Card>
      </div>
    </div>
  );
}
