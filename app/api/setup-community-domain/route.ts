import { NextRequest, NextResponse } from 'next/server';

const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';
const RESEND_BASE_URL = 'https://api.resend.com';
const BASE_DOMAIN = 'kyozo.com';

interface DomainSetupResult {
  success: boolean;
  godaddy?: {
    dkimAdded: boolean;
    spfAdded: boolean;
    mxAdded: boolean;
  };
  resend?: {
    domainId: string;
    status: string;
  };
  error?: string;
}

// Add DNS records to GoDaddy for Resend email sending
async function addGoDaddyDNSRecords(handle: string, region: string = 'us-east-1'): Promise<{ success: boolean; error?: string; details?: any }> {
  if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
    return { success: false, error: 'GoDaddy API credentials not configured' };
  }

  // Determine the correct SES endpoint based on region
  const sesEndpoint = `feedback-smtp.${region}.amazonses.com`;

  const records = [
    // SPF TXT record for the subdomain
    {
      type: 'TXT',
      name: `send.${handle}`,
      data: 'v=spf1 include:amazonses.com ~all',
      ttl: 600,
    },
    // MX record for the subdomain (required by Resend)
    {
      type: 'MX',
      name: `send.${handle}`,
      data: sesEndpoint,
      priority: 10,
      ttl: 600,
    },
  ];

  const results: any[] = [];

  try {
    console.log(`[setup-community-domain] Adding ${records.length} DNS records to GoDaddy for ${handle}.${BASE_DOMAIN}`);
    
    const response = await fetch(`${GODADDY_BASE_URL}/domains/${BASE_DOMAIN}/records`, {
      method: 'PATCH',
      headers: {
        'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(records),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[setup-community-domain] GoDaddy error:', error);
      return { success: false, error: `GoDaddy API error: ${response.status}`, details: error };
    }

    console.log(`[setup-community-domain] ✓ Added SPF TXT record: send.${handle}`);
    console.log(`[setup-community-domain] ✓ Added MX record: send.${handle} -> ${sesEndpoint}`);
    
    return { success: true, details: { spfAdded: true, mxAdded: true } };
  } catch (error: any) {
    console.error('[setup-community-domain] GoDaddy error:', error);
    return { success: false, error: error.message };
  }
}

