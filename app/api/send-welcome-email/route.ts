import { NextRequest, NextResponse } from 'next/server';
import { getWelcomeEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  console.log('🎉 [WELCOME] Starting send-welcome-email request');
  
  try {
    const body = await request.json();
    const { email, firstName, lastName } = body;
    
    console.log('🎉 [WELCOME] Request body:', { email, firstName, lastName });

    if (!email) {
      console.error('🎉 [WELCOME] ERROR: Email is missing');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    console.log('🎉 [WELCOME] RESEND_API_KEY exists:', !!RESEND_API_KEY);

    if (!RESEND_API_KEY) {
      console.error('🎉 [WELCOME] ERROR: RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate email HTML
    const ownerName = firstName || 'there';
    console.log('🎉 [WELCOME] Generating email for:', ownerName);
    const html = getWelcomeEmail(ownerName);
    console.log('🎉 [WELCOME] Email HTML generated, length:', html.length);

    // Prepare payload
    const emailPayload = {
      from: 'Kyozo <dev@kyozo.com>',
      to: [email],
      subject: `Welcome to Kyozo, ${ownerName}! 🎉`,
      html,
    };
    console.log('🎉 [WELCOME] Email payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
    });

    // Send email via Resend
    console.log('🎉 [WELCOME] Sending email via Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('🎉 [WELCOME] Resend API response status:', response.status);
    const data = await response.json();
    console.log('🎉 [WELCOME] Resend API response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('🎉 [WELCOME] ERROR: Resend API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to send welcome email' },
        { status: response.status }
      );
    }

    console.log('🎉 [WELCOME] SUCCESS: Welcome email sent, ID:', data.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Welcome email sent',
      id: data.id
    });
  } catch (error) {
    console.error('🎉 [WELCOME] FATAL ERROR:', error);
    console.error('🎉 [WELCOME] Error message:', (error as Error).message);
    console.error('🎉 [WELCOME] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
