# CustomFormDialog Usage Guide

## Overview
The `CustomFormDialog` component has been updated to support custom right-side components instead of hardcoded video animations.

## Props

```typescript
interface CustomFormDialogProps {
  open: boolean;              // Controls dialog visibility
  onClose: () => void;        // Callback when dialog closes
  title: string;              // Dialog title
  description?: string;       // Optional subtitle/description
  children: React.ReactNode;  // Main form content (left panel)
  backgroundImage?: string;   // Background image for left panel (default: "/bg/light_app_bg.png")
  rightComponent?: React.ReactNode;  // Optional custom component for right panel
  color?: string;             // Theme color (default: "var(--primary-purple)")
}
```

## Usage Examples

### 1. Dialog without right panel (full width)
```tsx
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
  description="Dialog description"
>
  <div>
    {/* Your form content here */}
  </div>
</CustomFormDialog>
```

### 2. Dialog with custom image on right
```tsx
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
  rightComponent={
    <img 
      src="/path/to/image.jpg" 
      alt="Description"
      className="w-full h-full object-cover"
    />
  }
>
  <div>
    {/* Your form content here */}
  </div>
</CustomFormDialog>
```

### 3. Dialog with custom video on right
```tsx
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
  rightComponent={
    <video
      className="absolute top-0 left-0 w-full h-full object-cover"
      src="/videos/my-video.mp4"
      autoPlay
      loop
      muted
      playsInline
    />
  }
>
  <div>
    {/* Your form content here */}
  </div>
</CustomFormDialog>
```

### 4. Dialog with custom React component on right
```tsx
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
  rightComponent={
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-white text-center p-8">
        <h3 className="text-2xl font-bold mb-4">Welcome!</h3>
        <p>Custom content here</p>
      </div>
    </div>
  }
>
  <div>
    {/* Your form content here */}
  </div>
</CustomFormDialog>
```

## Migration from Old API

### Before (deprecated)
```tsx
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
  showVideo={true}
  videoSrc="/videos/form-right-no.mp4"
>
  {/* content */}
</CustomFormDialog>
```

### After (current)
```tsx
// Option 1: No right panel
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
>
  {/* content */}
</CustomFormDialog>

// Option 2: With custom video component
<CustomFormDialog
  open={isOpen}
  onClose={onClose}
  title="My Dialog"
  rightComponent={
    <video
      className="absolute top-0 left-0 w-full h-full object-cover"
      src="/videos/form-right-no.mp4"
      autoPlay
      loop
      muted
      playsInline
    />
  }
>
  {/* content */}
</CustomFormDialog>
```

## Notes

- **Without right panel**: Dialog uses standard modal dimensions (`max-w-md` width, `max-h-[85vh]` height) - industry standard for form dialogs
- **With right panel**: Dialog uses larger dimensions (`max-w-[90vw]` width, `h-[90vh]` height) to accommodate the two-column layout
- The dialog automatically adjusts padding and title sizes based on whether a right panel is present
- The right panel is hidden on mobile devices (< md breakpoint)
- The right panel container has `overflow-hidden` and `relative` positioning by default
- You can pass any valid React node as `rightComponent` (JSX, components, etc.)

## Responsive Behavior

### Without Right Panel
- **Width**: Maximum 28rem (448px) - standard modal width
- **Height**: Maximum 85vh - allows breathing room
- **Padding**: Compact padding (p-6 md:p-8)
- **Title**: Smaller size (text-3xl md:text-4xl)

### With Right Panel
- **Width**: Maximum 90vw - uses most of viewport
- **Height**: Fixed 90vh - immersive experience
- **Padding**: Generous padding (p-8 md:p-12 lg:p-16)
- **Title**: Larger size (text-4xl md:text-5xl)
