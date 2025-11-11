import * as React from "react"
import { cn } from "@/lib/utils"

// Import styles
import "@/styles/components.css"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  floatingLabel?: boolean;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    required, 
    floatingLabel = true, // Default to true for floating labels
    wrapperClassName,
    placeholder,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const inputId = React.useId();
    
    // Combine the forwarded ref with our local ref
    React.useImperativeHandle(ref, () => inputRef.current!);
    
    // Check if the input has a value
    React.useEffect(() => {
      if (inputRef.current) {
        setHasValue(!!inputRef.current.value);
      }
    }, [props.value, props.defaultValue]);
    
    // Handle input changes to track if the field has a value
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    const showFloatingLabel = isFocused || hasValue;
    
    return (
      <div className={cn("inputWrapper", wrapperClassName)}>
        {label && !floatingLabel && (
          <label htmlFor={inputId} className="label">
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        
        <div className={cn("inputContainer", error ? "hasError" : "")}>
          <input
            id={inputId}
            type={type}
            className={cn(
              "input",
              error ? "hasError" : "",
              className
            )}
            ref={inputRef}
            placeholder={showFloatingLabel && floatingLabel ? '' : placeholder}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            onChange={handleChange}
            {...props}
          />
          
          {floatingLabel && label && (
            <label 
              htmlFor={inputId}
              className={cn(
                "floatingLabel", 
                showFloatingLabel ? "active" : "",
                placeholder && !showFloatingLabel ? "hidden" : ""
              )}
            >
              {label}
              {required && <span className="required">*</span>}
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
