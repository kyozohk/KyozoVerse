# Manual Community Deletion Guide

## Overview
This guide explains how to manually delete a community using the command-line script when the UI delete button is not accessible.

## Prerequisites
- Node.js installed
- Firebase Admin SDK service account key (`serviceAccountKey.json`) in the project root
- Access to the server/local environment

## Usage

### Delete a Community by Handle

```bash
node scripts/delete-community-manual.js <community-handle>
```

### Example: Delete willer2 Community

```bash
node scripts/delete-community-manual.js willer2
```

## What Gets Deleted

The script will permanently delete:

1. **Community Document** - The main community record
2. **Member Associations** - All community membership records (users themselves are NOT deleted)
3. **Posts & Content** - All posts created in the community
4. **Email Domain** - The community's email domain configuration (e.g., `willer2.kyozo.com`)

## Important Notes

### ⚠️ User Accounts Are NOT Deleted
- The script only removes **community membership associations**
- User accounts remain intact in the system
- Users who are members of other communities will retain their accounts
- Users who are ONLY members of the deleted community will still have their user accounts

### 🔍 Cross-Community Member Check
The enhanced UI delete dialog (in Settings page) shows which members will be affected:
- **Members in other communities**: Association removed, account remains
- **Members only in this community**: Association removed, account remains

### 📧 Email Verification (UI Only)
When using the UI delete button in Settings:
- A 6-digit verification code is sent to the community owner's email
- This prevents unauthorized deletion
- The manual script bypasses this for administrative purposes

## Script Output

The script provides detailed output:

```
🔍 Looking for community: willer2

✓ Found community: Willer 2
  ID: abc123...
  Owner: user123
  Members: 5

📊 Found 5 member associations

📝 Found 12 posts

⚠️  WARNING: This will permanently delete:
   - Community: Willer 2
   - 5 member associations
   - 12 posts
   - Email domain: willer2.kyozo.com

🗑️  Starting deletion process...

Deleting 12 posts...
✓ Deleted 12 posts

Deleting 5 member associations...
✓ Deleted 5 member associations

Deleting community document...
✓ Deleted community document

Attempting to delete email domain...
✓ Email domain cleanup result: {...}

✅ Community "willer2" has been successfully deleted!
```

## Troubleshooting

### Community Not Found
```
❌ Community "willer2" not found.
```
**Solution**: Check the handle spelling. Use the exact handle from the URL.

### Permission Errors
```
❌ Error deleting community: Permission denied
```
**Solution**: Ensure `serviceAccountKey.json` is present and has correct permissions.

### Email Domain Cleanup Failed
```
⚠️  Email domain cleanup failed (this is optional): ...
```
**Note**: This is optional and won't prevent community deletion. The community will still be deleted successfully.

## UI-Based Deletion (Recommended)

For normal operations, use the UI delete button in Settings:

1. Navigate to `/{community-handle}/settings`
2. Scroll to "Danger Zone"
3. Click "Delete Community"
4. Review member impact (accordion shows cross-community memberships)
5. Click "Send Verification Code"
6. Enter the 6-digit code from email
7. Type the community handle to confirm
8. Click "Delete Community Forever"

## Security Features (UI Only)

The UI deletion includes:
- **Email Verification**: 6-digit code sent to owner
- **Handle Confirmation**: Must type exact handle
- **Member Impact Review**: See which members will be affected
- **Settings Page Only**: Delete button removed from header for safety

## When to Use Manual Script

Use the manual script when:
- UI is not accessible
- Community owner account is unavailable
- Emergency deletion required
- Administrative cleanup needed

## Support

For issues or questions:
- Check Firebase console for community data
- Review server logs for errors
- Contact system administrator
