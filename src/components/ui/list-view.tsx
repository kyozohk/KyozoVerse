
'use client';

import React from 'react';
import { Input } from './input';
import { Button } from './button';
import { Search, Plus, List, LayoutGrid } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface ListViewProps<T> {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  searchType: T;
  onSearchTypeChange: (type: T) => void;
  searchOptions?: { value: T; label: string }[];
  onAddAction?: () => void;
  addActionLabel?: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function ListView<T extends string>({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  searchType,
  onSearchTypeChange,
  searchOptions,
  onAddAction,
  addActionLabel = 'Add New',
  children,
  loading,
}: ListViewProps<T>) {
  return (
    <div className="bg-white dark:bg-gray-900/50 p-4 sm:p-6 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          {onAddAction && (
            <Button onClick={onAddAction}>
              <Plus className="h-4 w-4 mr-2" />
              {addActionLabel}
            </Button>
          )}
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "h-8 w-8 text-muted-foreground",
                viewMode === 'list' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "h-8 w-8 text-muted-foreground",
                viewMode === 'grid' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className={cn("grid", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid-cols-1 gap-2')}>
          {Array(viewMode === 'grid' ? 6 : 3).fill(0).map((_, i) => (
            viewMode === 'grid' ? (
              <Skeleton key={i} className="h-[180px] w-full" />
            ) : (
              <Skeleton key={i} className="h-[60px] w-full" />
            )
          ))}
        </div>
      ) : (
        <div className={cn("grid", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid-cols-1 gap-2')}>
          {children}
        </div>
      )}
    </div>
  );
}
