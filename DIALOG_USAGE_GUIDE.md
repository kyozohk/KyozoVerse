# Dialog Usage Guide

## Base Component: `CustomFormDialog`

All dialogs in the application should use the `CustomFormDialog` base component located at `/src/components/ui/dialog.tsx`.

### Features

- **Curtain Animation**: Opens from center outward (like curtains), closes in reverse
- **Fixed Layout**: Header at top, scrollable form content, footer with CTAs at bottom
- **Video Background**: Optional video playing on the right side
- **Custom Controls**: All form controls and buttons use our custom components
- **Close Icon**: Top-right corner with hover effect
- **Responsive**: Adapts to mobile (single column) and desktop (two columns)

### Props

```typescript
interface CustomFormDialogProps {
  open: boolean;                    // Control dialog visibility
  onClose: () => void;              // Close handler
  title: string;                    // Main heading
  description?: string;             // Optional subheading
  children: React.ReactNode;        // Form content
  backgroundImage?: string;         // Left panel background (default: "/bg/light_app_bg.png")
  showVideo?: boolean;              // Show/hide video (default: true)
  videoSrc?: string;                // Video source (default: "/videos/form-right.mp4")
  color?: string;                   // Theme color for inputs (default: "#843484")
}
```

### Usage Pattern

```tsx
import { CustomFormDialog, Input, PasswordInput, CustomButton } from '@/components/ui';

function MyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    
    // Action
    try {
      await myAction(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <CustomFormDialog
      open={open}
      onClose={onClose}
      title="My Dialog Title"
      description="Optional description text"
      backgroundImage="/bg/light_app_bg.png"
      videoSrc="/videos/form-right.mp4"
      color="#C170CF"
    >
      {/* Form Content - Scrollable Area */}
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
          <div className="text-center text-sm">
            Additional link or text
          </div>
        </div>
      </div>
    </CustomFormDialog>
  );
}
```

## Current Dialogs to Update

### ✅ Already Using CustomFormDialog
1. `/src/components/auth/reset-password-dialog.tsx` - Reset password
2. `/src/components/auth/request-access-dialog.tsx` - Waitlist signup
3. `/src/components/community/create-community-dialog.tsx` - Create/edit community
4. `/src/components/community/member-dialog.tsx` - Add/edit member
5. `/src/components/community/whatsapp-message-dialog.tsx` - Send WhatsApp message
6. `/src/components/community/feed/create-post-dialog.tsx` - Create post
7. `/src/components/broadcast/broadcast-dialog.tsx` - Broadcast messages
8. `/src/app/c/[handle]/layout.tsx` - Sign in dialog
9. `/src/components/landing/landing-page.tsx` - Sign in/up dialogs

### 📋 Dialogs Using Standard Dialog (Need Review)
1. `/src/components/community/join-community-dialog.tsx`
2. `/src/components/mongo/export-dialog.tsx`

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [X Close]                                                  │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │ Left Panel (Form)    │ Right Panel (Video)          │   │
│  │                      │                              │   │
│  │ Header               │                              │   │
│  │ ├─ Title (Large)     │                              │   │
│  │ └─ Description       │                              │   │
│  │                      │                              │   │
│  │ Form Content         │      [Video Playing]         │   │
│  │ ├─ Input 1           │                              │   │
│  │ ├─ Input 2           │                              │   │
│  │ ├─ Input 3           │                              │   │
│  │ └─ ...               │                              │   │
│  │                      │                              │   │
│  │ Footer (CTAs)        │                              │   │
│  │ ├─ Primary Button    │                              │   │
│  │ └─ Secondary Link    │                              │   │
│  └──────────────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Animation Behavior

### Opening
- Starts from center (vertical line)
- Expands left and right like curtains opening
- Duration: 400ms with ease-out curve
- Opacity fades in simultaneously

### Closing
- Contracts from both sides to center
- Duration: 300ms with ease-in curve
- Opacity fades out simultaneously

## Best Practices

1. **Form Structure**: Always wrap content in flex container with `flex-grow` for scrollable area and fixed footer
2. **Validation**: Handle validation in parent component, pass errors as props or state
3. **Loading States**: Use `CustomButton` loading prop for async actions
4. **Error Display**: Show errors below relevant fields or at top of form
5. **Accessibility**: Ensure all inputs have labels and proper ARIA attributes
6. **Mobile**: Test on mobile - video panel hides, form takes full width
7. **Custom Controls**: Always use `Input`, `PasswordInput`, `Textarea`, `CustomButton`, etc.

## Custom Controls Available

- `Input` - Text input with label
- `PasswordInput` - Password input with show/hide toggle
- `Textarea` - Multi-line text input
- `CustomButton` - Themed button with variants
- `Dropzone` - File upload
- `Checkbox` - Checkbox with label
- `Switch` - Toggle switch
- `Label` - Form label

## Example: Sign In Dialog

See `/src/app/c/[handle]/layout.tsx` lines 103-154 for a complete example of:
- Form state management
- Validation
- Error handling
- Bottom-aligned CTAs
- Secondary actions (forgot password, sign up links)
