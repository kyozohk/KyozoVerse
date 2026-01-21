
'use client';

import { ReactNode } from 'react';
import { Separator } from '@/components/ui';

interface HeaderBannerProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function HeaderBanner({ title, description, children }: HeaderBannerProps) {
  return (
    <div className="bg-background">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>
          {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
      </div>
      <Separator />
    </div>
  );
}
