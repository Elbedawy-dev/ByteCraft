import React from 'react';
import { Card, Skeleton } from '../../components/ui';

export function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card key={idx} variant="flat" className="space-y-5">
          <div className="space-y-2 pb-4 border-b border-outline-variant/60">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72 max-w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}
