# Firebase Import Setup Guide

## Overview
The MongoDB export/import system now supports enriching user data from a source Firebase project (kyozo-prod) before importing into the target Firebase project.

## Required Environment Variable

Add this to your `.env.local` file:

```env
FIREBASE_IMPORT_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kyozo-prod",...}
```

### How to Get the Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the **kyozo-prod** project
3. Click the gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Copy the entire JSON content and set it as the value for `FIREBASE_IMPORT_SERVICE_ACCOUNT_KEY`

**Important:** The value should be a single-line JSON string (no line breaks).

## How It Works

### Export Flow (`getCommunityExportData`)
1. Fetches community and members from MongoDB
2. **NEW:** For each member, looks up their user data in the kyozo-prod Firebase project by `mongoId`
3. Merges Firebase data (email, displayName, avatarUrl, bio, etc.) with MongoDB data
4. Exports enriched user data along with their messages

### Import Flow (`importCommunityToFirebase`)
1. Creates/updates users in the target Firebase Auth
2. **NEW:** Migrates user images (avatarUrl, coverUrl) from source Firebase Storage to target Firebase Storage
3. **NEW:** Uses the enriched user data (including bio, phone, etc.) from the export
4. **NEW:** Migrates community images (profile, background) from source Firebase Storage to target
5. Creates community document with proper owner reference and migrated image URLs
6. Creates community member links

## What Gets Enriched & Migrated

### User Data Enrichment
When a user is found in the kyozo-prod Firebase project, the following fields are enriched:
- `email`
- `fullName` (from `displayName`)
- `firstName`
- `lastName`
- `profileImage` (from `avatarUrl`)
- `coverUrl`
- `bio`
- `phoneNumber` (from `phone`)
- `firebaseUid` (original Firebase UID is stored for reference)

### Image Migration
During import, the following images are automatically migrated from the source Firebase Storage bucket to the target:
- **User Images:**
  - Profile/Avatar images (`avatarUrl`)
  - Cover images (`coverUrl`)
- **Community Images:**
  - Community profile image (`communityProfileImage`)
  - Community background image (`communityBackgroundImage`)

The migration process:
1. Detects Firebase Storage URLs (format: `https://firebasestorage.googleapis.com/...`)
2. Downloads the image from the source bucket
3. Uploads to the target bucket with the same path
4. Makes the file publicly accessible
5. Updates the URL in the imported data to point to the new bucket

## Fallback Behavior

If `FIREBASE_IMPORT_SERVICE_ACCOUNT_KEY` is not set:
- The system will log a warning
- Export will continue using only MongoDB data
- Import will still work but without the enriched Firebase data

## Testing

1. Set the `FIREBASE_IMPORT_SERVICE_ACCOUNT_KEY` environment variable
2. Restart your development server
3. Go to `/mongo` route
4. Export a community
5. Check the console logs for messages like:
   - `[Exporter] Enriching user data from import Firebase project...`
   - `[Exporter] Found Firebase user data for Mongo ID ...`
6. Import the community
7. Check the console logs for image migration messages:
   - `[Importer] - Migrating user images...`
   - `[ImageMigration] Migrating image from kyozo-prod.appspot.com: ...`
   - `[ImageMigration] Successfully migrated image to: ...`
   - `[Importer] Step 2: Migrating community images...`
8. Verify that:
   - User profiles have complete data including bio, phone, etc.
   - All images (user avatars, covers, community images) are accessible in the new Firebase Storage bucket
   - Image URLs in Firestore point to the new bucket

## Troubleshooting

### "FIREBASE_IMPORT_SERVICE_ACCOUNT_KEY not set"
- Make sure you've added the environment variable to `.env.local`
- Restart your development server after adding the variable

### "Failed to parse FIREBASE_IMPORT_SERVICE_ACCOUNT_KEY"
- Ensure the JSON is valid
- Make sure there are no extra quotes or line breaks
- The value should be the raw JSON object as a string

### "Owner with Mongo ID ... was not found"
- This error should now be fixed as the owner is always included in the export
- If you still see this, check that the community owner exists in MongoDB

### "Failed to migrate image"
- Check that the source Firebase Storage bucket is accessible with the import service account
- Verify that the target Firebase Storage bucket has write permissions
- Ensure the image URLs are valid Firebase Storage URLs
- Check the console logs for specific error details

### Images not appearing after import
- Verify that the images were successfully migrated (check console logs)
- Check Firebase Storage console to confirm images exist in the target bucket
- Ensure the images are set to public (the migration automatically does this)
- If images are from external sources (not Firebase Storage), they will keep their original URLs
