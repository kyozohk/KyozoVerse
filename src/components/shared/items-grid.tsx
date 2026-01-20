
'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ItemsGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  isLoading: boolean;
  loadingItems?: number;
  gridClassName?: string;
}

export function ItemsGrid<T>({
  items,
  renderItem,
  isLoading,
  loadingItems = 8,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
}: ItemsGridProps<T>) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/bg/light_app_bg.png')`,
          backgroundAttachment: 'fixed',
          backgroundPosition: 'top',
        }}
      />
      <div
        className="absolute inset-0 z-0 bg-background/80 backdrop-blur-sm"
      />
      <div className="relative z-10 p-4 sm:p-6">
        {isLoading ? (
          <div className={gridClassName}>
            {Array.from({ length: loadingItems }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg bg-white/10" />
            ))}
          </div>
        ) : (
          <div className={gridClassName}>
            {items.map((item, index) => <div key={index}>{renderItem(item)}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
