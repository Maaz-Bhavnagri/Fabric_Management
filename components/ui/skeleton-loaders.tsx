'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function StatsCardSkeleton() {
  return (
    <Card className="p-6 border-none shadow-md">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-10 h-5 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="p-6 border-none shadow-md">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <Card className="border-none shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/12" />
          </div>
        ))}
      </div>
    </Card>
  );
}
