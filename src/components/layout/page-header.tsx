import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div style={{ backgroundColor: 'var(--page-content-bg)' }}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-grow">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
