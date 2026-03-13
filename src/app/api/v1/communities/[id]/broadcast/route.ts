import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

async function POST(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);
  if (communitySnap.data()!.ownerId !== ctx.ownerId) return apiError('Forbidden.', 403);

  const body = await req.json().catch(() => ({}));
  const { subject, html, from, replyTo } = body;

  if (!subject || !html) return apiError('subject and html are required.', 400);

  const membersSnap = await adminDb.collection('communityMembers')
    .where('communityId', '==', params.id)
    .where('status', '==', 'active')
    .get();

  const emails = membersSnap.docs
    .map(d => d.data().userDetails?.email)
    .filter((e): e is string => !!e);

  if (!emails.length) return apiError('No members with email addresses found.', 400);

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';
  const emailRes = await fetch(`${origin}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: emails,
      subject,
      html,
      from: from || `${communitySnap.data()!.name} <dev@kyozo.com>`,
      replyTo: replyTo || undefined,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.json().catch(() => ({}));
    return apiError('Email send failed.', 502, err);
  }

  return apiSuccess({
    sent: true,
    recipientCount: emails.length,
    subject,
    communityId: params.id,
  });
}

export const POST_h = withApiAuth(POST, ['broadcast:send']);
export { POST_h as POST };
