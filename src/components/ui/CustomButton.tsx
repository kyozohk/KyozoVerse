"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// Import styles
import "@/styles/components.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "outline" | "waitlist" | "rounded-rect" | "semi-rounded" | "white";
  size?: "default" | "small" | "large";
  icon?: LucideIcon;
  isLoading?: boolean;
}

const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    children, 
    variant = "default", 
    size = "default", 
    icon: Icon, 
    isLoading = false,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          "button",
          {
            "button-primary": variant === "primary",
            "button-outline": variant === "outline",
            "button-waitlist": variant === "waitlist",
            "button-rounded-rect": variant === "rounded-rect",
            "button-semi-rounded": variant === "semi-rounded",
            "button-white": variant === "white",
            "button-small": size === "small",
            "button-large": size === "large",
          },
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : Icon ? (
          <Icon className="button-icon h-4 w-4" />
        ) : null}
        {children}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

export { CustomButton };
