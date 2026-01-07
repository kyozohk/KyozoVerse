

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Search, UserPlus, Tag, X } from 'lucide-react';
import { type CommunityTag } from '@/lib/community-tags';
import { cn } from '@/lib/utils';
import { getThemeForPath } from '@/lib/theme-utils';
import { usePathname } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

type ViewMode = 'grid' | 'list';
type SearchType = 'name' | 'tag';

interface ListViewProps {
  title?: string;
  subtitle?: string;
  searchType?: SearchType;
  onSearchTypeChange?: (type: SearchType) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
  loading?: boolean;
  actions?: React.ReactNode;
  onAddAction?: () => void;
  headerAction?: React.ReactNode;
  onAddTags?: () => void;
  selectedCount?: number;
  availableTags?: CommunityTag[];
  selectedTags?: string[];
  onToggleTag?: (tagName: string) => void;
}

export function ListView({
  title,
  subtitle,
  searchType,
  onSearchTypeChange,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  children,
  loading = false,
  actions,
  onAddAction,
  headerAction,
  onAddTags,
  selectedCount = 0,
  availableTags = [],
  selectedTags = [],
  onToggleTag
}: ListViewProps) {
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const activeBg = hexToRgba(activeColor, 1); // Solid color

  return (
    <div className="bg-card text-foreground p-8 rounded-xl border" style={{ borderColor: activeColor }}>
      {(title || subtitle || headerAction) && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            {title && <h1 className="text-2xl font-semibold mb-1">{title}</h1>}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          {headerAction && <div className="ml-4">{headerAction}</div>}
        </div>
      )}
      {/* Tag Filter Bubbles */}
      {availableTags.length > 0 && onToggleTag && (
        <div className="flex flex-wrap gap-2 mb-4">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id}
                onClick={() => onToggleTag(tag.name)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: isSelected ? activeColor : 'transparent',
                  color: isSelected ? 'white' : activeColor,
                  border: `1px solid ${activeColor}`,
                }}
              >
                {tag.name}
                {isSelected && <X className="h-3 w-3" />}
              </button>
            );
          })}
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
                  {onSearchTypeChange && searchType && (
                      <Select value={searchType} onValueChange={(value) => onSearchTypeChange(value as SearchType)}>
                          <SelectTrigger className="w-[100px] border-none focus:ring-0 focus:ring-offset-0 h-full bg-transparent">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="tag">Tag</SelectItem>
                          </SelectContent>
                      </Select>
                  )}
                  <input
                      placeholder={searchType ? `Search by ${searchType}...` : 'Search...'}
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="flex-grow h-full border-0 focus:outline-none bg-transparent px-2"
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
                style={{ borderColor: activeColor, color: activeColor }}
              >
                <UserPlus className="h-5 w-5" />
              </button>
            )}
             {onAddTags && selectedCount > 0 && (
              <button
                type="button"
                onClick={onAddTags}
                className="h-9 px-3 flex items-center justify-center rounded-md border transition-colors"
                style={{ borderColor: activeColor, color: activeColor }}
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Tags ({selectedCount})
              </button>
            )}
            <div className="flex items-center gap-1 rounded-md bg-muted/10 p-1">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className="h-9 w-9 flex items-center justify-center rounded-md transition-colors"
                style={{
                  backgroundColor: viewMode === 'list' ? activeBg : 'transparent',
                  color: viewMode === 'list' ? 'white' : activeColor,
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
                  color: viewMode === 'grid' ? 'white' : activeColor,
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
        <div className={cn("grid gap-6", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {children}
        </div>
      )}
    </div>
  );
}
