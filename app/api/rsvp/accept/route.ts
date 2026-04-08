import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Look up the token
    const tokenDoc = await adminDb.collection('rsvpTokens').doc(token).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({ error: 'Invalid or expired RSVP link' }, { status: 404 });
    }

    const tokenData = tokenDoc.data()!;

    // Check if already accepted
    if (tokenData.status === 'accepted') {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        memberName: tokenData.memberName,
        message: 'You have already accepted this invitation.',
      });
    }

    // Check if expired
    if (tokenData.expiresAt && tokenData.expiresAt.toDate && tokenData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'This RSVP link has expired' }, { status: 410 });
    }

    // Update token status
    await adminDb.collection('rsvpTokens').doc(token).update({
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
    });

    // Update the member in the guestlist
    const guestlistDoc = await adminDb.collection('guestlists').doc(tokenData.guestlistId).get();
    if (guestlistDoc.exists) {
      const guestlistData = guestlistDoc.data()!;
      const members = guestlistData.members || [];
      const updatedMembers = members.map((m: any) => {
        if (m.id === tokenData.memberId || m.userId === tokenData.memberUserId) {
          return {
            ...m,
            rsvpStatus: 'accepted',
            rsvpAcceptedAt: new Date().toISOString(),
            status: 'confirmed',
          };
        }
        return m;
      });

      await adminDb.collection('guestlists').doc(tokenData.guestlistId).update({
        members: updatedMembers,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      memberName: tokenData.memberName,
      guestlistId: tokenData.guestlistId,
    });
  } catch (error: any) {
    console.error('Error accepting RSVP:', error);
    return NextResponse.json({ error: error.message || 'Failed to accept RSVP' }, { status: 500 });
  }
}

// Also support GET for when users click the link directly
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  // Redirect to the RSVP acceptance page
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';
  return NextResponse.redirect(`${siteUrl}/rsvp/${token}`);
}
