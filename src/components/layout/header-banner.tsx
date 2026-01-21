'use client';

import { ReactNode } from 'react';

interface HeaderBannerProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function HeaderBanner({ title, description, children }: HeaderBannerProps) {
  return (
    <div className="border-b bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children && <div className="flex gap-2">{children}</div>}
      </div>
    </div>
  );
}
