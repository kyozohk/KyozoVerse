
import { NextResponse } from 'next/server';

// Simple in-memory storage for development purposes
// In production, you would use a database
let accessRequests: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    const testInviteLink = `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/invite/${Buffer.from(email).toString('base64')}`;
    console.log('\n==== INVITE LINK GENERATED ====');
    console.log(`Invite Link for ${email}: ${testInviteLink}`);
    console.log('==============================\n');
    
    // Send email notifications
    try {
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
      
      // Send email to admin
      const adminEmailResponse = await fetch(`${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL || 'admin@example.com', // In production, use a real admin email
          subject: 'New KyozoVerse Access Request',
          html: adminEmailHtml,
        }),
      });
      
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
      
      // Send confirmation email to user
      const userEmailResponse = await fetch(`${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Your KyozoVerse Access Request',
          html: userEmailHtml,
        }),
      });
      
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
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
