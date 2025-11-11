import * as React from "react"
import { cn } from "@/lib/utils"

// Import styles
import "@/styles/components.css"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string; // Made label mandatory for floating label
  error?: string;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, wrapperClassName, ...props }, ref) => {
    const inputId = React.useId();

    return (
      <div className={cn("inputWrapper", wrapperClassName)}>
        <div className={cn("inputContainer", error ? "hasError" : "")}>
          <input
            id={inputId}
            type={type}
            className={cn("input", error ? "hasError" : "", className)}
            ref={ref}
            placeholder=" " // Required for the floating label to work
            {...props}
          />
          <label htmlFor={inputId} className="floatingLabel">
            {label}
          </label>
        </div>
        {error && <div className="errorMessage">{error}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
