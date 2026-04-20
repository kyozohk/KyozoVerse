# Verify contact.kyozo.com for Resend

## Current Status

| Domain | Resend Status | GoDaddy DNS | Action |
|--------|--------------|-------------|--------|
| `contact.kyozo.com` | ❌ NOT ADDED | Unknown | Add to Resend + DNS |
| `kyozo.space` | ✅ VERIFIED | - | Working (backup option) |

## Option 1: Automated Verification (Recommended)

Run the verification script:

```bash
node scripts/verify-contact-subdomain.js
```

This will:
1. Add `contact.kyozo.com` to Resend
2. Get the required DNS records from Resend
3. Add them to GoDaddy automatically
4. Trigger verification

## Option 2: Manual Verification

### Step 1: Add Domain to Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `contact.kyozo.com`
4. Click "Add"

### Step 2: Get DNS Records from Resend

Resend will show you DNS records like:

| Type | Host | Value |
|------|------|-------|
| TXT | contact | `v=spf1 include:resend.com ~all` |
| TXT | resend._domainkey.contact | `[long DKIM value]` |
| TXT | _dmarc.contact | `v=DMARC1; p=quarantine; rua=mailto:dmarc@resend.dev` |

### Step 3: Add DNS Records to GoDaddy

You have two options:

#### A) Use GoDaddy API Script

Check current DNS records:
```bash
node scripts/check-godaddy-dns.js
```

Add the records manually via GoDaddy API or dashboard.

#### B) Manual GoDaddy Dashboard

1. Log in to https://dcc.godaddy.com/
2. Go to "My Products" → "DNS"
3. Find `kyozo.com`
4. Click "Manage"
5. Add these records:

**SPF Record:**
- Type: TXT
- Name: contact
- Value: `v=spf1 include:resend.com ~all`
- TTL: 1 hour

**DKIM Record:**
- Type: TXT
- Name: resend._domainkey.contact
- Value: [Copy from Resend]
- TTL: 1 hour

**DMARC Record:**
- Type: TXT
- Name: _dmarc.contact
- Value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@resend.dev`
- TTL: 1 hour

### Step 4: Verify in Resend

1. Wait 5-10 minutes for DNS propagation
2. Go back to https://resend.com/domains
3. Click "Verify" next to `contact.kyozo.com`

## Verification Check

After adding DNS records, verify they're correct:

```bash
# Check DNS propagation
dig TXT contact.kyozo.com
dig TXT resend._domainkey.contact.kyozo.com
dig TXT _dmarc.contact.kyozo.com
```

Or use online tool: https://dns.google/resolve?name=contact.kyozo.com&type=TXT

## Cleanup After Verification

Once `contact.kyozo.com` is verified:

1. **Delete community** - The deletion email will now work
2. **Clean up other domains** - Remove unused domains from Resend
3. **Update environment** - Add to `.env.local`:
   ```bash
   RESEND_FROM="Kyozo <noreply@contact.kyozo.com>"
   ```

## Troubleshooting

### Domain still pending after 24 hours

1. Check DNS records match exactly (no extra quotes, correct format)
2. Verify GoDaddy records were saved
3. Check DNS propagation: https://whatsmydns.net/#TXT/contact.kyozo.com
4. Contact Resend support: support@resend.com

### "Domain already exists" error

The domain might already be in your Resend account but under a different status. Check https://resend.com/domains first.

### GoDaddy API errors

Make sure your API credentials are correct:
```bash
cat .env | grep GO_DADDY
```

If you don't have API access, use the GoDaddy dashboard manually.

## Quick Fix (If You Need Email NOW)

While waiting for verification, update your code to use `kyozo.space` (already verified):

```bash
# Temporarily use verified domain
export RESEND_FROM="Kyozo <noreply@kyozo.space>"
```

Then retry the community deletion.

After `contact.kyozo.com` is verified, switch back:
```bash
export RESEND_FROM="Kyozo <noreply@contact.kyozo.com>"
```
