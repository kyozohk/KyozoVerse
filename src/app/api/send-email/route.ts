
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set the SendGrid API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(request: Request) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'Email service configuration error' }, { status: 500 });
    }
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { to, subject, html, from = 'notifications@onboard.kyozo.space' } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`\n==== SENDING EMAIL VIA SENDGRID API ====`);
    console.log(`From: ${from}`);
    console.log(`To: ${Array.isArray(to) ? `${to.length} recipients` : to}`);
    console.log(`Subject: ${subject}`);
    
    const msg = {
      to,
      from,
      subject,
      html,
    };

    const [response] = await sgMail.send(msg);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`Email sent successfully! Status code: ${response.statusCode}`);
      console.log(`==================================\n`);
      return NextResponse.json({ 
        message: 'Email sent successfully', 
        id: response.headers['x-message-id'] 
      }, { status: 200 });
    } else {
      console.error('Error sending email via SendGrid API:', response.body);
      console.log(`==================================\n`);
      return NextResponse.json({ error: 'Failed to send email', details: response.body }, { status: response.statusCode });
    }

  } catch (error: any) {
    console.error('Error processing email request:', error);
    
    let errorMessage = 'An unexpected error occurred.';
    let errorDetails = {};
    
    if (error.response) {
      errorMessage = 'SendGrid API Error';
      errorDetails = error.response.body;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { name: error.name, stack: error.stack };
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
