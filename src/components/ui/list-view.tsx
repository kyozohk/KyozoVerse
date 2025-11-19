
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Search } from 'lucide-react';
import { AiOutlineUserAdd } from 'react-icons/ai';
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
  onAddAction?: () => void;
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
  actions,
  onAddAction
}: ListViewProps) {
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return hex; // Return original if not a valid hex
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const activeBg = hexToRgba(activeColor, 0.3);

  return (
    <div className="p-8">
      <div className="bg-card text-foreground p-8 rounded-xl border" style={{ borderColor: activeColor }}>
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="text-2xl font-semibold mb-1">{title}</h1>}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-grow">
                <div className="flex items-center relative h-10 border rounded-md overflow-hidden" style={{ borderColor: activeColor }}>
                    <div className="flex items-center justify-center h-full px-3">
                        <Search 
                            className="h-5 w-5" 
                            style={{ color: activeColor }} 
                        />
                    </div>
                    <input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-grow h-full border-0 focus:outline-none bg-transparent px-0"
                        style={{ 
                            color: activeColor,
                            '--placeholder-color': hexToRgba(activeColor, 0.7)
                        } as React.CSSProperties}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              {onAddAction && (
                <button
                  type="button"
                  onClick={onAddAction}
                  className="h-9 w-9 flex items-center justify-center rounded-md border transition-colors"
                  style={{
                    borderColor: activeColor,
                    color: activeColor,
                  }}
                >
                  <AiOutlineUserAdd className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center gap-1 rounded-md bg-muted/10 p-1">
                <button
                  type="button"
                  onClick={() => onViewModeChange('list')}
                  className="h-9 w-9 flex items-center justify-center rounded-md transition-colors"
                  style={{
                    backgroundColor: viewMode === 'list' ? activeBg : 'transparent',
                    color: activeColor,
                  }}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  className="h-9 w-9 flex items-center justify-center rounded-md transition-colors"
                  style={{
                    backgroundColor: viewMode === 'grid' ? activeBg : 'transparent',
                    color: activeColor,
                  }}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
              </div>
            </div>
        </div>
        {loading ? (
          <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
            {viewMode === 'grid' ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-[200px]" style={{ borderColor: hexToRgba(activeColor, 0.3) }}></div>
                </div>
              ))
            ) : (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center p-4 border rounded-lg" style={{ borderColor: hexToRgba(activeColor, 0.3) }}>
                  <div className="mr-4 bg-muted rounded-full h-12 w-12"></div>
                  <div className="flex-grow">
                    <div className="bg-muted h-5 w-32 mb-2 rounded"></div>
                    <div className="bg-muted h-4 w-40 rounded"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
