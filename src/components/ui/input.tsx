

import * as React from "react"
import { cn } from "@/lib/utils"

// Import styles
import "@/styles/components.css"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Made label mandatory for floating label
  error?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, wrapperClassName, icon, ...props }, ref) => {
    const inputId = React.useId();

    return (
      <div className={cn("inputWrapper", wrapperClassName)}>
        <div className={cn("inputContainer", error ? "hasError" : "")}>
          {icon && <div className="input-icon">{icon}</div>}
          <input
            id={inputId}
            type={type}
            className={cn("input", icon ? "input-with-icon" : "", error ? "hasError" : "", className)}
            ref={ref}
            placeholder=" " // Use a space for the placeholder to enable :not(:placeholder-shown)
            {...props}
          />
          {label && (
            <label htmlFor={inputId} className="floatingLabel">
                {label}
            </label>
           )}
        </div>
        {error && <div className="errorMessage">{error}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
