
'use client';

import { cn } from '@/lib/utils';
import { List, LayoutGrid, Rows3 } from 'lucide-react';
import React from 'react';

interface CustomListViewProps<T> {
  items: T[];
  renderListItem: (item: T) => React.ReactNode;
  renderGridItem: (item: T) => React.ReactNode;
  renderCompactItem: (item: T) => React.ReactNode; // New prop for compact view
  viewMode: 'list' | 'grid' | 'compact';
  setViewMode: (mode: 'list' | 'grid' | 'compact') => void;
  itemClassName?: { list?: string; grid?: string; compact?: string };
}

export function CustomListView<T>({
  items,
  renderListItem,
  renderGridItem,
  renderCompactItem, // New prop
  viewMode,
  setViewMode,
  itemClassName,
}: CustomListViewProps<T>) {
  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <div className={cn('space-y-4', itemClassName?.list)}>
            {items.map((item, index) => (
              <div key={index} className="hover:bg-accent/50 transition-colors rounded-lg">
                {renderListItem(item)}
              </div>
            ))}
          </div>
        );
      case 'grid':
        return (
          <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', itemClassName?.grid)}>
            {items.map((item, index) => (
              <div key={index} className="hover:bg-accent/50 transition-colors rounded-lg">
                {renderGridItem(item)}
              </div>
            ))}
          </div>
        );
      case 'compact': // New case for compact view
        return (
          <div className={cn('space-y-2', itemClassName?.compact)}>
            {items.map((item, index) => (
              <div key={index} className="hover:bg-accent/50 transition-colors rounded-lg">
                {renderCompactItem(item)}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md',
              viewMode === 'list' ? 'bg-background text-foreground' : 'text-muted-foreground'
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md',
              viewMode === 'grid' ? 'bg-background text-foreground' : 'text-muted-foreground'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md',
              viewMode === 'compact' ? 'bg-background text-foreground' : 'text-muted-foreground'
            )}
          >
            <Rows3 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {renderContent()}
      </div>
    </div>
  );
}
