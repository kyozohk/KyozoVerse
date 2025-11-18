
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface ListViewProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  themeColor: string;
  children: React.ReactNode;
}

export function ListView({ 
  searchTerm, 
  onSearchChange, 
  viewMode, 
  onViewModeChange,
  themeColor,
  children 
}: ListViewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative flex-grow">
          <Input
            label="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="h-4 w-4" style={{ color: themeColor }} />}
            wrapperClassName="search-input-wrapper"
            className="search-input"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md p-1" style={{ backgroundColor: themeColor }}>
          <button 
            onClick={() => onViewModeChange('list')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === 'list' ? 'bg-white' : 'bg-transparent'
            )}
            aria-label="List View"
          >
            <List className="h-5 w-5" style={{ color: viewMode === 'list' ? themeColor : 'white' }} />
          </button>
          <button 
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === 'grid' ? 'bg-white' : 'bg-transparent'
            )}
            aria-label="Grid View"
          >
            <LayoutGrid className="h-5 w-5" style={{ color: viewMode === 'grid' ? themeColor : 'white' }} />
          </button>
        </div>
      </div>
      
      <div className={cn(
        'grid gap-6',
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      )}>
        {children}
      </div>
    </div>
  );
}
