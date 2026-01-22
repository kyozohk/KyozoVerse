'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List, CircleUser, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedListViewProps<T> {
  items: T[];
  renderGridItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderListItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderCircleItem: (item: T, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  searchKeys: (keyof T)[];
  selectable?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
}

export function EnhancedListView<T extends { id: string }>({
  items,
  renderGridItem,
  renderListItem,
  renderCircleItem,
  searchKeys,
  selectable = false,
  isLoading = false,
  loadingComponent,
}: EnhancedListViewProps<T>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'circle'>('grid');
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

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return loadingComponent || <div className="text-center py-8">Loading...</div>;
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <p>No items found.</p>
        </div>
      );
    }

    const ItemComponent = 
      viewMode === 'list' ? renderListItem
      : viewMode === 'circle' ? renderCircleItem
      : renderGridItem;
      
    const className = 
      viewMode === 'list' ? "flex flex-col gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

    return (
      <div className={className}>
        {filteredItems.map((item) => (
          <div key={item.id} className="relative">
            {selectable && (
              <div 
                className="absolute top-2 left-2 z-10 cursor-pointer"
                onClick={() => toggleSelection(item.id)}
              >
                <div 
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    selectedIds.has(item.id) 
                      ? "bg-primary border-primary" 
                      : "bg-background border-input"
                  )}
                >
                  {selectedIds.has(item.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              </div>
            )}
            {ItemComponent(item, selectedIds.has(item.id), () => toggleSelection(item.id))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            {selectable && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredItems.length === 0}
              >
                {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
            <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  "h-8 w-8",
                  viewMode === 'list' && "bg-background shadow-sm"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "h-8 w-8",
                  viewMode === 'grid' && "bg-background shadow-sm"
                )}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('circle')}
                className={cn(
                  "h-8 w-8",
                  viewMode === 'circle' && "bg-background shadow-sm"
                )}
              >
                <CircleUser className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {selectable && selectedIds.size > 0 && !isLoading && (
          <div className="mt-4 text-sm text-muted-foreground">
            {selectedIds.size} of {filteredItems.length} selected
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {renderContent()}
      </div>
    </div>
  );
}
