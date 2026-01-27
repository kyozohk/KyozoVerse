import { NextRequest, NextResponse } from 'next/server';

// API Key validation - in production, store this in environment variables
const validateApiKey = (apiKey: string | null): boolean => {
  const validApiKey = process.env.KYOZO_API_KEY;
  if (!validApiKey) {
    console.warn('KYOZO_API_KEY not configured - API key validation disabled');
    return true; // Allow requests if no API key is configured (dev mode)
  }
  return apiKey === validApiKey;
};

export async function POST(request: NextRequest) {
  try {
    // Validate API key from header
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, from, subject, html, text, replyTo, communityName } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Missing required field: subject', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (!html && !text) {
      return NextResponse.json(
        { error: 'Missing required field: html or text', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured', code: 'SERVICE_ERROR' },
        { status: 500 }
      );
    }

    // Use the provided 'from' address or default to verified Kyozo domain
    // Format: "Name <email@domain.com>" or just "email@domain.com"
    const fromAddress = from || `${communityName || 'Kyozo'} <dev@contact.kyozo.com>`;

    // Prepare recipients - can be string or array
    const recipients = Array.isArray(to) ? to : [to];

    // Build email payload
    const emailPayload: any = {
      from: fromAddress,
      to: recipients,
      subject,
    };

    if (html) {
      emailPayload.html = html;
    }

    if (text) {
      emailPayload.text = text;
    }

    if (replyTo) {
      emailPayload.reply_to = replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return NextResponse.json(
        { 
          error: data.message || 'Failed to send email', 
          code: 'SEND_FAILED',
          details: data 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: data.id,
      message: `Email sent successfully to ${recipients.length} recipient(s)`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    name: 'Kyozo Email API',
    version: '1.0',
    description: 'Send emails via Kyozo platform',
    endpoints: {
      'POST /api/v1/email/send': {
        description: 'Send an email',
        headers: {
          'x-api-key': 'Your Kyozo API key (required)',
          'Content-Type': 'application/json'
        },
        body: {
          to: 'string | string[] (required) - Recipient email(s)',
          subject: 'string (required) - Email subject',
          html: 'string - HTML content (required if text not provided)',
          text: 'string - Plain text content (required if html not provided)',
          from: 'string (optional) - Sender address, defaults to Kyozo',
          replyTo: 'string (optional) - Reply-to address',
          communityName: 'string (optional) - Community name for sender'
        },
        response: {
          success: 'boolean',
          id: 'string - Email ID from provider',
          message: 'string - Success message'
        },
        errors: {
          401: 'Invalid or missing API key',
          400: 'Missing required fields',
          500: 'Server error'
        }
      }
    },
    documentation: 'https://pro.kyozo.com/docs/api/email'
  });
}
