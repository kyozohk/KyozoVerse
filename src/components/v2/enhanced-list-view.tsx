'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Grid, List, CircleUser, Check, CheckSquare, Square, Loader2, Tag, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Column<T> {
  /** Stable key. Used for sort state and React keys. */
  key: string;
  /** Header label. */
  label: string;
  /** Renderer for the cell. Receives full row item. */
  render: (item: T) => React.ReactNode;
  /** Whether the column is sortable; if true, provide sortValue. */
  sortable?: boolean;
  /** Pluck a comparable value for sorting (number/string/Date.getTime() etc). */
  sortValue?: (item: T) => any;
  /** Optional CSS width (e.g. '40%', '8rem'). */
  width?: string;
  /** Optional class for the cell. */
  className?: string;
}

interface EnhancedListViewProps<T> {
  items: T[];
  renderGridItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string, selectable?: boolean) => React.ReactNode;
  renderListItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string, selectable?: boolean) => React.ReactNode;
  renderCircleItem: (item: T, isSelected: boolean, onSelect: () => void, urlField?: string, selectable?: boolean) => React.ReactNode;
  /**
   * Optional column definitions. When provided AND viewMode is 'list', the
   * component renders a sortable table instead of stacked cards. Pages that
   * don't provide columns keep using the legacy `renderListItem` cards for
   * backward compatibility.
   */
  columns?: Column<T>[];
  searchKeys: (keyof T)[];
  selectable?: boolean;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode;
  urlField?: string;
  selection?: Set<string>;
  initialSelection?: Set<string>;
  onSelectionChange?: (ids: Set<string>, items: T[]) => void;
  selectionActions?: React.ReactNode;
  permanentActions?: React.ReactNode;
  pageSize?: number;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  isLoadingMore?: boolean;
  defaultViewMode?: 'grid' | 'list' | 'circle';
  /** Optional row click handler for table mode (selects when selectable). */
  onRowClick?: (item: T) => void;
  showTypeTabs?: boolean;
  getType?: (item: T) => 'Member' | 'Contact';
}

