
'use client';

import { cn } from '@/lib/utils';
import { List, LayoutGrid } from 'lucide-react';
import React from 'react';

interface CustomListViewProps<T> {
  items: T[];
  renderListItem: (item: T) => React.ReactNode;
  renderGridItem: (item: T) => React.ReactNode;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  itemClassName?: { list?: string; grid?: string };
}

export function CustomListView<T>({
  items,
  renderListItem,
  renderGridItem,
  viewMode,
  setViewMode,
  itemClassName
}: CustomListViewProps<T>) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md",
              viewMode === 'list' ? "bg-background text-foreground" : "text-muted-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md",
              viewMode === 'grid' ? "bg-background text-foreground" : "text-muted-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {viewMode === 'list' ? (
          <div className={cn("space-y-4", itemClassName?.list)}>
            {items.map(renderListItem)}
          </div>
        ) : (
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", itemClassName?.grid)}>
            {items.map(renderGridItem)}
          </div>
        )}
      </div>
    </div>
  );
}
