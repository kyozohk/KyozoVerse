# Firestore Security Rules Update Required

## Issue
Tags cannot be saved to the community subcollection due to missing Firestore permissions.

**Error:** `FirebaseError: Missing or insufficient permissions`

## Required Firestore Rules

Add the following rules to your `firestore.rules` file to allow community owners/admins to create and manage tags:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing rules...
    
    // Community tags subcollection - SIMPLE VERSION (for authenticated users)
    match /communities/{communityId}/tags/{tagId} {
      // Allow read/write to any authenticated user
      allow read, write: if request.auth != null;
    }
  }
}
```

### More Secure Version (Optional)

If you want stricter permissions, use this version that checks ownership:

```javascript
match /communities/{communityId}/tags/{tagId} {
  // Allow read to authenticated users
  allow read: if request.auth != null;
  
  // Allow write to community owners and admins
  allow write: if request.auth != null && (
    get(/databases/$(database)/documents/communities/$(communityId)).data.ownerId == request.auth.uid ||
    exists(/databases/$(database)/documents/communityMembers/$(request.auth.uid + '_' + communityId)) &&
    get(/databases/$(database)/documents/communityMembers/$(request.auth.uid + '_' + communityId)).data.role in ['admin', 'owner']
  );
}
```

## Explanation

1. **Read access**: Anyone can read tags (needed to display available tags in the UI)
2. **Write access**: Only community owners and admins can create/update/delete tags
   - Checks if the user is the community owner (via `ownerId` field)
   - OR checks if the user is a member with 'admin' or 'owner' role

## How to Apply

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Rules" tab
4. Add the rules above to your existing rules
5. Click "Publish"

## Testing

After applying the rules, test by:
1. Selecting members in the members list
2. Clicking "Add Tags"
3. Adding a new tag
4. Clicking "Apply Tags"
5. Check browser console for success message: `✅ [addTagToCommunity] Tag "..." saved successfully`

## Alternative: Temporary Development Rules

For development/testing only, you can temporarily allow all authenticated users to write tags:

```javascript
match /communities/{communityId}/tags/{tagId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

**⚠️ Warning:** This is less secure and should only be used during development.
