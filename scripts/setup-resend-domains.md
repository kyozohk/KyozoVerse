# Resend Domain Setup Guide

## Current Status (from API check)

| Domain | Status | Action Needed |
|--------|--------|---------------|
| `visionarycircle.kyozo.com` | ❌ FAILED | Fix DNS records |
| `kyozo.space` | ✅ VERIFIED | Working |
| `contact.kyozo.com` | ❌ NOT ADDED | Add to Resend |
| `kyozo.com` | ❌ NOT ADDED | Add to Resend |

## Problem

Your code is trying to send from:
- `noreply@contact.kyozo.com` (not in Resend)
- `dev@kyozo.com` (not in Resend)

Only `kyozo.space` is verified, so you should update your `.env.local` to use that.

## Quick Fix (Immediate)

Add to your `.env.local`:

```bash
RESEND_FROM="Kyozo <noreply@kyozo.space>"
```

This will use your **already verified** domain.

## Proper Fix (Recommended)

### Option 1: Add contact.kyozo.com to Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `contact.kyozo.com`
4. Resend will give you DNS records to add

**DNS Records you'll need to add to your DNS provider:**

| Type | Name | Value |
|------|------|-------|
| TXT | _dmarc | v=DMARC1; p=quarantine; rua=mailto:dmarc@resend.dev |
| TXT | contact | [Resend will provide] |

5. Wait 5-10 minutes for DNS propagation
6. Click "Verify" in Resend

### Option 2: Fix visionarycircle.kyozo.com

This domain is in your account but verification failed. Check your DNS records:

1. Go to https://resend.com/domains
2. Click on `visionarycircle.kyozo.com`
3. Check which records are showing as "Missing" or "Invalid"
4. Update DNS at your registrar (GoDaddy, Cloudflare, etc.)

## Alternative: Use kyozo.space (Already Working)

Since `kyozo.space` is already verified, you can simply update your code to use that domain.

Update these files:

**1. `app/api/send-email/route.ts`** (around line 76):
```typescript
// Change from:
const fromAddress = from || RESEND_FROM || 'Kyozo <noreply@contact.kyozo.com>';

// To:
const fromAddress = from || RESEND_FROM || 'Kyozo <noreply@kyozo.space>';
```

**2. Delete dialog and other places that hardcode domains**

Search for hardcoded domains:
```bash
grep -r "contact.kyozo.com\|kyozo.com" src/ app/ --include="*.ts" --include="*.tsx"
```

## Verification Steps

1. After making changes, restart your dev server:
   ```bash
   pnpm dev
   ```

2. Try sending the deletion verification email again

3. Check server logs - you should see:
   - `resend_response` with `status: 200`
   - No fallback needed

## Monitoring

Run the domain check script anytime:
```bash
RESEND_API_KEY="re_BSraSy53_DxkkdnandZ4mmVtb6doJNn7h" node scripts/check-resend-domains.js
```

## Support

If DNS records are correct but still failing:
- Check DNS propagation: https://dns.google/resolve?name=contact.kyozo.com&type=TXT
- Contact Resend support: support@resend.com
- Check Resend status: https://resend.statuspage.io/
