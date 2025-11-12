
import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  className?: string;
  titleClassName?: string;
}

export function Header({
  title,
  className,
  titleClassName,
}: HeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h1 className={cn("text-4xl font-bold text-gray-800 dark:text-gray-100", titleClassName)}>
        {title}
      </h1>
    </div>
  );
}
