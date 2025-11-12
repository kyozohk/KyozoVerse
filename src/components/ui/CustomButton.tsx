import React from 'react';
import { cn } from '@/lib/utils';
import '@/styles/components.css';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'outline' | 'waitlist' | 'rounded-rect';
  size?: 'default' | 'small' | 'large';
}

export const CustomButton: React.FC<CustomButtonProps> = ({ 
  children, 
  className,
  variant = 'default',
  size = 'default',
  ...props 
}) => {
  return (
    <button 
      className={cn(
        'button',
        {
          'button-primary': variant === 'primary',
          'button-outline': variant === 'outline',
          'button-waitlist': variant === 'waitlist',
          'button-rounded-rect': variant === 'rounded-rect',
          'button-small': size === 'small',
          'button-large': size === 'large',
        },
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};
