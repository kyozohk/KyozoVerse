import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div 
      className="min-h-screen" 
      style={{ backgroundColor: 'var(--page-bg-color)' }}
    >
      <div className="p-3 sm:p-8">
        {/* Mobile: flat full-bleed card — rounded border only on sm+ */}
        <div
          className="overflow-hidden sm:rounded-2xl sm:border-2 sm:border-[color:var(--page-content-border)]"
          style={{
            backgroundColor: 'var(--page-content-bg)',
          }}
        >
          <div className="flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
