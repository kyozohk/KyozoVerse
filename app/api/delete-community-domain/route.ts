import { NextRequest, NextResponse } from 'next/server';

const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';
const RESEND_BASE_URL = 'https://api.resend.com';
const BASE_DOMAIN = 'kyozo.com';

// Delete DNS records from GoDaddy for a community subdomain
async function deleteGoDaddyDNSRecords(handle: string): Promise<{ success: boolean; error?: string; details?: any }> {
  console.log(`[GoDaddy] Starting DNS record deletion for handle: ${handle}`);
  
  if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
    console.log('[GoDaddy] API credentials not configured');
    return { success: false, error: 'GoDaddy API credentials not configured' };
  }

  const recordsToDelete = [
    { type: 'TXT', name: `send.${handle}` },
    { type: 'TXT', name: `resend._domainkey.${handle}` },
    { type: 'MX', name: `send.${handle}` },
  ];

  const results: any[] = [];

  try {
    for (const record of recordsToDelete) {
      const url = `${GODADDY_BASE_URL}/domains/${BASE_DOMAIN}/records/${record.type}/${record.name}`;
      console.log(`[GoDaddy] Deleting record: ${record.type} ${record.name}`);
      console.log(`[GoDaddy] URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[GoDaddy] Response status: ${response.status}`);

      if (response.status === 204 || response.status === 200) {
        console.log(`[GoDaddy] ✓ Successfully deleted record: ${record.name}`);
        results.push({ record: record.name, status: 'deleted' });
      } else if (response.status === 404) {
        console.log(`[GoDaddy] Record not found (already deleted?): ${record.name}`);
        results.push({ record: record.name, status: 'not_found' });
      } else {
        const error = await response.text();
        console.error(`[GoDaddy] ✗ Failed to delete record ${record.name}:`, error);
        results.push({ record: record.name, status: 'failed', error });
      }
    }

    console.log(`[GoDaddy] Deletion complete. Results:`, results);
    return { success: true, details: results };
  } catch (error: any) {
    console.error('[GoDaddy] Error:', error);
    return { success: false, error: error.message, details: results };
  }
}

// Delete domain from Resend
async function deleteResendDomain(handle: string): Promise<{ success: boolean; error?: string; details?: any }> {
  console.log(`[Resend] Starting domain deletion for handle: ${handle}`);
  
  if (!RESEND_API_KEY) {
    console.log('[Resend] API key not configured');
    return { success: false, error: 'Resend API key not configured' };
  }

  const domainName = `${handle}.${BASE_DOMAIN}`;
  console.log(`[Resend] Looking for domain: ${domainName}`);

  try {
    // First, list all domains to find the domain ID
    console.log(`[Resend] Fetching all domains from Resend...`);
    const listResponse = await fetch(`${RESEND_BASE_URL}/domains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    console.log(`[Resend] List domains response status: ${listResponse.status}`);

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('[Resend] ✗ Failed to list domains:', error);
      return { success: false, error: 'Failed to list domains', details: error };
    }

    const domainsData = await listResponse.json();
    console.log(`[Resend] Found ${domainsData.data?.length || 0} domains in Resend`);
    console.log(`[Resend] All domain names:`, JSON.stringify(domainsData.data?.map((d: any) => ({ name: d.name, id: d.id })), null, 2));
    
    const domain = domainsData.data?.find((d: any) => d.name === domainName);

    if (!domain) {
      console.log(`[Resend] Domain ${domainName} not found in Resend (may not exist or already deleted)`);
      return { success: true, details: `Domain ${domainName} not found` };
    }

    console.log(`[Resend] Found domain to delete: ${domain.name} (ID: ${domain.id}, status: ${domain.status})`);

    // Delete the domain
    const deleteUrl = `${RESEND_BASE_URL}/domains/${domain.id}`;
    console.log(`[Resend] Sending DELETE request to: ${deleteUrl}`);
    
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
    });

    console.log(`[Resend] Delete response status: ${deleteResponse.status}`);

    if (deleteResponse.ok || deleteResponse.status === 204) {
      console.log(`[Resend] ✓ Successfully deleted domain: ${domainName}`);
      return { success: true, details: `Deleted domain ${domainName} (ID: ${domain.id})` };
    } else {
      const error = await deleteResponse.text();
      console.error(`[Resend] ✗ Failed to delete domain:`, error);
      return { success: false, error: 'Failed to delete domain from Resend', details: error };
    }
  } catch (error: any) {
    console.error('[Resend] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  console.log('========================================');
  console.log('[DELETE-COMMUNITY-DOMAIN] API called');
  console.log('========================================');
  
  try {
    const body = await request.json();
    const { handle } = body;
    console.log(`[DELETE-COMMUNITY-DOMAIN] Received handle: ${handle}`);

    if (!handle) {
      return NextResponse.json(
        { error: 'Community handle is required' },
        { status: 400 }
      );
    }

    // Sanitize handle
    const sanitizedHandle = handle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    console.log(`[delete-community-domain] Deleting domain for: ${sanitizedHandle}.${BASE_DOMAIN}`);

    // Delete from GoDaddy
    const godaddyResult = await deleteGoDaddyDNSRecords(sanitizedHandle);
    
    // Delete from Resend
    const resendResult = await deleteResendDomain(sanitizedHandle);

    return NextResponse.json({
      message: `Domain cleanup completed for ${sanitizedHandle}.${BASE_DOMAIN}`,
      godaddy: godaddyResult,
      resend: resendResult,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[delete-community-domain] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete community domain', details: error.message },
      { status: 500 }
    );
  }
}