// Register domain with Resend
async function registerResendDomain(handle: string): Promise<{ success: boolean; domainId?: string; status?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Resend API key not configured' };
  }

  const domainName = `${handle}.${BASE_DOMAIN}`;

  try {
    const response = await fetch(`${RESEND_BASE_URL}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domainName,
        region: 'us-east-1', // Default region
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Domain might already exist
      if (data.message?.includes('already exists')) {
        console.log(`[setup-community-domain] Domain ${domainName} already exists in Resend`);
        return { success: true, status: 'already_exists' };
      }
      console.error('[setup-community-domain] Resend error:', data);
      return { success: false, error: data.message || 'Resend API error' };
    }

    console.log(`[setup-community-domain] Registered ${domainName} with Resend, ID: ${data.id}`);
    
    // Return the DNS records that need to be added
    return { 
      success: true, 
      domainId: data.id,
      status: data.status,
    };
  } catch (error: any) {
    console.error('[setup-community-domain] Resend error:', error);
    return { success: false, error: error.message };
  }
}

// Get Resend domain details including required DNS records
async function getResendDomainRecords(domainId: string): Promise<any> {
  if (!RESEND_API_KEY) return null;

  try {
    const response = await fetch(`${RESEND_BASE_URL}/domains/${domainId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

// Trigger domain verification with Resend
async function verifyResendDomain(domainId: string): Promise<{ success: boolean; status?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    console.log(`[setup-community-domain] Triggering verification for domain ID: ${domainId}`);
    
    const response = await fetch(`${RESEND_BASE_URL}/domains/${domainId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[setup-community-domain] Resend verification error:', error);
      return { success: false, error: `Verification failed: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[setup-community-domain] Verification triggered, status: ${data.status || 'pending'}`);
    
    return { 
      success: true, 
      status: data.status || 'verification_triggered',
    };
  } catch (error: any) {
    console.error('[setup-community-domain] Verification error:', error);
    return { success: false, error: error.message };
  }
}

// Add DKIM record from Resend to GoDaddy
async function addDKIMRecord(handle: string, dkimRecord: { name: string; value: string }): Promise<boolean> {
  if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) return false;

  // Extract just the subdomain part for GoDaddy
  // Resend gives: resend._domainkey.handle.kyozo.com
  // GoDaddy needs: resend._domainkey.handle
  const name = dkimRecord.name.replace(`.${BASE_DOMAIN}`, '');

  const records = [
    {
      type: 'TXT',
      name: name,
      data: dkimRecord.value,
      ttl: 600,
    },
  ];

  try {
    const response = await fetch(`${GODADDY_BASE_URL}/domains/${BASE_DOMAIN}/records`, {
      method: 'PATCH',
      headers: {
        'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(records),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[setup-community-domain] Failed to add DKIM:', error);
      return false;
    }

    console.log(`[setup-community-domain] Added DKIM record: ${name}`);
    return true;
  } catch (error) {
    console.error('[setup-community-domain] DKIM error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle } = body;

    if (!handle) {
      return NextResponse.json(
        { error: 'Community handle is required' },
        { status: 400 }
      );
    }

    // Sanitize handle (lowercase, no spaces)
    const sanitizedHandle = handle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    console.log(`[setup-community-domain] Setting up domain for: ${sanitizedHandle}.${BASE_DOMAIN}`);

    const result: DomainSetupResult = { success: false };

    // Step 1: Register domain with Resend
    const resendResult = await registerResendDomain(sanitizedHandle);
    if (!resendResult.success) {
      return NextResponse.json(
        { error: resendResult.error, step: 'resend_registration' },
        { status: 500 }
      );
    }
    result.resend = {
      domainId: resendResult.domainId || '',
      status: resendResult.status || 'pending',
    };

    // Step 2: Add SPF and MX records to GoDaddy
    const godaddyResult = await addGoDaddyDNSRecords(sanitizedHandle);
    result.godaddy = {
      dkimAdded: false,
      spfAdded: godaddyResult.details?.spfAdded || godaddyResult.success,
      mxAdded: godaddyResult.details?.mxAdded || godaddyResult.success,
    };

    // Step 3: If we have a domain ID, get the DKIM records and add them
    if (resendResult.domainId) {
      const domainDetails = await getResendDomainRecords(resendResult.domainId);
      console.log(`[setup-community-domain] Domain details:`, JSON.stringify(domainDetails, null, 2));
      
      if (domainDetails?.records) {
        // Find the DKIM record - Resend uses 'record' field with value 'DKIM'
        const dkimRecord = domainDetails.records.find((r: any) => 
          (r.record === 'DKIM' || r.type === 'TXT') && r.name?.includes('domainkey')
        );
        console.log(`[setup-community-domain] DKIM record found:`, dkimRecord);
        
        if (dkimRecord && result.godaddy) {
          result.godaddy.dkimAdded = await addDKIMRecord(sanitizedHandle, {
            name: dkimRecord.name,
            value: dkimRecord.value,
          });
          console.log(`[setup-community-domain] DKIM added: ${result.godaddy.dkimAdded}`);
        }
      }
      
      // Step 4: Trigger domain verification with Resend
      // Wait a bit for DNS propagation before triggering verification
      console.log(`[setup-community-domain] Waiting 2 seconds before triggering verification...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verifyResult = await verifyResendDomain(resendResult.domainId);
      if (verifyResult.success) {
        result.resend.status = verifyResult.status || 'verification_triggered';
        console.log(`[setup-community-domain] Verification triggered for ${sanitizedHandle}.${BASE_DOMAIN}`);
      } else {
        console.warn(`[setup-community-domain] Verification trigger failed: ${verifyResult.error}`);
      }
    }

    result.success = true;

    return NextResponse.json({
      message: `Domain ${sanitizedHandle}.${BASE_DOMAIN} setup initiated`,
      emailAddress: `message@${sanitizedHandle}.${BASE_DOMAIN}`,
      ...result,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[setup-community-domain] Error:', error);
    return NextResponse.json(
      { error: 'Failed to setup community domain', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Check domain status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json(
      { error: 'Handle query parameter is required' },
      { status: 400 }
    );
  }

  // For now, just return the expected email address
  return NextResponse.json({
    handle,
    domain: `${handle}.${BASE_DOMAIN}`,
    emailAddress: `message@${handle}.${BASE_DOMAIN}`,
  });
}