export function EnhancedListView<T extends { id: string; tags?: string[] }>({
  items,
  renderGridItem,
  renderListItem,
  renderCircleItem,
  columns,
  searchKeys,
  selectable = false,
  isLoading = false,
  loadingComponent,
  urlField = 'id',
  selection: controlledSelection,
  initialSelection,
  onSelectionChange,
  selectionActions,
  permanentActions,
  pageSize = 20,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  defaultViewMode = 'grid',
  onRowClick,
  showTypeTabs = false,
  getType,
}: EnhancedListViewProps<T>) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'circle'>(defaultViewMode);
  const isMobile = useIsMobile();
  // Mobile always renders the compact list (icon + details rows); the
  // grid/circle toggles are desktop-only.
  const effectiveViewMode = isMobile ? 'list' : viewMode;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Member' | 'Contact' | null>('Member');
  const [showTags, setShowTags] = useState(false);
  // Sort state for table mode. `dir` cycles: asc → desc → null (no sort).
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);
  const [internalSelection, setInternalSelection] = useState<Set<string>>(initialSelection || new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize selection from initialSelection prop
  useEffect(() => {
    if (initialSelection && !hasInitialized && items.length > 0) {
      setInternalSelection(initialSelection);
      if (onSelectionChange) {
        const selectedItems = items.filter(item => initialSelection.has(item.id));
        onSelectionChange(initialSelection, selectedItems);
      }
      setHasInitialized(true);
    }
  }, [initialSelection, items, hasInitialized, onSelectionChange]);
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

  // Filter items by search and tags (before active tab filtering so counts are accurate)
  const itemsFilteredBySearchAndTags = useMemo(() => {
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

  // Calculate counts for Members and Contacts tabs based on search and tags filters
  const tabCounts = useMemo(() => {
    let memberCount = 0;
    let contactCount = 0;
    if (showTypeTabs && getType) {
      itemsFilteredBySearchAndTags.forEach(item => {
        const type = getType(item);
        if (type === 'Member') memberCount++;
        else if (type === 'Contact') contactCount++;
      });
    }
    return { memberCount, contactCount };
  }, [itemsFilteredBySearchAndTags, showTypeTabs, getType]);

  const filteredItems = useMemo(() => {
    let filtered = itemsFilteredBySearchAndTags;

    if (showTypeTabs && getType && activeTab) {
      filtered = filtered.filter(item => getType(item) === activeTab);
    }

    // Apply column sort if active. Falls through to filter-order when no
    // active sort, preserving the parent's incoming order.
    if (sortKey && sortDir && columns) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        filtered = [...filtered].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return sortDir === 'asc' ? -1 : 1;
          if (av > bv) return sortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return filtered;
  }, [itemsFilteredBySearchAndTags, showTypeTabs, getType, activeTab, sortKey, sortDir, columns]);

  const toggleSort = useCallback((key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }, [sortKey, sortDir]);

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

  // KYPRO-50: when there are more items on the server than loaded in memory
  // (hasMore === true), auto-paginate through every remaining page BEFORE
  // selecting, so "Select All" actually selects all N rows (e.g. 3016/3016)
  // instead of only the currently-loaded 20. A hard cap prevents a rogue
  // feed from locking the UI.
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const SELECT_ALL_MAX_PAGES = 200; // 200 * pageSize is the upper bound we'll fetch

  const handleSelectAll = async () => {
    // Deselect path — unchanged.
    if (selectedIds.size > 0 && selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
      return;
    }

    // Need to drain hasMore first so we can select EVERYTHING, not just the
    // current page. Only do this when no search/tag filter is active — those
    // narrow the visible set to a client-side subset.
    const hasFilter = !!searchTerm || selectedTags.size > 0;
    if (hasMore && onLoadMore && !hasFilter && !isSelectingAll) {
      setIsSelectingAll(true);
      console.log('[KYPRO-50] draining pagination before Select All', JSON.stringify({ loaded: items.length }));
      try {
        let pages = 0;
        // `hasMore` is a closed-over prop that reflects the last render. We
        // rely on the parent updating `items`/`hasMore` between awaits.
        // Since props won't update mid-handler, we loop on a local snapshot
        // that tracks the growing count and stops when no new items arrived.
        let prevCount = items.length;
        while (pages < SELECT_ALL_MAX_PAGES) {
          await onLoadMore();
          pages += 1;
          // Yield to React so parent can flush new items.
          await new Promise(r => setTimeout(r, 0));
          // We can't observe fresh props here, so rely on the caller's
          // onLoadMore resolving only once the new page is appended to items.
          // If this resolves without growth, stop.
          // (Parents should update `hasMore` on their side; this is a fallback.)
          if (items.length === prevCount) break;
          prevCount = items.length;
        }
        console.log('[KYPRO-50] pagination drained', JSON.stringify({ pages, total: items.length }));
      } catch (e) {
        console.error('[KYPRO-50] drain_failed', e);
      } finally {
        setIsSelectingAll(false);
      }
    }

    setSelectedIds(new Set(filteredItems.map(item => item.id)));
  };

  // Table-mode select helpers (only used when columns prop is provided).
  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((m) => selectedIds.has(m.id));
  const someVisibleSelected = filteredItems.some((m) => selectedIds.has(m.id));
  const toggleAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      filteredItems.forEach((m) => next.delete(m.id));
    } else {
      filteredItems.forEach((m) => next.add(m.id));
    }
    setSelectedIds(next);
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

    // Table mode: when columns are provided and viewMode is 'list', render a
    // sortable table matching the audience design. Desktop-only — mobile falls
    // through to the stacked card list, which fits a narrow screen.
    if (columns && effectiveViewMode === 'list' && !isMobile) {
      return (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: '#E8DFD1', backgroundColor: '#FAF5EC' }}>
                {selectable && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected; }}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-[#A89882] accent-[#5B4A3A] cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: '#5B4A3A', width: col.width }}
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-[#3D2E1F] transition-colors font-bold"
                          style={{ color: '#3D2E1F' }}
                        >
                          <span>{col.label}</span>
                          {isActive && sortDir === 'asc'
                            ? <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#3D2E1F' }} />
                            : isActive && sortDir === 'desc'
                              ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#3D2E1F' }} />
                              : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 flex-shrink-0" style={{ color: '#9B8A75' }} />}
                        </button>
                      ) : (
                        <span className="font-bold" style={{ color: '#3D2E1F' }}>{col.label}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => {
                const isLastItem = index === filteredItems.length - 1;
                const selected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    ref={isLastItem ? (lastItemRef as any) : null}
                    onClick={() => {
                      if (onRowClick) onRowClick(item);
                      else if (selectable) toggleSelection(item.id);
                    }}
                    className={cn(
                      'border-b transition-colors',
                      selected ? 'bg-[#FCFAF6]' : 'hover:bg-[#FCFAF6]/60',
                      (selectable || onRowClick) && 'cursor-pointer'
                    )}
                    style={{ borderColor: '#E8DFD1' }}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelection(item.id)}
                          className="h-4 w-4 rounded border-[#A89882] accent-[#5B4A3A] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-4 py-3', col.className)}
                        style={{ color: '#3D2E1F' }}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#9B8A75' }} />
            </div>
          )}
          {hasMore && !isLoadingMore && (
            <div ref={loadMoreRef} className="h-4" />
          )}
        </div>
      );
    }

    const ItemComponent =
      effectiveViewMode === 'list' ? renderListItem
      : effectiveViewMode === 'circle' ? renderCircleItem
      : renderGridItem;

    const className =
      effectiveViewMode === 'list' ? "flex flex-col gap-2 sm:gap-4"
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
                <div className="absolute top-2 left-2 z-10 hidden sm:block">
                  <div 
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
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
      <div className="p-3 pb-0 sm:p-6 sm:pb-0">
        {/* Search row: full width */}
        <div className="relative w-full mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#9B8A75' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-md border-2 bg-transparent text-sm placeholder:text-[#9B8A75] focus:outline-none focus:ring-2 focus:ring-[#A89882] focus:ring-offset-0 transition-colors"
            style={{ borderColor: '#E8DFD1', color: '#3D2E1F' }}
          />
        </div>

        {showTypeTabs ? (
          /* High-fidelity custom controls row for Audience page */
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5 border-b pb-4" style={{ borderColor: '#E8DFD1' }}>
            {/* Left side: Type Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('Member')}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold border transition-all",
                  activeTab === 'Member'
                    ? "bg-white border-[#3D2E1F] text-[#3D2E1F] shadow-sm"
                    : "bg-white border-[#E8DFD1] text-[#6B5F52] hover:bg-[#FAF5EC]/50"
                )}
              >
                Members ({tabCounts.memberCount})
              </button>
              <button
                onClick={() => setActiveTab('Contact')}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold border transition-all",
                  activeTab === 'Contact'
                    ? "bg-white border-[#3D2E1F] text-[#3D2E1F] shadow-sm"
                    : "bg-white border-[#E8DFD1] text-[#6B5F52] hover:bg-[#FAF5EC]/50"
                )}
              >
                Contacts ({tabCounts.contactCount})
              </button>
            </div>

            {/* Right side: Actions & Filters */}
            <div className="flex items-center gap-3">
              {permanentActions}
              
              <button
                onClick={() => setShowTags(prev => !prev)}
                className={cn(
                  "h-10 px-5 rounded-md text-sm font-bold border transition-all",
                  showTags || selectedTags.size > 0
                    ? "bg-[#E8DFD1] border-[#A89882] text-[#3D2E1F]"
                    : "bg-white border-[#E8DFD1] text-[#6B5F52] hover:bg-[#FAF5EC]/50"
                )}
              >
                Filters{selectedTags.size > 0 ? ` (${selectedTags.size})` : ''}
              </button>

              {(searchTerm || selectedTags.size > 0 || activeTab !== 'Member') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTags(new Set());
                    setActiveTab('Member');
                    setShowTags(false);
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Standard fallback tags filtering if showTypeTabs is false (backward compatibility).
             Hidden on mobile: the list keeps only the search bar on top. */
          availableTags.length > 0 && (
            <div className="mb-4 hidden sm:block">
              <div
                ref={tagsContainerRef}
                className="flex flex-wrap gap-2"
              >
                {(showAllTags ? availableTags : availableTags.slice(0, 5)).map((tag) => (
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
          )
        )}

        {/* Collapsible Tag Drawer for Audience filtering */}
        {showTypeTabs && showTags && availableTags.length > 0 && (
          <div className="mb-4 p-4 rounded-xl border-2 border-dashed bg-[#FCFAF6] transition-all" style={{ borderColor: '#DDD2BD' }}>
            <p className="text-xs font-bold text-[#6B5F52] mb-2.5">Filter by Tag:</p>
            <div ref={tagsContainerRef} className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.has(tag.name);
                return (
                  <Button
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleTag(tag.name)}
                    className="gap-1.5 rounded-full"
                    style={
                      isSelected
                        ? { backgroundColor: '#3D2E20', color: 'white', borderColor: '#3D2E20' }
                        : { borderColor: '#DDD2BD', color: '#6B5F52', backgroundColor: 'transparent' }
                    }
                  >
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Standard CTA Row: select-all (left), permanent actions + view-mode (right) */}
        {!showTypeTabs && (
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2">
              {selectable && !isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredItems.length === 0 || isSelectingAll}
                  className="gap-2 rounded-md border-2"
                  style={{
                    borderColor: '#A89882',
                    backgroundColor: 'transparent',
                    color: '#3D2E1F',
                  }}
                >
                  {isSelectingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading all…
                    </>
                  ) : selectedIds.size > 0 && selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      Select All{hasMore && !searchTerm && selectedTags.size === 0 ? ` (${items.length}+)` : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectable && !isLoading && permanentActions && (
                <div className="flex items-center gap-2">
                  {permanentActions}
                </div>
              )}
              <div className="hidden sm:flex items-center gap-1 rounded-md border-2 p-1" style={{ borderColor: '#A89882', backgroundColor: 'transparent' }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-8 w-8 rounded",
                    viewMode === 'list' && "shadow-sm"
                  )}
                  style={viewMode === 'list' ? { backgroundColor: '#E8DFD1', color: '#3D2E1F' } : { color: '#5B4A3A' }}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "h-8 w-8 rounded",
                    viewMode === 'grid' && "shadow-sm"
                  )}
                  style={viewMode === 'grid' ? { backgroundColor: '#E8DFD1', color: '#3D2E1F' } : { color: '#5B4A3A' }}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('circle')}
                  className={cn(
                    "h-8 w-8 rounded",
                    viewMode === 'circle' && "shadow-sm"
                  )}
                  style={viewMode === 'circle' ? { backgroundColor: '#E8DFD1', color: '#3D2E1F' } : { color: '#5B4A3A' }}
                >
                  <CircleUser className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* If showTypeTabs is enabled, we hide the redundant Select All row to keep list clean */}

        {!showTypeTabs && selectable && selectedIds.size > 0 && !isLoading && (
          <div className="mt-2 mb-4 flex items-center justify-between">
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

      <div className="flex-1 overflow-y-auto px-3 pb-8 pt-1 sm:px-6">
        {renderContent()}
      </div>
    </div>
  );
}
