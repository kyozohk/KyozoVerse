
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

type ViewMode = 'grid' | 'list';

interface ListViewProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
  searchType?: 'name' | 'tag';
  onSearchTypeChange?: (type: 'name' | 'tag') => void;
  onAddAction?: () => void;
  loading?: boolean;
}

export function ListView({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  children,
  loading = false,
}: ListViewProps) {
  return (
    <div className="bg-card text-foreground p-6 rounded-xl border">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-grow">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background border-border"
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-background p-1 border">
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
        <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {Array(viewMode === 'grid' ? 6 : 3).fill(0).map((_, i) => (
            viewMode === 'grid' ? (
              <Skeleton key={i} className="h-[180px] w-full" />
            ) : (
              <Skeleton key={i} className="h-16 w-full" />
            )
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {children}
        </div>
      )}
    </div>
  );
}
