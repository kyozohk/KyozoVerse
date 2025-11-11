import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
// Note: In production, use environment variables for API keys
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, from = 'dev@kyozo.com' } = body;

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
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
