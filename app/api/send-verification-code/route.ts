import { NextRequest, NextResponse } from 'next/server';
import { getVerificationEmail } from '@/lib/email-templates';
import { db as adminDb } from '@/firebase/admin';
import { checkRateLimit } from '@/lib/api-auth';

// Generate a random 4-digit code
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  console.log('📧 [VERIFICATION] Starting send-verification-code request');

  // Rate limit: max 5 verification requests per minute per IP
  const rateLimitResponse = checkRateLimit(request, 5, 60000);
  if (rateLimitResponse) return rateLimitResponse;
  
  try {
    const body = await request.json();
    const { email, firstName } = body;
    
    console.log('📧 [VERIFICATION] Request body:', { email, firstName });

    if (!email) {
      console.error('📧 [VERIFICATION] ERROR: Email is missing from request');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    console.log('📧 [VERIFICATION] RESEND_API_KEY exists:', !!RESEND_API_KEY);
    console.log('📧 [VERIFICATION] RESEND_API_KEY length:', RESEND_API_KEY?.length || 0);

    if (!RESEND_API_KEY) {
      console.error('📧 [VERIFICATION] ERROR: RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('📧 [VERIFICATION] Generated code:', code, 'Expires at:', expiresAt.toISOString());

    // Store verification code in Firestore
    console.log('📧 [VERIFICATION] Storing code in Firestore for email:', email);
    try {
      const verificationRef = adminDb.collection('emailVerifications').doc(email);
      await verificationRef.set({
        code,
        email,
        expiresAt,
        createdAt: new Date(),
        verified: false,
      });
      console.log('📧 [VERIFICATION] Successfully stored code in Firestore');
    } catch (firestoreError) {
      console.error('📧 [VERIFICATION] ERROR storing in Firestore:', firestoreError);
      throw firestoreError;
    }

    // Generate email HTML
    const recipientName = firstName || 'there';
    console.log('📧 [VERIFICATION] Generating email HTML for recipient:', recipientName);
    const html = getVerificationEmail(recipientName, code);
    console.log('📧 [VERIFICATION] Email HTML generated, length:', html.length);

    // Prepare email payload
    const emailPayload = {
      from: 'Kyozo <dev@kyozo.com>',
      to: [email],
      subject: `${code} is your Kyozo verification code`,
      html,
    };
    console.log('📧 [VERIFICATION] Email payload (without html):', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      htmlLength: emailPayload.html.length,
    });

    // Send email via Resend
    console.log('📧 [VERIFICATION] Sending email via Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📧 [VERIFICATION] Resend API response status:', response.status);
    console.log('📧 [VERIFICATION] Resend API response ok:', response.ok);

    const data = await response.json();
    console.log('📧 [VERIFICATION] Resend API response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('📧 [VERIFICATION] ERROR: Resend API returned error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      return NextResponse.json(
        { error: data.message || 'Failed to send verification email' },
        { status: response.status }
      );
    }

    console.log('📧 [VERIFICATION] SUCCESS: Email sent successfully, Resend ID:', data.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent',
      emailId: data.id,
      // Don't expose the code in production, only for debugging
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    console.error('📧 [VERIFICATION] FATAL ERROR:', error);
    console.error('📧 [VERIFICATION] Error name:', (error as Error).name);
    console.error('📧 [VERIFICATION] Error message:', (error as Error).message);
    console.error('📧 [VERIFICATION] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
