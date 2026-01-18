
import * as React from 'react';

import {cn} from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string; // Make label mandatory for floating label
  error?: string;
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({className, label, error, wrapperClassName, ...props}, ref) => {
    const id = React.useId();
    return (
      <div className={cn('inputWrapper', wrapperClassName)}>
        <div className={cn('inputContainer', error ? 'hasError' : '')}>
          <textarea
            id={id}
            className={cn(
              'input !h-auto', // Use !h-auto to override fixed height
              error ? 'hasError' : '',
              className
            )}
            ref={ref}
            placeholder=" " // Use a space for the placeholder to enable :not(:placeholder-shown)
            {...props}
          />
          {label && (
            <label htmlFor={id} className="floatingLabel">
              {label}
            </label>
           )}
        </div>
        {error && <div className="errorMessage">{error}</div>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
