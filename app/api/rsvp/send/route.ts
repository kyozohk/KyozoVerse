import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(idToken);

    const { guestlistId, guestlistName, eventName, eventDate, eventTime, eventLocation, communityId, communityName } = await req.json();

    if (!guestlistId) {
      return NextResponse.json({ error: 'guestlistId is required' }, { status: 400 });
    }

    // Get the guestlist
    const guestlistDoc = await adminDb.collection('guestlists').doc(guestlistId).get();
    if (!guestlistDoc.exists) {
      return NextResponse.json({ error: 'Guestlist not found' }, { status: 404 });
    }

    const guestlistData = guestlistDoc.data()!;
    const members = guestlistData.members || [];
    const membersWithEmail = members.filter((m: any) => m.email);

    if (membersWithEmail.length === 0) {
      return NextResponse.json({ error: 'No members with email addresses found' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';
    let sentCount = 0;
    const updatedMembers = [...members];

    for (let i = 0; i < updatedMembers.length; i++) {
      const member = updatedMembers[i];
      if (!member.email) continue;

      // Generate unique RSVP token
      const token = crypto.randomBytes(32).toString('hex');

      // Store token in Firestore
      await adminDb.collection('rsvpTokens').doc(token).set({
        guestlistId,
        memberId: member.id,
        memberUserId: member.userId,
        memberEmail: member.email,
        memberName: member.name,
        communityId,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Update member's RSVP status
      updatedMembers[i] = {
        ...member,
        rsvpStatus: 'pending',
        rsvpToken: token,
        rsvpSentAt: new Date().toISOString(),
      };

      // Format date for email
      const formattedDate = eventDate
        ? new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';

      const acceptUrl = `${siteUrl}/rsvp/${token}`;

      // Send RSVP email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background-color: #F5F0E8;">
            <div style="max-width: 520px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <div style="background-color: #5B4A3A; padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">You're Invited!</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #5B4A3A; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
                  Hi <strong>${member.name}</strong>,
                </p>
                <p style="color: #6B5D52; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  You've been invited to <strong>${eventName || guestlistName}</strong>${communityName ? ` by ${communityName}` : ''}.
                </p>
                ${formattedDate || eventTime || eventLocation ? `
                <div style="background-color: #FAF8F5; border: 1px solid #E8DFD1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  ${formattedDate ? `<p style="color: #5B4A3A; margin: 0 0 8px 0; font-size: 14px;">📅 <strong>${formattedDate}</strong>${eventTime ? ` at ${eventTime}` : ''}</p>` : ''}
                  ${eventLocation ? `<p style="color: #5B4A3A; margin: 0; font-size: 14px;">📍 <strong>${eventLocation}</strong></p>` : ''}
                </div>
                ` : ''}
                <p style="color: #6B5D52; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  Please let us know if you can make it by clicking the button below:
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${acceptUrl}" style="display: inline-block; background-color: #E07B39; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #8B7355; font-size: 12px; text-align: center; margin: 0;">
                  If the button doesn't work, copy and paste this link: <br/>
                  <a href="${acceptUrl}" style="color: #E07B39;">${acceptUrl}</a>
                </p>
              </div>
              <div style="background-color: #FAF8F5; padding: 16px; text-align: center; border-top: 1px solid #E8DFD1;">
                <p style="color: #8B7355; font-size: 12px; margin: 0;">Sent via Kyozo</p>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: communityName ? `${communityName} <noreply@contact.kyozo.com>` : 'Kyozo <noreply@contact.kyozo.com>',
            to: [member.email],
            subject: `You're invited to ${eventName || guestlistName}!`,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          console.error(`Failed to send RSVP to ${member.email}:`, await response.text());
        }
      } catch (emailError) {
        console.error(`Error sending RSVP to ${member.email}:`, emailError);
      }
    }

    // Update guestlist with RSVP status and updated members
    await adminDb.collection('guestlists').doc(guestlistId).update({
      isRsvp: true,
      members: updatedMembers,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, sentCount, totalWithEmail: membersWithEmail.length });
  } catch (error: any) {
    console.error('Error sending RSVP:', error);
    return NextResponse.json({ error: error.message || 'Failed to send RSVP' }, { status: 500 });
  }
}
