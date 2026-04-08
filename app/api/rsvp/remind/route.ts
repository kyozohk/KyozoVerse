import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(idToken);

    const { guestlistId, memberIds, communityName } = await req.json();

    if (!guestlistId) {
      return NextResponse.json({ error: 'guestlistId is required' }, { status: 400 });
    }

    // Get guestlist
    const guestlistDoc = await adminDb.collection('guestlists').doc(guestlistId).get();
    if (!guestlistDoc.exists) {
      return NextResponse.json({ error: 'Guestlist not found' }, { status: 404 });
    }

    const guestlistData = guestlistDoc.data()!;
    const members = guestlistData.members || [];
    const eventName = guestlistData.eventName || guestlistData.name;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';
    let sentCount = 0;

    // Filter members to remind (either specific memberIds or all pending)
    const membersToRemind = members.filter((m: any) => {
      if (!m.email || !m.rsvpToken) return false;
      if (m.rsvpStatus === 'accepted') return false;
      if (memberIds && memberIds.length > 0) {
        return memberIds.includes(m.id) || memberIds.includes(m.userId);
      }
      return true; // remind all pending if no specific IDs
    });

    for (const member of membersToRemind) {
      const acceptUrl = `${siteUrl}/rsvp/${member.rsvpToken}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background-color: #F5F0E8;">
            <div style="max-width: 520px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <div style="background-color: #E07B39; padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Friendly Reminder</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #5B4A3A; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
                  Hi <strong>${member.name}</strong>,
                </p>
                <p style="color: #6B5D52; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  Just a friendly reminder that you've been invited to <strong>${eventName}</strong>${communityName ? ` by ${communityName}` : ''}. We haven't heard back from you yet!
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
            subject: `Reminder: You're invited to ${eventName}!`,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          sentCount++;
        }
      } catch (emailError) {
        console.error(`Error sending reminder to ${member.email}:`, emailError);
      }
    }

    // Update reminder timestamp on the guestlist
    await adminDb.collection('guestlists').doc(guestlistId).update({
      lastReminderSentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, sentCount, totalReminded: membersToRemind.length });
  } catch (error: any) {
    console.error('Error sending RSVP reminders:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reminders' }, { status: 500 });
  }
}
