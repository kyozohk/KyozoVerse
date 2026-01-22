import { NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Get the waitlist request
    const requestRef = db.collection('waitlist').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    
    if (requestData?.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    // Update status to approved
    await requestRef.update({
      status: 'approved',
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Waitlist request approved:', requestId);

    // Generate registration link
    const siteUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8003';
    const base64Email = Buffer.from(requestData.email).toString('base64');
    const registrationLink = `${siteUrl}/invite/${base64Email}`;

    // Send registration email to user
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️ SENDGRID_API_KEY not configured');
        throw new Error('Email service not configured');
      }

      const userEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 35%, #0ea5e9 60%, #10b981 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 32px; }
            .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 8px 8px; }
            .welcome-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
            .link-box { background: #f3f4f6; padding: 15px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 13px; margin: 15px 0; }
            .features { background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-left: 4px solid #7c3aed; padding: 20px 25px; border-radius: 8px; margin: 25px 0; }
            .features ul { list-style: none; padding: 0; }
            .features li { padding: 8px 0; position: relative; padding-left: 25px; }
            .features li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to KyozoVerse!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your request has been approved</p>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2 style="margin-top: 0; color: #7c3aed;">Hi ${requestData.firstName}! 👋</h2>
                <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                  Great news! Your request to join <strong>KyozoVerse</strong> has been approved. You can now create your account and start building your community.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${registrationLink}" class="button">
                    🚀 Complete Registration
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  Or copy and paste this link into your browser:
                </p>
                <div class="link-box">${registrationLink}</div>
              </div>
              
              <div class="features">
                <p style="font-weight: 600; color: #2d3748; margin-bottom: 15px; font-size: 16px;">
                  🌟 What you can do with KyozoVerse:
                </p>
                <ul>
                  <li>Create and customize your unique community space</li>
                  <li>Invite members and build your creative network</li>
                  <li>Share posts, updates, and engage with your audience</li>
                  <li>Manage community settings and member roles</li>
                  <li>Connect with other creators across the platform</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you have any questions or need assistance, our team is here to help. Just reply to this email!
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Best regards,<br>
                <strong style="background: linear-gradient(90deg, #7c3aed, #4f46e5, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">The KyozoVerse Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log('📧 Sending registration email to user...');

      const emailResponse = await fetch(`${siteUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: requestData.email,
          subject: '🎉 Welcome to KyozoVerse - Complete Your Registration',
          html: userEmailHtml,
          from: 'noreply@kyozo.com',
          replyTo: 'dev@kyozo.com',
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('❌ Email API error:', emailResponse.status, errorText);
        throw new Error(`Failed to send email: ${emailResponse.status}`);
      }

      const emailResult = await emailResponse.json();
      console.log('✅ Registration email sent:', emailResult);

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ 
      message: 'Request approved successfully',
      registrationLink
    }, { status: 200 });

  } catch (error) {
    console.error('Error approving request:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
