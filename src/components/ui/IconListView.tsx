
'use client';

import { List, LayoutGrid, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export interface IconListItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: string;
  joinedDate: string;
  tags?: string[];
  href?: string;
}

interface IconListViewProps {
  data: IconListItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'list' | 'icon';
  onViewModeChange: (mode: 'list' | 'icon') => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedIds?: string[];
}

function IconViewItem({ 
    item, 
    selectable, 
    selected, 
    onToggleSelect 
}: { 
    item: IconListItem, 
    selectable?: boolean, 
    selected?: boolean, 
    onToggleSelect?: (id: string) => void 
}) {
  const content = (
    <div className="relative flex flex-col items-center text-center p-4 border rounded-lg h-full bg-white shadow-sm hover:shadow-md transition-shadow">
      {selectable && onToggleSelect && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(item.id)}
          className="absolute top-4 left-4"
        />
      )}
      <Avatar className="h-20 w-20 mb-4 mt-8">
        <AvatarImage src={item.avatarUrl} alt={item.name} />
        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <h3 className="font-semibold text-md">{item.name}</h3>
      <p className="text-sm text-muted-foreground">{item.email}</p>
      <div className="flex items-center mt-4 text-xs text-muted-foreground">
          <Badge variant={item.status === 'Active' ? 'active' : 'secondary'}>{item.status}</Badge>
          <span className="ml-2">Joined {item.joinedDate}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {item.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
      </div>
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

function ListItemView({ item, selectable, selected, onToggleSelect }: { item: IconListItem, selectable?: boolean, selected?: boolean, onToggleSelect?: (id: string) => void }) {
    const content = (
        <div className="flex items-center p-2 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            {selectable && onToggleSelect && (
                <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleSelect(item.id)}
                className="mr-4"
                />
            )}
            <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={item.avatarUrl} alt={item.name} />
                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                </div>
                <div className="col-span-2">
                    <Badge variant={item.status === 'Active' ? 'active' : 'secondary'}>{item.status}</Badge>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
                    Joined {item.joinedDate}
                </div>
                <div className="col-span-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-1">
                        {item.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>) ?? 'No tags'}
                    </div>
                </div>
            </div>
        </div>
    );

    return item.href ? <Link href={item.href}>{content}</Link> : content;
}

export function IconListView({
  data,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectable,
  onSelectionChange,
  selectedIds = [],
}: IconListViewProps) {

  const handleToggleSelect = (id: string) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onSelectionChange?.(newSelectedIds);
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-lg border border-gray-200">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('list')}
            className="h-9 w-9"
          >
            <List className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === 'icon' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('icon')}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-5 w-5 text-purple-600" />
          </Button>
        </div>
      </div>
      {viewMode === 'icon' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredData.map(item => (
            <IconViewItem 
                key={item.id} 
                item={item} 
                selectable={selectable}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
            />
        ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredData.map(item => (
            <ListItemView 
                key={item.id} 
                item={item} 
                selectable={selectable}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
            />
        ))}
        </div>
      )}
    </div>
  );
}
