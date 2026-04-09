import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  if (!token || !action) {
    return NextResponse.json({ error: 'Missing token or action' }, { status: 400 });
  }

  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Token format: {rsvpId}_{userId}_{randomString}
  const parts = token.split('_');
  if (parts.length < 3) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
  }

  const rsvpId = parts[0];

  try {
    const rsvpRef = adminDb.collection('rsvps').doc(rsvpId);
    const rsvpSnap = await rsvpRef.get();

    if (!rsvpSnap.exists) {
      return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });
    }

    const rsvpData = rsvpSnap.data()!;
    const members: any[] = rsvpData.members || [];

    const memberIndex = members.findIndex((m: any) => m.rsvpToken === token);
    if (memberIndex === -1) {
      return NextResponse.json({ error: 'Token not found or already used' }, { status: 404 });
    }

    const member = members[memberIndex];
    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    members[memberIndex] = {
      ...member,
      rsvpStatus: newStatus,
      rsvpRespondedAt: new Date().toISOString(),
    };

    await rsvpRef.update({ members });

    return NextResponse.json({
      success: true,
      memberName: member.name,
      rsvpName: rsvpData.name,
      status: newStatus,
    });
  } catch (error) {
    console.error('RSVP confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
