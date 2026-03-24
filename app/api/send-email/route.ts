import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const { to, from, subject, html, replyTo, communityId, communityHandle, recipientName, recipientEmail } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Use the verified Kyozo domain for sending emails (contact.kyozo.com is verified on Resend)
    const fromAddress = from || 'Kyozo <noreply@contact.kyozo.com>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo || (communityHandle ? `reply@${communityHandle}.kyozo.com` : 'reply@kyozo.com'),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      
      // If domain not verified, retry with fallback
      if (data.message && data.message.includes('not verified')) {
        console.log('Domain not verified, retrying with fallback domain...');
        const fallbackResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Kyozo <dev@kyozo.com>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            reply_to: 'reply@kyozo.com',
          }),
        });
        const fallbackData = await fallbackResponse.json();
        if (!fallbackResponse.ok) {
          return NextResponse.json({ error: fallbackData.message }, { status: fallbackResponse.status });
        }
        return NextResponse.json({ success: true, id: fallbackData.id });
      }
      
      return NextResponse.json(
        { error: data.message || 'Failed to send email' },
        { status: response.status }
      );
    }

    // Store outgoing message in Firestore if communityHandle provided
    if (communityHandle || communityId) {
      try {
        const recipients = Array.isArray(to) ? to : [to];
        for (const recipientAddr of recipients) {
          await adminDb.collection('inboxMessages').add({
            senderEmail: fromAddress,
            senderName: communityHandle || 'Community',
            recipientEmail: typeof recipientAddr === 'string' ? recipientAddr : recipientEmail || null,
            recipientName: recipientName || null,
            communityId: communityId || null,
            communityHandle: communityHandle || null,
            subject: subject || '',
            messageText: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500),
            htmlContent: html,
            direction: 'outgoing',
            type: 'email',
            read: true,
            broadcastId: data.id || null,
            timestamp: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            metadata: { resendId: data.id || null },
          });
        }
      } catch (err) {
        console.error('Error storing outgoing message:', err);
      }
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
