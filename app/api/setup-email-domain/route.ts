import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GODADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GODADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;

interface ResendDNSRecord {
  record: string;
  name: string;
  type: string;
  ttl: string;
  status: string;
  value: string;
  priority?: number;
}

interface ResendDomain {
  id: string;
  name: string;
  status: string;
  created_at: string;
  region: string;
  records: ResendDNSRecord[];
}

// Step 1: List existing domains in Resend
async function listResendDomains(): Promise<ResendDomain[]> {
  console.log('📧 [DOMAIN] Listing Resend domains...');
  const response = await fetch('https://api.resend.com/domains', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });
  
  const data = await response.json();
  console.log('📧 [DOMAIN] Resend domains response:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`Failed to list domains: ${JSON.stringify(data)}`);
  }
  
  return data.data || [];
}

// Step 2: Add domain to Resend
async function addResendDomain(domain: string): Promise<ResendDomain> {
  console.log('📧 [DOMAIN] Adding domain to Resend:', domain);
  const response = await fetch('https://api.resend.com/domains', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
  });
  
  const data = await response.json();
  console.log('📧 [DOMAIN] Add domain response:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`Failed to add domain: ${JSON.stringify(data)}`);
  }
  
  return data;
}

// Step 3: Get domain details with DNS records
async function getResendDomain(domainId: string): Promise<ResendDomain> {
  console.log('📧 [DOMAIN] Getting domain details for:', domainId);
  const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });
  
  const data = await response.json();
  console.log('📧 [DOMAIN] Domain details:', JSON.stringify(data, null, 2));
  
  if (!response.ok) {
    throw new Error(`Failed to get domain: ${JSON.stringify(data)}`);
  }
  
  return data;
}

// Step 4: Verify domain in Resend
async function verifyResendDomain(domainId: string): Promise<any> {
  console.log('📧 [DOMAIN] Verifying domain:', domainId);
  const response = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });
  
  const data = await response.json();
  console.log('📧 [DOMAIN] Verify response:', JSON.stringify(data, null, 2));
  
  return data;
}

// Step 5: Add DNS records to GoDaddy
async function addGoDaddyDNSRecords(domain: string, records: ResendDNSRecord[]): Promise<any[]> {
  console.log('📧 [GODADDY] Adding DNS records to GoDaddy for:', domain);
  
  const results: any[] = [];
  
  for (const record of records) {
    // Skip if already verified
    if (record.status === 'verified') {
      console.log(`📧 [GODADDY] Skipping already verified record: ${record.name}`);
      results.push({ record: record.name, status: 'already_verified' });
      continue;
    }
    
    // Prepare GoDaddy record format
    let recordName = record.name;
    // Remove the domain suffix if present (GoDaddy expects just the subdomain part)
    if (recordName.endsWith(`.${domain}`)) {
      recordName = recordName.replace(`.${domain}`, '');
    }
    if (recordName === domain) {
      recordName = '@';
    }
    
    const godaddyRecord = {
      data: record.value,
      name: recordName,
      ttl: parseInt(record.ttl) || 3600,
      type: record.type,
      ...(record.priority !== undefined && { priority: record.priority }),
    };
    
    console.log(`📧 [GODADDY] Adding ${record.type} record:`, godaddyRecord);
    
    try {
      // GoDaddy API endpoint for adding records
      const url = `https://api.godaddy.com/v1/domains/${domain}/records/${record.type}/${recordName}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([godaddyRecord]),
      });
      
      let responseData;
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      console.log(`📧 [GODADDY] Response for ${record.name}:`, response.status, responseData);
      
      results.push({
        record: record.name,
        type: record.type,
        status: response.ok ? 'added' : 'failed',
        response: responseData,
      });
    } catch (error) {
      console.error(`📧 [GODADDY] Error adding record ${record.name}:`, error);
      results.push({
        record: record.name,
        type: record.type,
        status: 'error',
        error: (error as Error).message,
      });
    }
  }
  
  return results;
}

export async function POST(request: NextRequest) {
  console.log('📧 [SETUP] Starting email domain setup...');
  
  try {
    const body = await request.json().catch(() => ({}));
    const domain = body.domain || 'kyozo.com';
    
    console.log('📧 [SETUP] Setting up domain:', domain);
    console.log('📧 [SETUP] RESEND_API_KEY exists:', !!RESEND_API_KEY);
    console.log('📧 [SETUP] GODADDY_API_KEY exists:', !!GODADDY_API_KEY);
    console.log('📧 [SETUP] GODADDY_API_SECRET exists:', !!GODADDY_API_SECRET);
    
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }
    
    if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
      return NextResponse.json({ error: 'GoDaddy API credentials not configured' }, { status: 500 });
    }
    
    // Step 1: Check if domain already exists in Resend
    const existingDomains = await listResendDomains();
    let domainData = existingDomains.find(d => d.name === domain);
    
    // Step 2: If not exists, add it
    if (!domainData) {
      console.log('📧 [SETUP] Domain not found in Resend, adding...');
      domainData = await addResendDomain(domain);
    } else {
      console.log('📧 [SETUP] Domain already exists in Resend:', domainData.id);
      // Get full domain details with DNS records
      domainData = await getResendDomain(domainData.id);
    }
    
    // Step 3: Get DNS records needed
    const dnsRecords = domainData.records || [];
    console.log('📧 [SETUP] DNS records needed:', dnsRecords.length);
    
    // Step 4: Add DNS records to GoDaddy
    let godaddyResults: any[] = [];
    if (dnsRecords.length > 0) {
      godaddyResults = await addGoDaddyDNSRecords(domain, dnsRecords);
    }
    
    // Step 5: Wait a moment then verify domain
    console.log('📧 [SETUP] Waiting 5 seconds before verification...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const verifyResult = await verifyResendDomain(domainData.id);
    
    // Get updated domain status
    const updatedDomain = await getResendDomain(domainData.id);
    
    return NextResponse.json({
      success: true,
      domain: updatedDomain.name,
      status: updatedDomain.status,
      domainId: updatedDomain.id,
      dnsRecords: updatedDomain.records,
      godaddyResults,
      verifyResult,
      message: updatedDomain.status === 'verified' 
        ? 'Domain is verified and ready to use!' 
        : 'DNS records added. Domain verification may take a few minutes. Run this endpoint again to check status.',
    });
    
  } catch (error) {
    console.error('📧 [SETUP] FATAL ERROR:', error);
    return NextResponse.json({
      error: 'Setup failed',
      details: (error as Error).message,
    }, { status: 500 });
  }
}

// GET endpoint to check domain status
export async function GET(request: NextRequest) {
  console.log('📧 [STATUS] Checking domain status...');
  
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'kyozo.com';
    
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }
    
    const existingDomains = await listResendDomains();
    const domainData = existingDomains.find(d => d.name === domain);
    
    if (!domainData) {
      return NextResponse.json({
        domain,
        status: 'not_found',
        message: 'Domain not registered in Resend. POST to this endpoint to set it up.',
      });
    }
    
    const fullDomainData = await getResendDomain(domainData.id);
    
    return NextResponse.json({
      domain: fullDomainData.name,
      status: fullDomainData.status,
      domainId: fullDomainData.id,
      records: fullDomainData.records,
      message: fullDomainData.status === 'verified' 
        ? 'Domain is verified and ready to use!' 
        : 'Domain is pending verification. DNS records may need to propagate.',
    });
    
  } catch (error) {
    console.error('📧 [STATUS] ERROR:', error);
    return NextResponse.json({
      error: 'Failed to check status',
      details: (error as Error).message,
    }, { status: 500 });
  }
}
