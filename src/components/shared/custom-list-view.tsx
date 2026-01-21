
'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CommunityGridItem } from '../community/community-grid-item';
import { CommunityListItem } from '../community/community-list-item';
import { Community } from '@/lib/types';

interface CustomListViewProps<T> {
  items: T[];
  renderGridItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderListItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  searchKeys: (keyof T)[];
  selectable?: boolean;
}

export function CustomListView<T extends { id: string }>({
  items,
  renderGridItem,
  renderListItem,
  searchKeys,
  selectable = false,
}: CustomListViewProps<T>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [items, searchTerm, searchKeys]);

  const toggleSelection = (id: string) => {
    if (!selectable) return;
    
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-4 p-6 bg-background">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
          <Button
            variant={'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={cn(
              "h-8 w-8 text-secondary-foreground",
              viewMode === 'list' && "bg-background shadow-sm"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={cn(
              "h-8 w-8 text-secondary-foreground",
              viewMode === 'grid' && "bg-background shadow-sm"
            )}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) =>
              renderGridItem(
                item,
                selectedIds.has(item.id),
                () => toggleSelection(item.id)
              )
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) =>
              renderListItem(
                item,
                selectedIds.has(item.id),
                () => toggleSelection(item.id)
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
