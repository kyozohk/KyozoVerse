import React from 'react';

interface SidebarTextProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarText: React.FC<SidebarTextProps> = ({ children, className }) => {
  return (
    <span
      className={`text-base text-white ${className}`}
      style={{ textShadow: '0px 0px 1px rgba(0,0,0,0.5)' }}
    >
      {children}
    </span>
  );
};
