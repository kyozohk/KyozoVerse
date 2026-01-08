
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { email, firstName, lastName, phone, newsletter, whatsapp } = body;

    if (!email || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('✅ Processing waitlist request for:', email);

    // Encode user data in base64 for the review link
    const userData = {
      email,
      firstName,
      lastName,
      phone,
      newsletter: !!newsletter,
      whatsapp: !!whatsapp,
      timestamp: new Date().toISOString()
    };
    const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');

    // Generate admin review link with encoded data
    const siteUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8003';
    const adminReviewLink = `${siteUrl}/waitlist/review?data=${encodedData}`;
    console.log('\n==== ADMIN REVIEW LINK ====');
    console.log(`Email: ${email}`);
    console.log(`Admin Review Link: ${adminReviewLink}`);
    console.log('===========================\n');
    
    // Send email notification to admin only
    try {
      // Check if SendGrid API key is available
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️ SENDGRID_API_KEY is not defined in environment variables. Skipping email sending.');
        throw new Error('Email service not configured');
      }
      
      // Prepare admin notification email with detailed information
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
            .info-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #6b7280; display: inline-block; width: 120px; }
            .value { color: #1f2937; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .link-box { background: #f3f4f6; padding: 15px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 13px; margin: 15px 0; }
            .preferences { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .preferences h4 { margin: 0 0 10px 0; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 New Waitlist Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone wants to join KyozoVerse!</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">
                A new user has requested access to join <strong>KyozoVerse</strong>. Here are their details:
              </p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #7c3aed;">👤 User Information</h3>
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${firstName} ${lastName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${phone}</span>
                </div>
                <div class="info-row">
                  <span class="label">Requested:</span>
                  <span class="value">${new Date().toLocaleString()}</span>
                </div>
              </div>
              
              ${newsletter || whatsapp ? `
              <div class="preferences">
                <h4>📬 Communication Preferences</h4>
                ${newsletter ? '<p style="margin: 5px 0;">✅ Opted in to CreativeLab newsletter</p>' : ''}
                ${whatsapp ? '<p style="margin: 5px 0;">✅ Agreed to WhatsApp contact</p>' : ''}
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${adminReviewLink}" class="button">
                  📋 Review Waitlist Request
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; text-align: center;">
                Or copy and paste this link to review:
              </p>
              <div class="link-box">${adminReviewLink}</div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                <strong>Next Steps:</strong><br>
                1. Click the review link to open the admin waitlist dashboard<br>
                2. Review the user's information and decide to approve or reject<br>
                3. If approved, the user will receive a registration email automatically
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const adminEmail = process.env.ADMIN_EMAIL || 'dev@kyozo.com';
      console.log(`📧 Sending admin notification email to ${adminEmail}...`);
      
      // Send email to admin with error handling
      const adminEmailResponse = await fetch(`${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL || 'dev@kyozo.com',
          subject: `🎉 New Waitlist Request: ${firstName} ${lastName}`,
          html: adminEmailHtml,
          from: 'noreply@kyozo.com',
          replyTo: process.env.ADMIN_EMAIL || 'dev@kyozo.com',
        }),
      });
      
      if (!adminEmailResponse.ok) {
        const errorText = await adminEmailResponse.text();
        console.error('❌ Admin email API error:', adminEmailResponse.status, errorText);
        throw new Error(`Failed to send admin email: ${adminEmailResponse.status}`);
      }
      
      const adminEmailResult = await adminEmailResponse.json();
      console.log('\n==== ✅ ADMIN EMAIL SENT ====');
      console.log(`To: ${adminEmail}`);
      console.log(`Subject: New Waitlist Request: ${firstName} ${lastName}`);
      console.log(`Result:`, adminEmailResult);
      console.log('============================\n');
    } catch (emailError) {
      // Log email error but don't fail the request
      console.log('\n==== EMAIL SENDING ERROR ====');
      console.error('Error sending email notification:', emailError);
      console.log('============================\n');
    }

    return NextResponse.json({ 
      message: 'Your request has been submitted successfully! Our team will review it and get back to you soon.',
      emailSent: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing access request:', error);
    
    // Provide more detailed error information
    let errorMessage = 'An unexpected error occurred.';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { name: error.name, stack: error.stack };
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
