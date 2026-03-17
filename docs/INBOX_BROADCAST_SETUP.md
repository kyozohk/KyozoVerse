# Kyozo Inbox & Broadcast Email System

## Architecture Overview

```
Community Admin (Broadcast)
        │
        ▼
  /api/send-email  ──────────────►  Resend API
  stores outgoing in Firestore        │
        │                             │ sends email to member
        │                             ▼
  inboxMessages           Member's Inbox (e.g. Gmail/Outlook)
  (direction: outgoing)              │
        │                             │ member clicks Reply
        │                             ▼
        │                    reply@{handle}.kyozo.com
        │                             │ (MX → inbound-smtp.us-east-1.resend.com)
        │                             ▼
        │                      Resend Inbound
        │                             │ fires email.received webhook
        │                             ▼
        │                  /api/inbox/webhook
        │                  stores incoming in Firestore
        │                             │
        ▼                             ▼
  inboxMessages (direction: outgoing + incoming)
        │
        ▼
  /[handle]/inbox  ←── queries by communityHandle, sorted by timestamp
```

---

## DNS Setup Per Community (Auto-configured on creation)

When a community is created via `create-community-dialog.tsx`, `/api/setup-community-domain` is called automatically. It adds these GoDaddy DNS records for `{handle}.kyozo.com`:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT  | `send.{handle}` | `v=spf1 include:amazonses.com ~all` | SPF for outbound |
| MX   | `send.{handle}` | `feedback-smtp.us-east-1.amazonses.com` | Bounce handling |
| MX   | `{handle}` | `inbound-smtp.us-east-1.resend.com` | **Inbound replies** |

And registers `{handle}.kyozo.com` as a sending domain in Resend.

### Example for `aqua-splash` community:
- **Sends from**: `message@aqua-splash.kyozo.com`
- **Reply-To**: `reply@aqua-splash.kyozo.com`
- **MX record**: `aqua-splash.kyozo.com → inbound-smtp.us-east-1.resend.com`

---

## Resend Configuration (One-time manual setup)

