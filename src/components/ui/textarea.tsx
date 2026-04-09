
import * as React from 'react';

import {cn} from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({className, label, error, helpText, wrapperClassName, placeholder, ...props}, ref) => {
    const id = React.useId();
    return (
      <div className={cn('inputWrapper', wrapperClassName)}>
        <div className={cn('inputContainer', error ? 'hasError' : '')}>
          <textarea
            id={id}
            className={cn(
              'input !h-auto',
              error ? 'hasError' : '',
              className
            )}
            ref={ref}
            placeholder={label ? " " : placeholder}
            {...props}
          />
          {label && (
            <label htmlFor={id} className="floatingLabel">
              {label}
            </label>
          )}
        </div>
        {helpText && !error && <div className="text-xs mt-1" style={{ color: '#8B7355' }}>{helpText}</div>}
        {error && <div className="errorMessage">{error}</div>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
