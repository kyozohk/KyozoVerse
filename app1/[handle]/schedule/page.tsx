
'use client';

import { useState } from 'react';
import { ListView } from '@/components/ui/list-view';
import { Card } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function CommunityIntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <ListView
      title="Schedule"
      subtitle="Connect with other services."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      <Card
        className="flex items-center justify-center border-dashed border-2 h-full min-h-[178px] cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <div className="text-center text-muted-foreground">
          <PlusCircle className="mx-auto h-10 w-10 mb-2" />
          <span className="font-medium">New Integration</span>
        </div>
      </Card>
      {/* Integrations will be listed here */}
    </ListView>
  );
}
