import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

// Store incoming emails in memory (in production, use a database)
const incomingEmails: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📧 Received webhook:', body);

    // Verify this is from Resend (you should verify the signature in production)
    const eventType = body.type;
    
    if (eventType === 'email.received') {
      const emailData = body.data;
      
      // Extract email details
      const email = {
        id: emailData.id,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        created_at: emailData.created_at,
        // Get full email content
        text: emailData.text,
        html: emailData.html,
        headers: emailData.headers
      };

      // Store the email
      incomingEmails.push(email);
      
      console.log(`📧 New email received from ${email.from} to ${email.to}`);
      
      // Extract domain from "to" address
      const toAddress = email.to;
      const domain = toAddress.split('@')[1];
      
      // If this is a reply to willer.kyozo.com, you can process it here
      if (domain === 'willer.kyozo.com') {
        console.log('📧 Processing reply for willer.kyozo.com');
        
        // Here you would typically:
        // 1. Find the conversation this reply belongs to
        // 2. Store it in your database
        // 3. Notify the community owner
        // 4. Optionally forward to their personal email
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email received and processed',
        email_id: email.id 
      });
    }
    
    // Handle other webhook events
    console.log(`📧 Received webhook event: ${eventType}`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to view stored emails (for testing)
export async function GET() {
  return NextResponse.json({
    emails: incomingEmails,
    count: incomingEmails.length
  });
}
