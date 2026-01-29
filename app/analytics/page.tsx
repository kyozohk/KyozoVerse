'use client';

import { BarChart3, LineChart } from 'lucide-react';
import { Header } from '@/components/ui/header';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-gradient-to-r from-[#699FE5] to-[#8FB8F0] text-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-2">
          <BarChart3 className="h-6 w-6 mr-2" />
          <h2 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h2>
        </div>
        
        <div className="flex items-center text-white/90 mb-4 bg-white/10 px-3 py-1 rounded-full w-fit">
          <LineChart className="h-5 w-5 mr-2" />
          <span>View your community metrics</span>
        </div>
        
        <p className="text-white/90 max-w-md backdrop-blur-sm bg-black/5 p-3 rounded-lg">
          Track growth, engagement, and performance metrics for your communities.
        </p>
      </div>

      <Header title="Analytics" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Community Growth</h3>
          <div className="h-64 flex items-center justify-center bg-slate-100 rounded-md">
            <p className="text-muted-foreground">Growth metrics coming soon</p>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Engagement Metrics</h3>
          <div className="h-64 flex items-center justify-center bg-slate-100 rounded-md">
            <p className="text-muted-foreground">Engagement data coming soon</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-medium mb-4">Performance Overview</h3>
        <div className="h-64 flex items-center justify-center bg-slate-100 rounded-md">
          <p className="text-muted-foreground">Performance analytics coming soon</p>
        </div>
      </div>
    </div>
  );
}
