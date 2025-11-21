"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select";

export interface FloatingSelectProps
  extends React.ComponentPropsWithoutRef<typeof Select> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  /**
   * Children should include SelectContent / SelectItem elements.
   */
  children: React.ReactNode;
}

/**
 * FloatingSelect
 *
 * Wrapper around our Radix Select that:
 * - Uses the same wrapper/label classes as the custom Input
 * - Provides a floating label
 * - Allows a taller dropdown panel (use max-h-* on SelectContent)
 */
export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  error,
  wrapperClassName,
  value,
  defaultValue,
  onValueChange,
  children,
  ...rootProps
}) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    (value as string | undefined) ?? (defaultValue as string | undefined)
  );

  const currentValue = (value as string | undefined) ?? internalValue;

  const handleValueChange = (val: string) => {
    setInternalValue(val);
    onValueChange?.(val);
  };

  return (
    <div className={cn("inputWrapper", wrapperClassName)}>
      <div className={cn("inputContainer", error ? "hasError" : "")}
        // eslint-disable-next-line react/no-unknown-property
      >
        <Select
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          {...rootProps}
        >
          <SelectTrigger
            className={cn(
              "input selectTrigger",
              currentValue ? "select-has-value" : ""
            )}
          >
            <SelectValue />
          </SelectTrigger>
          {children}
        </Select>
        {label && <label className="floatingLabel">{label}</label>}
      </div>
      {error && <div className="errorMessage">{error}</div>}
    </div>
  );
};
