import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

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

async function listResendDomains(): Promise<ResendDomain[]> {
  const r = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Failed to list domains: ${JSON.stringify(data)}`);
  return data.data || [];
}

async function addResendDomain(domain: string): Promise<ResendDomain> {
  const r = await fetch('https://api.resend.com/domains', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Failed to add domain: ${JSON.stringify(data)}`);
  return data;
}

async function getResendDomain(id: string): Promise<ResendDomain> {
  const r = await fetch(`https://api.resend.com/domains/${id}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Failed to get domain: ${JSON.stringify(data)}`);
  return data;
}

async function verifyResendDomain(id: string) {
  const r = await fetch(`https://api.resend.com/domains/${id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  return r.json();
}

async function addGoDaddyDNSRecords(domain: string, records: ResendDNSRecord[]) {
  const out: unknown[] = [];
  for (const rec of records) {
    if (rec.status === 'verified') {
      out.push({ record: rec.name, status: 'already_verified' });
      continue;
    }
    let name = rec.name;
    if (name.endsWith(`.${domain}`)) name = name.replace(`.${domain}`, '');
    if (name === domain) name = '@';
    const body = {
      data: rec.value,
      name,
      ttl: parseInt(rec.ttl) || 3600,
      type: rec.type,
      ...(rec.priority !== undefined && { priority: rec.priority }),
    };
    try {
      const url = `https://api.godaddy.com/v1/domains/${domain}/records/${rec.type}/${name}`;
      const r = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([body]),
      });
      const text = await r.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
      out.push({
        record: rec.name,
        type: rec.type,
        status: r.ok ? 'added' : 'failed',
        response: parsed,
      });
    } catch (e) {
      out.push({
        record: rec.name,
        type: rec.type,
        status: 'error',
        error: (e as Error).message,
      });
    }
  }
  return out;
}

/**
 * POST /api/v1/email/setup-domain
 *
 * Body: { handle?: string, domain?: string, action?: 'list' | 'get' | 'verify' | 'add' }
 * Default action is `add` (idempotent: adds if missing, then triggers verification).
 */
export async function POST(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'email:setup-domain' });
  if (!auth.ok) return auth.response;

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured', code: 'SERVICE_ERROR' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { handle, action, domain } = body || {};

    if (action === 'list') {
      const domains = await listResendDomains();
      return NextResponse.json({ success: true, domains });
    }

    if (action === 'get') {
      const target = domain || `${handle}.kyozo.com`;
      const found = (await listResendDomains()).find((d) => d.name === target);
      if (!found) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
      return NextResponse.json({
        success: true,
        domain: found.name,
        status: found.status,
        domainId: found.id,
        dnsRecords: found.records || [],
      });
    }

    if (action === 'verify') {
      const target = domain || `${handle}.kyozo.com`;
      const found = (await listResendDomains()).find((d) => d.name === target);
      if (!found) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
      const verifyResult = await verifyResendDomain(found.id);
      const updated = await getResendDomain(found.id);
      return NextResponse.json({
        success: true,
        domain: updated.name,
        status: updated.status,
        domainId: updated.id,
        dnsRecords: updated.records,
        verifyResult,
      });
    }

    // Default: add
    const target = domain || (handle ? `${handle}.kyozo.com` : null);
    if (!target) {
      return NextResponse.json(
        { error: 'Provide `domain` or `handle`', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }
    if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
      return NextResponse.json(
        { error: 'GoDaddy API credentials not configured', code: 'SERVICE_ERROR' },
        { status: 500 }
      );
    }

    let domainData = (await listResendDomains()).find((d) => d.name === target);
    if (!domainData) domainData = await addResendDomain(target);
    else domainData = await getResendDomain(domainData.id);

    const records = domainData.records || [];
    const godaddyResults = records.length ? await addGoDaddyDNSRecords(target, records) : [];

    await new Promise((r) => setTimeout(r, 5000));
    const verifyResult = await verifyResendDomain(domainData.id);
    const updated = await getResendDomain(domainData.id);

    return NextResponse.json({
      success: true,
      domain: updated.name,
      status: updated.status,
      domainId: updated.id,
      dnsRecords: updated.records,
      godaddyResults,
      verifyResult,
    });
  } catch (e) {
    console.error('[v1/email/setup-domain] error:', e);
    return NextResponse.json(
      { error: 'Setup failed', details: (e as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** GET /api/v1/email/setup-domain?domain=foo.kyozo.com — current status */
export async function GET(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'email:setup-domain' });
  if (!auth.ok) return auth.response;

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured', code: 'SERVICE_ERROR' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'kyozo.com';
    const found = (await listResendDomains()).find((d) => d.name === domain);
    if (!found) {
      return NextResponse.json({
        domain,
        status: 'not_found',
        message: 'Domain not registered. POST to add it.',
      });
    }
    const full = await getResendDomain(found.id);
    return NextResponse.json({
      domain: full.name,
      status: full.status,
      domainId: full.id,
      records: full.records,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to check status', details: (e as Error).message },
      { status: 500 }
    );
  }
}
