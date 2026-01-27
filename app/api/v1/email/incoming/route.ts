import { NextRequest, NextResponse } from 'next/server';

// API Key validation
const validateApiKey = (apiKey: string | null): boolean => {
  const validApiKey = process.env.KYOZO_API_KEY;
  if (!validApiKey) {
    console.warn('KYOZO_API_KEY not configured - API key validation disabled');
    return true; // Allow requests if no API key is configured (dev mode)
  }
  return apiKey === validApiKey;
}

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');
    const domain = searchParams.get('domain');

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured', code: 'SERVICE_ERROR' },
        { status: 500 }
      );
    }

    // If emailId is provided, fetch specific email
    if (emailId) {
      const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
          { error: error.message || 'Failed to fetch email', code: 'FETCH_FAILED' },
          { status: response.status }
        );
      }

      const email = await response.json();
      return NextResponse.json({ email });
    }

    // Otherwise, fetch all received emails
    const response = await fetch('https://api.resend.com/emails', {
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to fetch emails', code: 'FETCH_FAILED' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const emails = data.data || [];

    // Filter by domain if specified
    let filteredEmails = emails;
    if (domain) {
      filteredEmails = emails.filter((email: any) => 
        email.to && email.to.some((addr: string) => addr.includes(domain))
      );
    }

    // Filter for inbound emails only (replies)
    const inboundEmails = filteredEmails.filter((email: any) => {
      // Check if this is a reply (has In-Reply-To header or References)
      return email.headers?.['In-Reply-To'] || 
             email.headers?.['References'] ||
             // Or check if it's to a willer.kyozo.com address
             email.to?.some((addr: string) => addr.includes('willer.kyozo.com'));
    });

    return NextResponse.json({
      emails: inboundEmails,
      total: inboundEmails.length,
      filtered: domain ? filteredEmails.length : emails.length,
      all: emails.length
    });

  } catch (error) {
    console.error('Error fetching incoming emails:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST endpoint to mark email as read/processed
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailId, action } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Missing email ID', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    // Here you would typically mark the email as processed in your database
    // For now, we'll just return success
    console.log(`Email ${emailId} marked as ${action || 'processed'}`);

    return NextResponse.json({
      success: true,
      message: `Email ${emailId} marked as ${action || 'processed'}`
    });

  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function PUT() {
  return NextResponse.json({
    name: 'Kyozo Incoming Email API',
    version: '1.0',
    description: 'Fetch incoming emails and replies',
    endpoints: {
      'GET /api/v1/email/incoming': {
        description: 'Fetch incoming emails',
        headers: {
          'x-api-key': 'Your Kyozo API key (required)',
          'Content-Type': 'application/json'
        },
        query_params: {
          'id': 'string (optional) - Fetch specific email by ID',
          'domain': 'string (optional) - Filter by domain (e.g., willer.kyozo.com)'
        },
        response: {
          emails: 'array of email objects',
          total: 'number of filtered emails',
          filtered: 'number of emails after domain filter',
          all: 'total number of emails'
        }
      },
      'POST /api/v1/email/incoming': {
        description: 'Mark email as processed',
        headers: {
          'x-api-key': 'Your Kyozo API key (required)',
          'Content-Type': 'application/json'
        },
        body: {
          emailId: 'string (required) - Email ID to process',
          action: 'string (optional) - Action to perform (read, processed, etc.)'
        },
        response: {
          success: 'boolean',
          message: 'string'
        }
      }
    },
    documentation: 'https://pro.kyozo.com/docs/api/email-incoming'
  });
}
