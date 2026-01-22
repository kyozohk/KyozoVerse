import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div 
      className="font-body antialiased min-h-screen" 
      style={{ backgroundColor: 'var(--page-bg-color)' }}
    >
      <div className="p-8">
        <div 
          className="rounded-2xl overflow-visible" 
          style={{ 
            backgroundColor: 'var(--page-content-bg)', 
            border: '2px solid var(--page-content-border)' 
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