### 1. Configure Inbound Webhook in Resend Dashboard
Go to [Resend Webhooks](https://resend.com/webhooks) and ensure your webhook includes the `email.received` event:

- **URL**: `https://pro.kyozo.com/api/inbox/webhook`
- **Events**: ✅ `email.received` (add this if missing)

> The existing webhooks for `email.sent`, `email.delivered` etc. are separate — you need `email.received` for inbound replies.

### 2. Verify Webhook for Local Development (ngrok)
```bash
ngrok http 9003
# Copy the https URL and update it in Resend dashboard temporarily
```

---

## Email Flow Detail

### Outgoing (Broadcast)

1. Admin goes to `/[handle]/broadcast` and sends to selected members
2. `POST /api/send-email` is called with:
   - `communityHandle`: e.g. `aqua-splash`
   - `communityId`: Firestore community document ID
   - `recipientName`, `recipientEmail`
3. Resend sends the email with:
   - **From**: `{Community Name} <message@aqua-splash.kyozo.com>`
   - **Reply-To**: `reply@aqua-splash.kyozo.com`
4. Message is saved to Firestore `inboxMessages` with `direction: 'outgoing'`

### Incoming (Reply)

1. Member clicks Reply in their email client
2. Email goes to `reply@aqua-splash.kyozo.com`
3. MX record routes it to `inbound-smtp.us-east-1.resend.com` (Resend)
4. Resend fires `email.received` webhook to `https://pro.kyozo.com/api/inbox/webhook`
5. Webhook payload format:
   ```json
   {
     "type": "email.received",
     "data": {
       "from": "member@gmail.com",
       "to": ["reply@aqua-splash.kyozo.com"],
       "subject": "Re: Welcome to Aqua Splash",
       "text": "Thanks for the message!",
       "html": "<p>Thanks for the message!</p>"
     }
   }
   ```
6. Webhook extracts `aqua-splash` from `reply@aqua-splash.kyozo.com`
7. Looks up `aqua-splash` community in Firestore
8. Looks up sender by email in `communityMembers`
9. Saves to `inboxMessages` with `direction: 'incoming'`

---

## Firestore Data Model

### Collection: `inboxMessages`

| Field | Type | Description |
|-------|------|-------------|
| `communityHandle` | string | e.g. `aqua-splash` — **primary query field** |
| `communityId` | string | Firestore community doc ID |
| `direction` | `'outgoing'` \| `'incoming'` | Who sent it |
| `type` | `'email'` \| `'whatsapp'` | Channel |
| `senderEmail` | string | For incoming: member's email |
| `senderName` | string | For incoming: member's display name |
| `recipientEmail` | string | For outgoing: member's email |
| `recipientName` | string | For outgoing: member's display name |
| `userId` | string | Firebase user ID of the member |
| `subject` | string | Email subject (Re: stripped) |
| `messageText` | string | Plain text body |
| `htmlContent` | string | HTML body |
| `read` | boolean | `true` for outgoing, `false` for new incoming |
| `timestamp` | Timestamp | Firestore server timestamp |
| `broadcastId` | string | Resend message ID (outgoing only) |

### Firestore Indexes Required

In `firestore.indexes.json`:
```json
{
  "collectionGroup": "inboxMessages",
  "fields": [
    { "fieldPath": "communityHandle", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "inboxMessages",
  "fields": [
    { "fieldPath": "communityHandle", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "ASCENDING" }
  ]
}
```

Deploy with:
```bash
firebase deploy --only firestore:indexes,firestore:rules
```

---

## Firestore Security Rules

```
match /inboxMessages/{messageId} {
  allow read: if request.auth != null;
  allow create: if true;  // Webhook creates messages (no auth)
  allow update: if request.auth != null;
  allow delete: if request.auth != null;
}
```

---

## API Routes

### `POST /api/send-email`
Sends a broadcast email and stores it in `inboxMessages`.

**Body:**
```json
{
  "to": "member@gmail.com",
  "from": "Aqua Splash <message@aqua-splash.kyozo.com>",
  "subject": "Welcome to our community",
  "html": "<p>...</p>",
  "communityHandle": "aqua-splash",
  "communityId": "abc123",
  "recipientName": "John Doe",
  "recipientEmail": "member@gmail.com"
}
```

### `POST /api/inbox/webhook`
Receives inbound email events from Resend. No auth required (webhook).

**Handles two recipient formats:**
- `reply@{handle}.kyozo.com` ← **primary format**
- `inbox+{handle}@kyozo.com` ← legacy format

### `POST /api/setup-community-domain`
Called automatically on community creation. Sets up:
- Resend sending domain for `{handle}.kyozo.com`
- GoDaddy DNS: SPF, MX for outbound, **MX for inbound**

### `POST /api/inbox/test`
Development only. Creates a test message in Firestore for a given community.

---

## Inbox UI (`/[handle]/inbox`)

- Queries `inboxMessages` where `communityHandle == handle`, ordered by `timestamp desc`
- Groups messages by member email into conversations
- Shows unread count badge for incoming messages
- Both outgoing (sent broadcasts) and incoming (replies) appear in the same conversation thread
- Search: filters by member name, email, or phone
- Filter tabs: All / Email / WhatsApp

---

## Testing

### Local Development

```bash
# 1. Start dev server
npm run dev

# 2. Start ngrok (for Resend to call your local webhook)
ngrok http 9003

# 3. Update Resend webhook to use ngrok URL + /api/inbox/webhook

# 4. Test incoming reply simulation
curl -X POST http://localhost:9003/api/inbox/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "member@example.com",
    "to": "reply@aqua-splash@kyozo.com",
    "subject": "Re: Welcome Email",
    "text": "Thanks for the broadcast!"
  }'

# 5. Test outgoing broadcast storage
curl -X POST http://localhost:9003/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "member@example.com",
    "from": "Aqua Splash <message@aqua-splash.kyozo.com>",
    "subject": "Test Broadcast",
    "communityHandle": "aqua-splash",
    "communityId": "YOUR_COMMUNITY_ID",
    "recipientName": "Test Member",
    "html": "<p>Hello!</p>"
  }'
```

### Production Testing
1. Send a broadcast from `/aqua-splash/broadcast`
2. Open the email in the recipient's inbox
3. Click Reply — it should go to `reply@aqua-splash.kyozo.com`
4. The reply appears in `/aqua-splash/inbox` within seconds

---

## Troubleshooting

### Reply bounces with "address not found"
- **Cause**: MX record for `{handle}.kyozo.com` not set up (community created before this fix)
- **Fix**: Call `POST /api/setup-community-domain` with `{ "handle": "aqua-splash" }` to re-run DNS setup

### Messages stored but not appearing in inbox
- **Cause**: Missing Firestore composite index on `communityHandle + timestamp`
- **Fix**: `firebase deploy --only firestore:indexes`

### Webhook not receiving replies
- **Cause**: Resend webhook not configured for `email.received` event
- **Fix**: Go to Resend Dashboard → Webhooks → Edit → enable `email.received`

### Permission denied in browser console
- **Cause**: Firestore rules deny read
- **Fix**: `firebase deploy --only firestore:rules`
