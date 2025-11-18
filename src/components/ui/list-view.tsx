
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThemeForPath } from '@/lib/theme-utils';
import { usePathname } from 'next/navigation';

type ViewMode = 'grid' | 'list';

interface ListViewProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
}

export function ListView({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  children
}: ListViewProps) {
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  // Function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const activeBg = hexToRgba(activeColor, 0.3);

  return (
    <div className="p-6 md:p-8">
      <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
        <div className="flex items-center justify-between gap-4 mb-6">
            <Input
              label="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 bg-card text-foreground focus:ring-primary-purple"
              style={{ '--input-border-color': activeColor } as React.CSSProperties}
              icon={<Search className="h-4 w-4 text-muted-foreground" style={{ color: activeColor }}/>}
              wrapperClassName="flex-grow"
            />
          <div className="flex items-center gap-1 rounded-md p-1" style={{ backgroundColor: 'transparent' }}>
            <Button
              variant='ghost'
              size="icon"
              onClick={() => onViewModeChange('list')}
              className="h-9 w-9"
              style={{
                backgroundColor: viewMode === 'list' ? activeBg : 'transparent',
                color: activeColor,
              }}
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              variant='ghost'
              size="icon"
              onClick={() => onViewModeChange('grid')}
              className="h-9 w-9"
              style={{
                backgroundColor: viewMode === 'grid' ? activeBg : 'transparent',
                color: activeColor,
              }}
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
