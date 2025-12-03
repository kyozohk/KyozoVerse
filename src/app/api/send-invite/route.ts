
import { NextResponse } from 'next/server';

// Simple in-memory storage for development purposes
// In production, you would use a database
let accessRequests: any[] = [];

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
    
    // Check if the request already exists
    const existingRequest = accessRequests.find(req => req.email === email);
    if (existingRequest) {
      return NextResponse.json({ message: 'You have already requested access.' }, { status: 200 });
    }

    // Add request to in-memory storage
    const newRequest = {
      id: Date.now().toString(),
      email,
      firstName,
      lastName,
      phone,
      newsletter: !!newsletter,
      whatsapp: !!whatsapp,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    accessRequests.push(newRequest);
    console.log('New access request:', newRequest);

    // Generate invite link for testing
    // Use btoa for base64 encoding (no need for Buffer in browser context)
    const base64Email = btoa(email);
    const testInviteLink = `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/invite/${base64Email}`;
    console.log('\n==== INVITE LINK GENERATED ====');
    console.log(`Email: ${email}`);
    console.log(`Base64 encoded: ${base64Email}`);
    console.log(`Invite Link: ${testInviteLink}`);
    console.log('==============================\n');
    
    // Send email notifications
    try {
      // Check if Resend API key is available
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not defined in environment variables. Skipping email sending.');
        throw new Error('Email service not configured');
      }
      
      // 1. Prepare admin notification email
      const adminEmailHtml = `
        <h1>New Access Request</h1>
        <p>A new user has requested access to join KyozoVerse:</p>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
        </ul>
        <p>Use this invite link to grant them access:</p>
        <p><a href="${testInviteLink}">${testInviteLink}</a></p>
      `;
      
      // Send email to admin with error handling
      const adminEmailResponse = await fetch(`${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL || 'admin@example.com', // In production, use a real admin email
          subject: 'New KyozoVerse Access Request',
          html: adminEmailHtml,
          from: 'notifications@onboard.kyozo.space',
        }),
      });
      
      if (!adminEmailResponse.ok) {
        const errorText = await adminEmailResponse.text();
        console.error('Admin email API error:', adminEmailResponse.status, errorText);
        throw new Error(`Failed to send admin email: ${adminEmailResponse.status}`);
      }
      
      const adminEmailResult = await adminEmailResponse.json();
      console.log('\n==== ADMIN EMAIL SENT ====');
      console.log(`To: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
      console.log(`Subject: New KyozoVerse Access Request`);
      console.log(`Result:`, adminEmailResult);
      console.log('=========================\n');
      
      // 2. Prepare user welcome email with login link
      const siteUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://kyozoverse.com';
      const logoUrl = `${siteUrl}/logo.png`;
      
      const userEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6; 
              color: #1a1a1a;
              background-color: rgba(0, 0, 0, 0.08);
              padding: 20px;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 35%, #0ea5e9 60%, #10b981 100%);
              padding: 50px 30px;
              text-align: center;
            }
            .logo { 
              width: 120px; 
              height: auto; 
              margin-bottom: 20px;
              filter: brightness(0) invert(1);
            }
            .hero-title {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 42px;
              font-weight: 600;
              color: white;
              line-height: 1.2;
              margin: 20px 0;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            .hero-subtitle {
              font-size: 18px;
              color: rgba(255, 255, 255, 0.95);
              margin-top: 10px;
            }
            .content { 
              padding: 40px 30px;
              background: white;
            }
            .greeting {
              font-size: 20px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 20px;
            }
            .text-block {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 20px;
              line-height: 1.7;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button { 
              display: inline-block;
              background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
              transition: all 0.3s ease;
            }
            .button:hover { 
              background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
              box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
              transform: translateY(-2px);
            }
            .link-box {
              background: #f7fafc;
              border: 2px dashed #cbd5e0;
              padding: 15px;
              border-radius: 8px;
              word-break: break-all;
              font-size: 13px;
              color: #4a5568;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .features-list {
              background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
              border-left: 4px solid #7c3aed;
              padding: 20px 25px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .features-list ul {
              list-style: none;
              padding: 0;
            }
            .features-list li {
              padding: 8px 0;
              color: #2d3748;
              font-size: 15px;
              position: relative;
              padding-left: 25px;
            }
            .features-list li:before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #10b981;
              font-weight: bold;
              font-size: 18px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
              margin: 30px 0;
            }
            .footer { 
              background: #1a202c;
              color: #a0aec0;
              text-align: center;
              padding: 30px;
              font-size: 14px;
            }
            .footer-logo {
              width: 80px;
              height: auto;
              margin-bottom: 15px;
              opacity: 0.7;
            }
            .footer a {
              color: #7c3aed;
              text-decoration: none;
            }
            .social-links {
              margin-top: 20px;
            }
            .social-links a {
              display: inline-block;
              margin: 0 10px;
              color: #a0aec0;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <!-- Header with Hero Styling -->
            <div class="header">
              <img src="${logoUrl}" alt="Kyozo Logo" class="logo" />
              <h1 class="hero-title">Welcome to Your<br/>Creative Universe</h1>
              <p class="hero-subtitle">Your journey begins here 🚀</p>
            </div>
            
            <!-- Main Content -->
            <div class="content">
              <div class="greeting">Hi ${firstName}! 👋</div>
              
              <p class="text-block">
                Thank you for joining the <strong>KyozoVerse</strong> waitlist! We're thrilled to have you as part of our creative community.
              </p>
              
              <p class="text-block">
                Your account is ready, and you can now log in to start building your community and connecting with fellow creators.
              </p>
              
              <!-- CTA Button -->
              <div class="cta-container">
                <a href="${testInviteLink}" class="button">🎨 Login & Setup Your Community</a>
              </div>
              
              <p class="text-block" style="text-align: center; font-size: 14px; color: #718096;">
                Or copy and paste this link into your browser:
              </p>
              <div class="link-box">${testInviteLink}</div>
              
              <div class="divider"></div>
              
              <!-- Features -->
              <div class="features-list">
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
              
              <p class="text-block">
                If you have any questions or need assistance getting started, our team is here to help. Just reply to this email!
              </p>
              
              <p class="text-block" style="margin-top: 30px;">
                Best regards,<br>
                <strong style="background: linear-gradient(90deg, #7c3aed, #4f46e5, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">The KyozoVerse Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <img src="${logoUrl}" alt="Kyozo Logo" class="footer-logo" />
              <p style="margin-bottom: 10px;">© ${new Date().getFullYear()} KyozoVerse. All rights reserved.</p>
              <p style="font-size: 12px; color: #718096;">
                Connecting the Cultural Industries
              </p>
              <div class="social-links">
                <a href="#">Twitter</a> • 
                <a href="#">Instagram</a> • 
                <a href="#">LinkedIn</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Send confirmation email to user with error handling
      const userEmailResponse = await fetch(`${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Welcome to KyozoVerse - Login & Setup Your Community',
          html: userEmailHtml,
          from: 'notifications@onboard.kyozo.space',
        }),
      });
      
      if (!userEmailResponse.ok) {
        const errorText = await userEmailResponse.text();
        console.error('User email API error:', userEmailResponse.status, errorText);
        throw new Error(`Failed to send user email: ${userEmailResponse.status}`);
      }
      
      const userEmailResult = await userEmailResponse.json();
      console.log('\n==== USER EMAIL SENT ====');
      console.log(`To: ${email}`);
      console.log(`Subject: Your KyozoVerse Access Request`);
      console.log(`Result:`, userEmailResult);
      console.log('========================\n');
    } catch (emailError) {
      // Log email error but don't fail the request
      console.log('\n==== EMAIL SENDING ERROR ====');
      console.error('Error sending email notification:', emailError);
      console.log('============================\n');
    }

    return NextResponse.json({ 
      message: 'Your request has been submitted successfully!',
      requestId: newRequest.id,
      testInviteLink, // Include the test invite link in the response
      emailSent: true, // Indicate that emails were sent
      emailDetails: {
        adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
        userEmail: email
      }
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
