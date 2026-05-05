import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify a Resend (Svix) webhook signature.
 *
 * Resend signs every inbound webhook with the Svix scheme:
 *   - svix-id:        message id
 *   - svix-timestamp: unix seconds
 *   - svix-signature: "v1,<base64 hmac-sha256>" (space-separated for multiple)
 *
 * The signed payload is the literal string: `${svix-id}.${svix-timestamp}.${rawBody}`
 *
 * Configure RESEND_WEBHOOK_SECRET in env (the "Signing Secret" from the
 * Resend dashboard, format: `whsec_<base64>`).
 */
function verifyResendSignature(rawBody: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[inbox/webhook] RESEND_WEBHOOK_SECRET not configured; rejecting in production.');
      return false;
    }
    return true; // dev only
  }

  const id = headers.get('svix-id') || headers.get('webhook-id');
  const timestamp = headers.get('svix-timestamp') || headers.get('webhook-timestamp');
  const signatureHeader = headers.get('svix-signature') || headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) return false;

  // Reject replays older than 5 minutes
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (ageSec > 5 * 60) {
    console.warn('[inbox/webhook] Webhook timestamp out of tolerance:', ageSec, 's');
    return false;
  }

  const secretBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(secretBase64, 'base64');
  } catch {
    return false;
  }

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  // signatureHeader can be space-separated list: "v1,sig1 v1,sig2"
  const presented = signatureHeader.split(' ').map(p => p.split(',')[1]).filter(Boolean);
  return presented.some(sig => {
    try {
      const a = Buffer.from(sig, 'base64');
      const b = Buffer.from(expected, 'base64');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

function extractEmail(address: string): string {
  const match = address?.match(/<(.+?)>/);
  return match ? match[1] : address;
}

function extractCommunityHandle(toAddress: string): string | null {
  if (!toAddress) return null;
  // Format 1 (primary): reply@{handle}.kyozo.com  →  handle
  const subdomainMatch = toAddress.match(/^[^@]+@([a-zA-Z0-9_-]+)\.kyozo\.com$/i);
  if (subdomainMatch) return subdomainMatch[1];
  // Format 2 (legacy): inbox+{handle}@kyozo.com  →  handle
  const plusMatch = toAddress.match(/inbox\+([a-zA-Z0-9_-]+)@/i);
  if (plusMatch) return plusMatch[1];
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Read body as text first so we can verify the signature against the raw
    // bytes before parsing as JSON.
    const rawBody = await request.text();
    if (!verifyResendSignature(rawBody, request.headers)) {
      console.warn('[inbox/webhook] Rejected POST: invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    const body = rawBody ? JSON.parse(rawBody) : {};
    console.log('📧 Webhook received body:', JSON.stringify(body, null, 2));

    // Handle Resend's email.received event wrapper
    const emailData = body.data || body;
    const from = emailData.from || emailData.sender || body.from;
    const to = emailData.to || emailData.recipient || body.to;
    const subject = emailData.subject || body.subject || '';
    const text = emailData.text || emailData['body-plain'] || body.text || '';
    const html = emailData.html || emailData['body-html'] || body.html || '';

    // Extract plain text
    let messageText = text;
    if (!messageText && html) {
      messageText = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!from || !messageText) {
      console.log('❌ Missing required fields:', { from: !!from, messageText: !!messageText });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const senderEmail = extractEmail(typeof from === 'string' ? from : from?.email || '');
    const recipientAddress = Array.isArray(to) ? to[0] : (typeof to === 'string' ? to : to?.email || '');

    // Step 1: Try to determine communityHandle from the recipient address
    // e.g., inbox+aqua-splash@kyozo.com → aqua-splash
    let communityHandle = extractCommunityHandle(recipientAddress);
    let communityId: string | null = null;

    if (communityHandle) {
      // Look up community by handle
      const communityQuery = await adminDb
        .collection('communities')
        .where('handle', '==', communityHandle)
        .limit(1)
        .get();
      if (!communityQuery.empty) {
        communityId = communityQuery.docs[0].id;
        console.log('✅ Community found from handle:', { communityHandle, communityId });
      }
    }

    // Step 2: Find the sender in communityMembers
    let userId: string | null = null;
    let senderName = senderEmail;

    const membersQuery = await adminDb
      .collection('communityMembers')
      .where('userDetails.email', '==', senderEmail)
      .get();

    if (!membersQuery.empty) {
      // If communityHandle resolved to a communityId, prefer that community's member doc
      const matchingMember = communityId
        ? membersQuery.docs.find(d => d.data().communityId === communityId)
        : null;
      const memberDoc = matchingMember || membersQuery.docs[0];
      const memberData = memberDoc.data();
      userId = memberData.userId;
      senderName = memberData.userDetails?.displayName || senderEmail;
      // If communityId not yet resolved, use sender's community as fallback
      if (!communityId) {
        communityId = memberData.communityId;
        communityHandle = null; // Will be filled below
      }
      console.log('✅ Found member:', { userId, communityId, senderName });
    } else {
      // Fallback: look in users collection
      const usersQuery = await adminDb
        .collection('users')
        .where('email', '==', senderEmail)
        .limit(1)
        .get();
      if (!usersQuery.empty) {
        const userData = usersQuery.docs[0].data();
        userId = usersQuery.docs[0].id;
        senderName = userData.displayName || senderEmail;
      }
    }

    // Step 3: Resolve communityHandle from communityId if still missing
    if (communityId && !communityHandle) {
      const communityDoc = await adminDb.collection('communities').doc(communityId).get();
      if (communityDoc.exists) {
        communityHandle = communityDoc.data()?.handle || null;
      }
    }

    const inReplyTo = body.in_reply_to || body['In-Reply-To'] || emailData.headers?.['in-reply-to'] || null;

    const messageData = {
      senderEmail,
      senderName,
      userId,
      communityId: communityId || null,
      communityHandle: communityHandle || null,
      recipientEmail: recipientAddress || null,
      subject: subject.replace(/^Re:\s*/i, '').trim(),
      messageText,
      htmlContent: html || null,
      direction: 'incoming',
      type: 'email',
      read: false,
      broadcastId: null,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        from: body.from || null,
        to: recipientAddress || null,
        messageId: body.message_id || body['Message-ID'] || emailData.id || null,
        inReplyTo: inReplyTo || null,
      },
    };

    const docRef = await adminDb.collection('inboxMessages').add(messageData);
    console.log(`✅ Inbox message stored: ${docRef.id}`, { senderEmail, communityHandle, communityId });

    return NextResponse.json({
      success: true,
      messageId: docRef.id,
      debug: { senderEmail, senderName, userId, communityId, communityHandle, subject },
    });

  } catch (error: any) {
    console.error('Error processing incoming email:', error);
    return NextResponse.json(
      { error: 'Failed to process email', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to test webhook is working
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    endpoint: '/api/inbox/webhook',
    message: 'Inbox webhook endpoint is ready to receive emails'
  });
}
