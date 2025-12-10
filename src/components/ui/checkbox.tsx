
"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from 'next/navigation'
import { getThemeForPath } from '@/lib/theme-utils'

// Import styles
import "@/styles/components.css"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange'> {
  label?: string | React.ReactNode;
  error?: string;
  wrapperClassName?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, wrapperClassName, checked, onCheckedChange, ...props }, ref) => {
    const id = React.useId();
    const pathname = usePathname();
    const { activeColor } = getThemeForPath(pathname);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };
    
    return (
      <div className={cn("checkboxWrapper", wrapperClassName)}>
        <div className="checkboxContainer">
          <input
            id={id}
            type="checkbox"
            className="checkboxInput"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            {...props}
          />
          <div className={cn("checkbox")} style={{ borderColor: 'var(--input-border-color)', backgroundColor: checked ? 'var(--input-border-color)' : 'transparent' }}>
            <Check className="checkIcon" />
          </div>
          {label && (
            <label htmlFor={id} className="checkboxLabel">
              {label}
            </label>
          )}
        </div>
        {error && <div className="errorMessage">{error}</div>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
