# API Authentication Fix Progress

## Problem
API routes using `verifyAuth` require Firebase ID token in `Authorization: Bearer <token>` header, but client-side code was not sending it.

## Fixed Components

### ✅ Upload & Delete
- `/api/upload` - Fixed in upload-helper.ts
- `/api/posts/delete` - Fixed in all card components (WatchCard, ListenCard, ImageCard, ReadCard)

### ✅ Email Broadcast
- `enhanced-broadcast-dialog.tsx` - Fixed
- `email-send-dialog.tsx` - Fixed

## Remaining Components to Fix

### `/api/send-email` calls
- [ ] `create-post-dialog.tsx` (line 263)
- [ ] `invite-member-dialog.tsx` (lines 166, 190)
- [ ] `delete-community-dialog.tsx` (line 121)
- [ ] `app/[handle]/broadcast/page.tsx` (line 176)

### Other Authenticated APIs
- [ ] `/api/send-invite` - Used in invite flows
- [ ] `/api/send-welcome-email` - Used in onboarding
- [ ] `/api/setup-community-domain` - Used in community setup
- [ ] `/api/setup-email-domain` - Used in email configuration
- [ ] `/api/delete-community-domain` - Used in domain management
- [ ] `/api/broadcast-templates` - Used in template management

## Pattern to Apply

```typescript
// 1. Import useAuth
import { useAuth } from '@/hooks/use-auth';

// 2. Get user in component
const { user } = useAuth();

// 3. Before API call
if (!user) {
  throw new Error('User must be authenticated');
}
const idToken = await user.getIdToken();

// 4. Update fetch call
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({...})
});
```

## Status
- **Completed**: 6 components
- **Remaining**: ~10 components
- **Priority**: High - affects email sending, invites, and community setup
