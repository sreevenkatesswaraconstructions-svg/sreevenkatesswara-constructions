'use client';

import { cn } from '@/lib/utils';

export default function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <LoadingSkeleton className="h-8 w-1/2 mb-4" />
      <LoadingSkeleton className="h-12 w-3/4 mb-2" />
      <LoadingSkeleton className="h-4 w-1/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <LoadingSkeleton className="h-8 w-1/3" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-6">
            <div className="flex items-center space-x-4">
              <LoadingSkeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
