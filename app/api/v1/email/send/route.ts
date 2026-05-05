import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

/**
 * POST /api/v1/email/send
 *
 * Send a transactional email via Resend.
 *
 * Auth: x-api-key (scope: email:send) OR Authorization: Bearer <Firebase ID token>.
 *
 * Body:
 *   to              string | string[]   required
 *   subject         string              required
 *   html            string              required-or-text
 *   text            string              required-or-html
 *   from            string              optional, defaults to RESEND_FROM env or `<communityName|Kyozo> <noreply@contact.kyozo.com>`
 *   replyTo         string              optional; if absent and communityHandle is set, derives `reply@<handle>.kyozo.com`
 *   communityName   string              optional, used in default `from`
 *   communityHandle string              optional, used to derive default `replyTo` and for logging
 *   communityId     string              optional, logged
 *   recipientName   string              optional, logged
 *   recipientEmail  string              optional, logged (provider sends to `to`)
 *
 * Operational safety net: if Resend returns 403 with `validation_error` or "not verified",
 * we transparently retry through Resend's default sender so that first-party app traffic
 * never silently breaks when a custom sending domain has fallen out of verification.
 */

function safeString(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.length > 80 ? `${v.slice(0, 80)}…` : v;
}

export async function POST(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'email:send' });
  if (!auth.ok) return auth.response;

  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json();
    const {
      to,
      from,
      subject,
      html,
      text,
      replyTo,
      communityName,
      communityHandle,
      communityId,
      recipientName,
      recipientEmail,
    } = body || {};

    console.log(
      '[v1/email/send]',
      JSON.stringify({
        requestId,
        stage: 'body_parsed',
        via: auth.via,
        toCount: Array.isArray(to) ? to.length : to ? 1 : 0,
        toPreview: Array.isArray(to) ? safeString(to[0]) : safeString(to),
        subjectPreview: safeString(subject),
        hasHtml: typeof html === 'string' && html.length > 0,
        htmlLength: typeof html === 'string' ? html.length : 0,
        hasText: typeof text === 'string' && text.length > 0,
        replyToPreview: safeString(replyTo),
        communityId: safeString(communityId),
        communityHandle: safeString(communityHandle),
        recipientNamePreview: safeString(recipientName),
        recipientEmailPreview: safeString(recipientEmail),
      })
    );

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to', code: 'MISSING_FIELD', requestId },
        { status: 400 }
      );
    }
    if (!subject) {
      return NextResponse.json(
        { error: 'Missing required field: subject', code: 'MISSING_FIELD', requestId },
        { status: 400 }
      );
    }
    if (!html && !text) {
      return NextResponse.json(
        { error: 'Provide html or text', code: 'MISSING_FIELD', requestId },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_FROM = process.env.RESEND_FROM;
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured', code: 'SERVICE_ERROR', requestId },
        { status: 500 }
      );
    }

    const fromAddress =
      from ||
      RESEND_FROM ||
      `${communityName || 'Kyozo'} <noreply@contact.kyozo.com>`;

    const recipients = Array.isArray(to) ? to : [to];

    const derivedReplyTo =
      replyTo ||
      (communityHandle ? `reply@${communityHandle}.kyozo.com` : 'reply@kyozo.com');

    const buildPayload = (overrides: Partial<{ from: string }> = {}) => {
      const payload: Record<string, unknown> = {
        from: overrides.from ?? fromAddress,
        to: recipients,
        subject,
        reply_to: derivedReplyTo,
      };
      if (html) payload.html = html;
      if (text) payload.text = text;
      return payload;
    };

    const sendOnce = (overrides: Partial<{ from: string }> = {}) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildPayload(overrides)),
      });

    let response = await sendOnce();
    let data = await response.json().catch(() => null);

    console.log(
      '[v1/email/send]',
      JSON.stringify({
        requestId,
        stage: 'resend_response',
        status: response.status,
        ok: response.ok,
        id: data?.id || null,
        name: data?.name || null,
      })
    );

    // Fallback: domain-not-verified -> retry through Resend's default sender.
    if (!response.ok) {
      const resendMessage =
        typeof data?.message === 'string' ? data.message : '';
      const isDomainNotVerified = resendMessage.toLowerCase().includes('not verified');
      const isFromDomainError =
        response.status === 403 &&
        (data?.name === 'validation_error' || isDomainNotVerified);

      if (isFromDomainError) {
        console.log(
          '[v1/email/send]',
          JSON.stringify({ requestId, stage: 'fallback_retry' })
        );
        response = await sendOnce({ from: 'onboarding@resend.dev' });
        data = await response.json().catch(() => null);
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || 'Failed to send email',
          code: 'SEND_FAILED',
          details: data,
          requestId,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      message: `Email sent to ${recipients.length} recipient(s)`,
      requestId,
    });
  } catch (error) {
    console.error('[v1/email/send] error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId,
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/** GET — minimal self-description. The full spec lives at /openapi.yaml. */
export async function GET() {
  return NextResponse.json({
    name: 'Kyozo Email API',
    version: '1.0',
    spec: '/openapi.yaml',
    docs: '/api-docs',
  });
}
