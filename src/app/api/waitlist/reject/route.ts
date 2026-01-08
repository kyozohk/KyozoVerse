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

    // Update status to rejected
    await requestRef.update({
      status: 'rejected',
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Waitlist request rejected:', requestId);

    // Optionally send rejection email to user
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️ SENDGRID_API_KEY not configured');
        throw new Error('Email service not configured');
      }

      const siteUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8003';

      const rejectionEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Interest</h1>
            </div>
            <div class="content">
              <div class="message-box">
                <h2 style="margin-top: 0; color: #374151;">Hi ${requestData.firstName},</h2>
                <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                  Thank you for your interest in joining <strong>KyozoVerse</strong>.
                </p>
                <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                  After careful review, we're unable to approve your request at this time. This decision is based on our current capacity and community guidelines.
                </p>
                <p style="font-size: 16px; color: #4a5568; margin-bottom: 20px;">
                  We appreciate your understanding and encourage you to check back with us in the future as we continue to grow and expand our community.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${siteUrl}" class="button">
                    Visit Our Website
                  </a>
                </div>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you have any questions, feel free to reply to this email.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Best regards,<br>
                <strong>The KyozoVerse Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log('📧 Sending rejection notification to user...');

      const emailResponse = await fetch(`${siteUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: requestData.email,
          subject: 'Update on Your KyozoVerse Access Request',
          html: rejectionEmailHtml,
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
      console.log('✅ Rejection email sent:', emailResult);

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({ 
      message: 'Request rejected successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error rejecting request:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
