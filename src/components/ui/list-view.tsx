
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
  title?: string;
  subtitle?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
  loading?: boolean;
  actions?: React.ReactNode;
}

export function ListView({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  children,
  loading = false,
  actions
}: ListViewProps) {
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  const hexToRgba = (hex: string, alpha: number) => {
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return hex; // Return original if not a valid hex
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const activeBg = hexToRgba(activeColor, 0.3);

  return (
    <div className="p-6 md:p-8">
      <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="text-2xl font-semibold mb-1">{title}</h1>}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}
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
            {actions}
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
        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {viewMode === 'grid' ? (
              // Grid skeleton
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-[200px]"></div>
                </div>
              ))
            ) : (
              // List skeleton
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center p-3 border rounded-md">
                  <div className="mr-3 bg-muted rounded-full h-10 w-10"></div>
                  <div className="flex-grow">
                    <div className="bg-muted h-5 w-32 mb-2 rounded"></div>
                    <div className="bg-muted h-4 w-40 rounded"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
