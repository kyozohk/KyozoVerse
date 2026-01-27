
# CustomFormDialog Usage Guide

## Overview
The `CustomFormDialog` component provides a consistent and themed modal experience for forms across the application. It is a single-panel dialog that adapts its size based on the content.

## Props

```typescript
interface CustomFormDialogProps {
  open: boolean;              // Controls dialog visibility
  onOpenChange: (open: boolean) => void; // State setter to control the dialog
  title: string;              // Dialog title
  description?: string;       // Optional subtitle/description
  children: React.ReactNode;  // Main form content
  size?: 'default' | 'large'; // Optional size variant
}
```

## Usage Example

```tsx
import { useState } from 'react';
import { CustomFormDialog, Input, CustomButton } from '@/components/ui';

function MyFormComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <CustomButton onClick={() => setIsOpen(true)}>Open Form</CustomButton>
      
      <CustomFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="My Dialog"
        description="This is a simple form dialog."
        size="default" // Or "large" for a wider dialog
      >
        <div className="space-y-4">
          <Input label="Name" />
          <Input label="Email" type="email" />
          <CustomButton className="w-full" onClick={() => setIsOpen(false)}>Submit</CustomButton>
        </div>
      </CustomFormDialog>
    </div>
  );
}
```

## Best Practices

- **Controlled Component**: The dialog is a "controlled component". The parent component must manage the `open` state and pass the state setter function to `onOpenChange`.
- **Content**: The `children` prop should contain the form fields and submission logic.
- **Styling**: The dialog's colors and fonts are inherited from the global theme defined in `src/app/globals.css`. Avoid adding custom colors directly to the dialog or its children.
- **Sizing**: Use the `size` prop to choose between a standard (`default`) or wider (`large`) dialog.

## Migration from Old API

The previous API for this component included props like `rightComponent`, `showVideo`, `videoSrc`, and `color`. These have been removed to simplify the component and improve stability.

### Before (deprecated)
```tsx
<CustomFormDialog
  open={isOpen}
  onClose={() => setIsOpen(false)} // Incorrect handler
  title="My Dialog"
  color="#C170CF" // Deprecated prop
  rightComponent={<SomeComponent />} // Deprecated prop
>
  {/* content */}
</CustomFormDialog>
```

### After (current)
```tsx
<CustomFormDialog
  open={isOpen}
  onOpenChange={setIsOpen} // Correct handler
  title="My Dialog"
>
  {/* content */}
</CustomFormDialog>
```
