
'use client';

import { useState } from 'react';
import { List, LayoutGrid, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

interface ListItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: string;
  joinedDate: string;
  tags?: string[];
}

const sampleData: ListItem[] = [
  { id: '1', name: 'Ashok Jaiswal', email: 'ashok.jaiswal@gmail.com', avatarUrl: '', status: 'Active', joinedDate: 'Dec 14, 2025' },
  { id: '2', name: 'Nikki Davies', email: 'nikkidavies.com', avatarUrl: '', status: 'Active', joinedDate: 'Dec 28, 2025' },
  { id: '3', name: 'Will Poole', email: 'will@kyozo.com', avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', status: 'Active', joinedDate: 'Dec 10, 2025' },
  { id: '4', name: 'Ashok Jaiswal', email: 'ashok@kyozo.com', avatarUrl: '', status: 'Active', joinedDate: 'Dec 30, 2025' },
  { id: '5', name: 'Unknown', email: '', avatarUrl: '', status: 'Active', joinedDate: 'Dec 13, 2025' },
  { id: '6', name: 'Sarah Mitchell', email: 'sarah.mitchell@email.com', avatarUrl: '', status: 'Active', joinedDate: 'Jan 5, 2026', tags: ['Imported Contact'] },
  { id: '7', name: 'James Rodriguez', email: 'james.r@email.com', avatarUrl: 'https://randomuser.me/api/portraits/men/33.jpg', status: 'Active', joinedDate: 'Jan 3, 2026', tags: ['Imported Contact'] },
  { id: '8', name: 'Emily Chen', email: 'emily.chen@email.com', avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg', status: 'Active', joinedDate: 'Dec 28, 2025', tags: ['Imported Contact'] },
];

interface IconListViewProps {
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

function IconViewItem({ item, selectable, selected, onToggleSelect }: { item: ListItem, selectable?: boolean, selected?: boolean, onToggleSelect?: (id: string) => void }) {
  return (
    <div className="relative flex flex-col items-center text-center p-4 border rounded-lg h-full bg-white shadow-sm">
      {selectable && onToggleSelect && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(item.id)}
          className="absolute top-4 left-4"
        />
      )}
      <Avatar className="h-16 w-16 mb-4 mt-8">
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
}

function ListItemView({ item, selectable, selected, onToggleSelect }: { item: ListItem, selectable?: boolean, selected?: boolean, onToggleSelect?: (id: string) => void }) {
  return (
    <div className="flex items-center p-2 border rounded-lg bg-white shadow-sm">
        {selectable && onToggleSelect && (
            <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(item.id)}
            className="mr-4"
            />
        )}
        <Avatar className="h-10 w-10 mr-4">
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
}

export function IconListView({ selectable, onSelectionChange }: IconListViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'icon'>('icon');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const filteredData = sampleData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-lg border">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'icon' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('icon')}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4 text-purple-600" />
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
