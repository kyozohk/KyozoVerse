import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
// Note: In production, use environment variables for API keys
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Check if the API key is defined
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'Email service configuration error' }, { status: 500 });
    }
    
    // Parse the request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Use the verified domain onboard.kyozo.space instead of kyozo.com
    const { to, subject, html, from = 'notifications@onboard.kyozo.space' } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`\n==== SENDING EMAIL VIA RESEND API ====`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`API Key: ${process.env.RESEND_API_KEY ? '✓ Present' : '✗ Missing'}`);
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email via Resend API:', error);
      console.log(`==================================\n`);
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }
    
    console.log(`Email sent successfully! ID: ${data?.id}`);
    console.log(`==================================\n`);

    return NextResponse.json({ 
      message: 'Email sent successfully', 
      id: data?.id 
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing email request:', error);
    
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
