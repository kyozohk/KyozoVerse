'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Grid, List, CircleUser, Check, CheckSquare, Square, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedListViewProps<T> {
  items: T[];
  renderGridItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string) => React.ReactNode;
  renderListItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string) => React.ReactNode;
  renderCircleItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string) => React.ReactNode;
  searchKeys: (keyof T)[];
  selectable?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  urlField?: string;
  onSelectionChange?: (selectedIds: string[], selectedItems: T[]) => void;
  // Selection action buttons (shown when items are selected)
  selectionActions?: React.ReactNode;
  // Infinite scroll props
  pageSize?: number;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
  // Tags support
  tagKey?: keyof T; // Key to extract tags from item
  showTags?: boolean; // Whether to show tags above search
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
  urlField = 'id',
  onSelectionChange,
  selectionActions,
  pageSize = 20,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  tagKey,
  showTags = false,
}: EnhancedListViewProps<T>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'circle'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll observer
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      }, {
        rootMargin: '100px',
        threshold: 0.1
      });
      
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore, onLoadMore]
  );

  // Extract all unique tags from items
  const allTags = useMemo(() => {
    if (!tagKey || !showTags) return [];
    const tagSet = new Set<string>();
    items.forEach(item => {
      const tags = item[tagKey];
      if (Array.isArray(tags)) {
        tags.forEach(tag => tagSet.add(String(tag)));
      }
    });
    return Array.from(tagSet).sort();
  }, [items, tagKey, showTags]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Filter by selected tags first
    if (selectedTags.size > 0 && tagKey) {
      filtered = filtered.filter(item => {
        const tags = item[tagKey];
        if (!Array.isArray(tags)) return false;
        // Show items that have ANY of the selected tags
        return Array.from(selectedTags).some(selectedTag => 
          tags.some(tag => String(tag) === selectedTag)
        );
      });
    }
    
    // Then filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          return String(value).toLowerCase().includes(lowerSearch);
        })
      );
    }
    
    return filtered;
  }, [items, searchTerm, searchKeys, selectedTags, tagKey]);

  const toggleSelection = (id: string) => {
    console.log('toggleSelection called:', { id, selectable });
    if (!selectable) return;
    
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      const selectedItems = items.filter(item => newSet.has(item.id));
      console.log('Calling onSelectionChange with:', { ids: Array.from(newSet), selectedItems });
      onSelectionChange?.(Array.from(newSet), selectedItems);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const newSet = selectedIds.size === filteredItems.length 
      ? new Set<string>() 
      : new Set(filteredItems.map(item => item.id));
    setSelectedIds(newSet);
    const selectedItems = items.filter(item => newSet.has(item.id));
    onSelectionChange?.(Array.from(newSet), selectedItems);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
    // Clear selection when tags change
    setSelectedIds(new Set());
    onSelectionChange?.([], []);
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
        {filteredItems.map((item, index) => {
          const isLastItem = index === filteredItems.length - 1;
          return (
            <div 
              key={item.id} 
              className="relative"
              ref={isLastItem ? lastItemRef : null}
            >
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
              {ItemComponent(item, selectedIds.has(item.id), () => toggleSelection(item.id), urlField)}
            </div>
          );
        })}
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {hasMore && !isLoadingMore && (
          <div ref={loadMoreRef} className="col-span-full h-4" />
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6">
        {/* Tags Section */}
        {showTags && allTags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    selectedTags.has(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  {selectedTags.has(tag) && (
                    <span className="ml-1 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
            {selectedTags.size > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Filtered by tags: <strong>{Array.from(selectedTags).join(', ')}</strong> ({filteredItems.length} items)
                </span>
                <button
                  onClick={() => {
                    setSelectedTags(new Set());
                    setSelectedIds(new Set());
                    onSelectionChange?.([], []);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={selectedTags.size > 0 ? `Search within selected tags...` : "Search..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            {selectable && !isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredItems.length === 0}
                className="gap-2"
                style={{ 
                  borderColor: 'var(--page-content-border)',
                  backgroundColor: 'var(--page-content-bg)',
                  color: '#6B5D52'
                }}
              >
                {selectedIds.size === filteredItems.length ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Select All
                  </>
                )}
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
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} of {filteredItems.length} selected
            </span>
            {selectionActions && (
              <div className="flex items-center gap-2">
                {selectionActions}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {renderContent()}
      </div>
    </div>
  );
}
