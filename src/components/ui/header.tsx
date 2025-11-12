import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function Header({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName
}: HeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h1 className={cn("text-4xl font-bold text-gray-800 dark:text-gray-100", titleClassName)}>
        {title}
      </h1>
      {subtitle && (
        <p className={cn("text-base text-secondary mt-2", subtitleClassName)}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
