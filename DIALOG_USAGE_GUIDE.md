
# Dialog Usage Guide

## Base Component: `CustomFormDialog`

All dialogs in the application should use the `CustomFormDialog` base component located at `/src/components/ui/dialog.tsx`.

### Features

- **Consistent Styling**: Inherits colors and fonts from the global theme for a unified look.
- **State Management**: Follows a standard "controlled component" pattern for robust state management.
- **Fixed Layout**: Header at top, scrollable form content, and optional footer for actions.
- **Custom Controls**: Designed to work with our custom `Input`, `Button`, etc. components.
- **Close Icon**: Top-right corner with hover effect.
- **Responsive**: Adapts to different screen sizes.

### Props

```typescript
interface CustomFormDialogProps {
  open: boolean;                    // Control dialog visibility
  onOpenChange: (open: boolean) => void; // State setter for controlling the dialog
  title: string;                    // Main heading
  description?: string;             // Optional subheading
  children: React.ReactNode;        // Form content
  size?: 'default' | 'large';       // Optional size variant
}
```

### Usage Pattern

```tsx
import { useState } from 'react';
import { CustomFormDialog, Input, PasswordInput, CustomButton } from '@/components/ui';

function MyDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // ... validation and submission logic ...
  };

  return (
    <>
      <CustomButton onClick={() => setIsOpen(true)}>Open Dialog</CustomButton>

      <CustomFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="My Dialog Title"
        description="Optional description text"
      >
        {/* Form Content */}
        <div className="flex flex-col h-full">
          <div className="flex-grow space-y-6">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {/* Footer - Bottom Aligned CTAs */}
          <div className="mt-8 space-y-4">
            <CustomButton
              onClick={handleSubmit}
              className="w-full py-3"
              variant="waitlist"
            >
              Submit
            </CustomButton>
          </div>
        </div>
      </CustomFormDialog>
    </>
  );
}
```

## Best Practices

1.  **Controlled State**: Always control the dialog's visibility from the parent component using `useState` and pass the setter to `onOpenChange`.
2.  **Form Structure**: For forms with a fixed action button at the bottom, use a flexbox layout with `flex-grow` on the scrollable content area.
3.  **Validation**: Handle validation within the parent component and display errors inside the dialog's `children`.
4.  **Loading States**: Use the `isLoading` prop on `CustomButton` to provide feedback during async operations.
5.  **Custom Controls**: Use the library of custom components (`Input`, `PasswordInput`, `Textarea`, `CustomButton`, etc.) for a consistent UI.

## Example: Sign In Dialog

See `/src/app/page.tsx` for a complete example of how `CustomFormDialog` is used for both sign-in and sign-up flows, including:
- Form state management
- Validation and error handling
- Toggling between different dialogs
- Bottom-aligned CTAs
- Secondary actions (e.g., forgot password, sign up links)
