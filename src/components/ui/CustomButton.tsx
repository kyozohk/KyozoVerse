
'use client';

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const customButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-2 bg-transparent hover:opacity-80",
        selected: "border-2 hover:opacity-90 shadow-sm",
        "rounded-rect": "border border-white/30 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm",
        waitlist: "text-white hover:opacity-90 shadow-md",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        small: "h-9 rounded-md px-3",
        large: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof customButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const buttonStyle = variant === 'waitlist' 
      ? { backgroundColor: 'var(--page-content-bg)', color: '#6B5D52', border: '2px solid var(--page-content-border)', ...style }
      : variant === 'selected'
      ? { backgroundColor: 'var(--page-content-bg)', color: '#6B5D52', borderColor: 'var(--page-content-border)', ...style }
      : style;

    return (
      <Comp
        className={cn(customButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        style={buttonStyle}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
CustomButton.displayName = "CustomButton";

export { CustomButton, customButtonVariants };
