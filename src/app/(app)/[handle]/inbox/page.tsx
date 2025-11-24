
'use client';

import { useState } from 'react';
import { ListView } from '@/components/ui/list-view';
import { Card } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function CommunityInboxPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <ListView
      title="Inbox"
      subtitle="Manage your community messages."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    >
        <div className="col-span-full text-center p-8">
            <p>Inbox functionality coming soon.</p>
        </div>
    </ListView>
  );
}
