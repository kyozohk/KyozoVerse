import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';

function safeString(value: unknown, maxLen = 120) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
}

export async function POST(request: NextRequest) {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const authHeader = request.headers.get('Authorization');
    console.log('[send-email]', JSON.stringify({ requestId, stage: 'start', hasAuthHeader: !!authHeader }));

    // Require authentication
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      console.warn(
        '[send-email]',
        JSON.stringify({
          requestId,
          stage: 'auth_failed',
          hasAuthHeader: !!authHeader,
          authHeaderPrefix: authHeader?.slice(0, 20) || null,
        })
      );
      return authResult.error;
    }

    console.log('[send-email]', JSON.stringify({ requestId, stage: 'auth_ok', uid: authResult.uid }));

    const body = await request.json();
    const { to, from, subject, html, replyTo, communityId, communityHandle, recipientName, recipientEmail } = body;

    console.log(
      '[send-email]',
      JSON.stringify({
        requestId,
        stage: 'body_parsed',
        toCount: Array.isArray(to) ? to.length : to ? 1 : 0,
        toPreview: Array.isArray(to) ? safeString(to[0]) : safeString(to),
        fromPreview: safeString(from),
        subjectPreview: safeString(subject),
        hasHtml: typeof html === 'string' && html.length > 0,
        htmlLength: typeof html === 'string' ? html.length : 0,
        replyToPreview: safeString(replyTo),
        communityId: safeString(communityId),
        communityHandle: safeString(communityHandle),
        recipientEmailPreview: safeString(recipientEmail),
        recipientNamePreview: safeString(recipientName),
      })
    );

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM = process.env.RESEND_FROM;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Use the verified Kyozo domain for sending emails (contact.kyozo.com should be verified on Resend)
    const fromAddress = from || RESEND_FROM || 'Kyozo <noreply@contact.kyozo.com>';

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

    const data = await response.json().catch(() => null);

    console.log(
      '[send-email]',
      JSON.stringify({
        requestId,
        stage: 'resend_response',
        status: response.status,
        ok: response.ok,
        message: data?.message || null,
        name: data?.name || null,
        id: data?.id || null,
      })
    );

    if (!response.ok) {
      console.error('[send-email] Resend API error', JSON.stringify({ requestId, status: response.status, data }));
      
      // If domain not verified, retry with fallback
      const resendMessage = typeof data?.message === 'string' ? data.message : '';
      const isDomainNotVerified = resendMessage.toLowerCase().includes('not verified');
      const isFromDomainError = response.status === 403 && (data?.name === 'validation_error' || isDomainNotVerified);

      if (isFromDomainError) {
        console.log('[send-email] Sender domain not verified, retrying with Resend default sender...');
        const fallbackResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Resend provides this as a verified sender for development/testing.
            // In production you should verify your domain and set RESEND_FROM.
            from: 'Kyozo <onboarding@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            // Avoid setting reply_to to an unverified domain.
          }),
        });
        const fallbackData = await fallbackResponse.json().catch(() => null);

        console.log(
          '[send-email]',
          JSON.stringify({
            requestId,
            stage: 'resend_fallback_response',
            status: fallbackResponse.status,
            ok: fallbackResponse.ok,
            message: fallbackData?.message || null,
            id: fallbackData?.id || null,
          })
        );
        if (!fallbackResponse.ok) {
          return NextResponse.json(
            { error: fallbackData?.message || 'Failed to send email' },
            { status: fallbackResponse.status }
          );
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
        console.error('[send-email] Error storing outgoing message', JSON.stringify({ requestId, err }));
      }
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('[send-email] Unhandled error', JSON.stringify({ requestId, error }));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
