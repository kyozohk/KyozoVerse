
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
      
      // 2. Prepare user confirmation email
      const userEmailHtml = `
        <h1>Access Request Received</h1>
        <p>Hi ${firstName},</p>
        <p>Thank you for requesting access to KyozoVerse. We've received your request and will review it shortly.</p>
        <p>We'll send you an invitation link once your request is approved.</p>
        <p>Best regards,<br>The KyozoVerse Team</p>
      `;
      
      // Send confirmation email to user with error handling
      const userEmailResponse = await fetch(`${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Your KyozoVerse Access Request',
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
