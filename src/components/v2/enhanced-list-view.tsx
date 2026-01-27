'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Grid, List, CircleUser, Check, CheckSquare, Square, Loader2, Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedListViewProps<T> {
  items: T[];
  renderGridItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string, selectable?: boolean) => React.ReactNode;
  renderListItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string, selectable?: boolean) => React.ReactNode;
  renderCircleItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string, selectable?: boolean) => React.ReactNode;
  searchKeys: (keyof T)[];
  selectable?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  urlField?: string;
  selection?: Set<string>;
  onSelectionChange?: (ids: Set<string>, items: T[]) => void;
  selectionActions?: React.ReactNode;
  pageSize?: number;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
}

export function EnhancedListView<T extends { id: string; tags?: string[] }>({
  items,
  renderGridItem,
  renderListItem,
  renderCircleItem,
  searchKeys,
  selectable = false,
  isLoading = false,
  loadingComponent,
  urlField = 'id',
  selection: controlledSelection,
  onSelectionChange,
  selectionActions,
  pageSize = 20,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: EnhancedListViewProps<T>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'circle'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showAllTags, setShowAllTags] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const tagsContainerRef = useRef<HTMLDivElement | null>(null);

  const isControlled = controlledSelection !== undefined;
  const selectedIds = isControlled ? controlledSelection : internalSelection;
  
  const setSelectedIds = useCallback((newIds: Set<string>) => {
    if (isControlled) {
      const selectedItems = items.filter(item => newIds.has(item.id));
      onSelectionChange?.(newIds, selectedItems);
    } else {
      setInternalSelection(newIds);
      // Also call onSelectionChange in uncontrolled mode if provided
      if (onSelectionChange) {
        const selectedItems = items.filter(item => newIds.has(item.id));
        onSelectionChange(newIds, selectedItems);
      }
    }
  }, [isControlled, onSelectionChange, items]);

  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    items.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).map(tag => ({ id: tag, name: tag }));
  }, [items]);

  const handleToggleTag = (tagName: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagName)) {
        newSelectedTags.delete(tagName);
    } else {
        newSelectedTags.add(tagName);
    }
    setSelectedTags(newSelectedTags);

    const newSelectedIds = new Set<string>(selectedIds);
    items.forEach(item => {
        if (item.tags?.includes(tagName)) {
            if (newSelectedTags.has(tagName)) {
                newSelectedIds.add(item.id);
            } else {
                newSelectedIds.delete(item.id);
            }
        }
    });
    setSelectedIds(newSelectedIds);
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key] as string;
          return value?.toLowerCase().includes(lowerSearch);
        })
      );
    }

    if (selectedTags.size > 0) {
      filtered = filtered.filter(item => {
        if (!item.tags || item.tags.length === 0) return false;
        return Array.from(selectedTags).some(tag => item.tags!.includes(tag));
      });
    }

    return filtered;
  }, [items, searchTerm, searchKeys, selectedTags]);

  useEffect(() => {
    const visibleIds = new Set(filteredItems.map(item => item.id));
    const newSelection = new Set([...selectedIds].filter(id => visibleIds.has(id)));
    if (newSelection.size !== selectedIds.size) {
      setSelectedIds(newSelection);
    }
  }, [filteredItems, selectedIds, setSelectedIds]);

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

  const toggleSelection = (id: string) => {
    if (!selectable) return;
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
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
        {filteredItems.map((item, index) => {
          const isLastItem = index === filteredItems.length - 1;
          return (
            <div 
              key={item.id} 
              className={cn("relative", selectable && "cursor-pointer")}
              ref={isLastItem ? lastItemRef : null}
              onClick={selectable ? () => toggleSelection(item.id) : undefined}
            >
              {selectable && (
                <div className="absolute top-2 left-2 z-10">
                  <div 
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                      selectedIds.has(item.id) 
                        ? "bg-accent border-accent-foreground/30" 
                        : "bg-card/50 border-muted-foreground/30"
                    )}
                  >
                    {selectedIds.has(item.id) && (
                      <Check className="h-3 w-3 text-accent-foreground" />
                    )}
                  </div>
                </div>
              )}
              {ItemComponent(item, selectedIds.has(item.id), () => toggleSelection(item.id), urlField, selectable)}
            </div>
          );
        })}
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
        {availableTags.length > 0 && (
            <div className="mb-4">
              <div 
                ref={tagsContainerRef}
                className={cn(
                  "flex flex-wrap gap-2",
                  !showAllTags && "max-h-[38px] overflow-hidden"
                )}
              >
                {availableTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant={selectedTags.has(tag.name) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleTag(tag.name)}
                    className="gap-1.5"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {tag.name}
                  </Button>
                ))}
              </div>
              {availableTags.length > 5 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="mt-2 gap-1.5"
                  style={{ backgroundColor: '#5B4A3A', color: 'white' }}
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAllTags && "rotate-180")} />
                  {showAllTags ? 'Show Less' : `Show More (${availableTags.length - 5}+)`}
                </Button>
              )}
            </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
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

      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-1">
        {renderContent()}
      </div>
    </div>
  );
}
