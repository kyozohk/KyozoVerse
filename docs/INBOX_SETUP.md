# Inbox Setup Guide

This guide explains how to set up the inbox feature to receive email replies from broadcast messages.

## Overview

The inbox feature captures email replies from members and displays them in a searchable interface at `/[handle]/inbox`.

## Architecture

### Firestore Collection: `inboxMessages`

Each incoming email is stored with the following structure:

```typescript
{
  senderEmail: string;          // Email address of the sender
  senderName: string;            // Display name of the sender
  userId?: string;               // Firebase user ID (if matched)
  communityId?: string;          // Community ID (if matched)
  recipientEmail: string;        // Email address that received the message
  subject: string;               // Email subject (without "Re:")
  messageText: string;           // Plain text content
  htmlContent?: string;          // HTML content (optional)
  direction: 'incoming';         // Always 'incoming' for webhook
  type: 'email';                 // Message type
  read: boolean;                 // Read status
  broadcastId?: string;          // Reference to original broadcast (if reply)
  timestamp: Timestamp;          // When message was received
  metadata: {                    // Raw email headers
    from: string;
    to: string;
    messageId: string;
    inReplyTo?: string;
  }
}
```

## Webhook Endpoint

**URL:** `https://yourdomain.com/api/inbox/webhook`

**Method:** `POST`

**Purpose:** Receives incoming emails from your email provider

## Setup Instructions

### Option 1: Resend (Recommended)

1. **Configure Inbound Email Domain**
   - Go to [Resend Dashboard](https://resend.com/domains)
   - Add your domain and verify DNS records
   - Enable inbound email parsing

2. **Set Up Webhook**
   - In Resend dashboard, go to Webhooks
   - Add new webhook: `https://yourdomain.com/api/inbox/webhook`
   - Select event: `email.received`

3. **Configure Reply-To Address**
   When sending broadcasts, set the `Reply-To` header to an address on your verified domain:
   ```typescript
   from: 'Kyozo <noreply@kyozo.com>',
   replyTo: 'inbox@kyozo.com',  // This should route to webhook
   ```

### Option 2: SendGrid Inbound Parse

1. **Set Up Inbound Parse**
   - Go to SendGrid Settings → Inbound Parse
   - Add your subdomain (e.g., `inbox.yourdomain.com`)
   - Set destination URL: `https://yourdomain.com/api/inbox/webhook`

2. **Configure DNS**
   Add MX records for your subdomain:
   ```
   inbox.yourdomain.com  MX  10  mx.sendgrid.net
   ```

3. **Update Broadcast Emails**
   Set reply-to address:
   ```typescript
   replyTo: 'replies@inbox.yourdomain.com'
   ```

### Option 3: Mailgun Inbound Routes

1. **Create Route**
   - Go to Mailgun Routes
   - Add route with pattern: `match_recipient("inbox@yourdomain.com")`
   - Action: Forward to `https://yourdomain.com/api/inbox/webhook`

2. **Configure DNS**
   Add MX records as specified by Mailgun

## Testing the Webhook

### 1. Test Endpoint Availability
```bash
curl https://yourdomain.com/api/inbox/webhook
```

Expected response:
```json
{
  "status": "active",
  "endpoint": "/api/inbox/webhook",
  "message": "Inbox webhook endpoint is ready to receive emails"
}
```

### 2. Send Test Email

Send an email to your configured inbox address (e.g., `inbox@yourdomain.com`) with:
- **From:** A member's email address
- **Subject:** Test Reply
- **Body:** This is a test message

### 3. Verify in Firestore

Check the `inboxMessages` collection for the new document.

### 4. View in Inbox

Navigate to `http://localhost:9003/[community-handle]/inbox` and verify:
- Conversation appears in left sidebar
- Message displays when conversation is selected
- Search functionality works

## Features

### 1. Conversation Grouping
Messages are automatically grouped by sender into conversations.

### 2. Search Functionality
- **Conversation Search:** Filter conversations by name, email, or phone
- **Message Search:** Search within messages by content, subject, or sender

### 3. Filter by Type
- **All:** Show all messages
- **Email:** Show only email messages
- **WhatsApp:** Show only WhatsApp messages (future)

### 4. Auto-Read Marking
Messages are automatically marked as read when viewed.

### 5. Unread Count
Conversations show unread message count badges.

## Firestore Indexes Required

Create these composite indexes in Firestore:

```
Collection: inboxMessages
Fields: communityId (Ascending), timestamp (Descending)

Collection: inboxMessages  
Fields: communityId (Ascending), timestamp (Ascending)
```

## Security Considerations

1. **Webhook Authentication**
   - Consider adding webhook signature verification
   - Validate sender email addresses
   - Rate limit the webhook endpoint

2. **Spam Prevention**
   - Implement sender verification
   - Add spam filtering logic
   - Limit message size

3. **Data Privacy**
   - Store only necessary email content
   - Implement data retention policies
   - Comply with GDPR/privacy regulations

## Troubleshooting

### Messages Not Appearing

1. Check webhook endpoint is accessible
2. Verify DNS records are correct
3. Check Firestore security rules allow writes
4. Review server logs for errors

### Wrong Sender Matching

1. Verify email addresses match in `communityMembers`
2. Check `userDetails.email` field format
3. Ensure case-insensitive matching

### Search Not Working

1. Verify Firestore indexes are created
2. Check search term is not empty
3. Review filter logic in code

## Next Steps

1. **Add Outgoing Messages:** Store sent broadcasts in `inboxMessages` with `direction: 'outgoing'`
2. **Thread Detection:** Improve reply threading using `In-Reply-To` headers
3. **Attachments:** Support file attachments in emails
4. **Rich Text:** Display HTML emails with proper formatting
5. **Notifications:** Add real-time notifications for new messages
6. **Reply Functionality:** Allow sending replies directly from inbox

## Support

For issues or questions, contact the development team.
