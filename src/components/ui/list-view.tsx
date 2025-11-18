
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, PlusCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeForPath } from '@/lib/theme-utils';
import { usePathname } from 'next/navigation';

type ViewMode = 'grid' | 'list';

interface ListViewProps {
  title: string;
  subtitle: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
}

export function ListView({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  children
}: ListViewProps) {
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  return (
    <div className="p-6 md:p-8">
      <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" style={{ color: activeColor }}/>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 bg-card text-foreground focus:ring-primary-purple"
                style={{ borderColor: activeColor }}
              />
            </div>
            <div className="flex items-center gap-1 rounded-md p-1" style={{ backgroundColor: activeColor }}>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => onViewModeChange('list')}
                className={cn(
                  "h-8 w-8 text-white hover:bg-white/20",
                  viewMode === 'list' && "bg-white text-black"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  "h-8 w-8 text-white hover:bg-white/20",
                  viewMode === 'grid' && "bg-white text-black"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
