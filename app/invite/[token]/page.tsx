import React from 'react';
import InviteClient from '@/components/auth/invite-client';

interface InvitePageProps {
  params: { token: string };
}

// KYPRO-76: previously this page rendered a hard-coded placeholder form and the real
// `InviteClient` (which verifies the token via /api/verify-invite and renders
// `AcceptInviteForm`) was never mounted. That meant unauthenticated invitees saw a
// dead form and any navigation away dropped them on `/` via AuthProvider, which
// looked like "invite link redirects to homepage". Render the real client here.
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  return <InviteClient token={token} />;
}
