# Kyozo Email Domains, Inbound, and Inbox Implementation

This document describes how to:

- Provision per‑community email domains like `slug.kyozo.com`
- Wire GoDaddy DNS to Resend automatically
- Receive emails (replies) into Kyozo via Resend inbound + webhooks
- Build an on‑platform inbox and optional forwarding to the owner’s personal email

---

## 1. Packages and Environment

### Install dependencies

```bash
npm install resend axios
# or
yarn add resend axios
Resend provides an official Node SDK (resend).[web:23]

Environment variables
bash
# Resend
RESEND_API_KEY=re_...
RESEND_FROM_FALLBACK="no-reply@kyozo.com"

# GoDaddy DNS
GODADDY_API_KEY=gd_api_key
GODADDY_API_SECRET=gd_api_secret
GODADDY_DOMAIN=kyozo.com
GODADDY_API_BASE=https://api.godaddy.com

# App
APP_BASE_URL=https://app.kyozo.com
GODADDY_DOMAIN is your root domain (e.g. kyozo.com); subdomains are created via DNS records.[web:2]

RESEND_API_KEY is from your Resend account.[web:23]

2. Resend & GoDaddy Clients
lib/resend.ts
ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
Resend initialization matches their Node SDK usage.[web:23]

lib/godaddy.ts
ts
import axios from 'axios';

const GODADDY_API_BASE =
  process.env.GODADDY_API_BASE || 'https://api.godaddy.com';

if (!process.env.GODADDY_API_KEY || !process.env.GODADDY_API_SECRET) {
  throw new Error('GoDaddy API credentials missing');
}

const authHeader = `sso-key ${process.env.GODADDY_API_KEY}:${process.env.GODADDY_API_SECRET}`;

export type GoDaddyDNSRecord = {
  type: string;       // 'TXT' | 'CNAME' | 'MX' | ...
  name: string;       // host, e.g. 'slug', 'send.slug', '@'
  data: string;       // record value
  ttl?: number;       // seconds
  priority?: number;  // for MX
};

export async function upsertDNSRecords(
  domain: string,
  type: string,
  name: string,
  records: GoDaddyDNSRecord[],
) {
  const url = `${GODADDY_API_BASE}/v1/domains/${domain}/records/${type}/${name}`;

  await axios.put(
    url,
    records.map((r) => ({
      data: r.data,
      ttl: r.ttl ?? 600,
      priority: r.priority,
    })),
    {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );
}
Path format and sso-key header come from GoDaddy’s Domains API docs.[web:2][web:21]

3. Domain Provisioning Per Community
When a community is created (slug slug):

We create a Resend domain slug.kyozo.com.

Resend returns DNS records.

We mirror those into GoDaddy.

We store resendDomainId and mark status as provisioning.

lib/email-domain.ts
ts
import { resend } from './resend';
import { upsertDNSRecords, GoDaddyDNSRecord } from './godaddy';

const ROOT_DOMAIN = process.env.GODADDY_DOMAIN!;

// Approximate Resend domain record shape
type ResendDomainRecord = {
  type: 'TXT' | 'CNAME' | 'MX';
  name: string;    // '@', 'send', 'dkim._domainkey', etc.
  value: string;
  priority?: number;
};

type ResendDomain = {
  id: string;
  name: string;       // 'slug.kyozo.com'
  status: string;     // 'not_started' | 'pending' | 'verified'
  records: ResendDomainRecord[];
};

export async function createResendDomainForCommunity(slug: string) {
  const emailDomain = `${slug}.${ROOT_DOMAIN}`; // slug.kyozo.com

  // 1. Create domain in Resend
  const { data: domain, error } = await resend.domains.create({
    name: emailDomain,
    // optional: custom_return_path: `send.${slug}.${ROOT_DOMAIN}`,
  } as any);

  if (error) throw error;

  const d = domain as ResendDomain;

  // 2. Sync DNS to GoDaddy
  await syncResendRecordsToGoDaddy(d);

  return d;
}

async function syncResendRecordsToGoDaddy(domain: ResendDomain) {
  const relativeDomain = domain.name.replace(`.${ROOT_DOMAIN}`, ''); // 'slug'

  const grouped: Record<string, GoDaddyDNSRecord[]> = {};

  for (const r of domain.records) {
    let nameForGoDaddy: string;

    if (r.name === '@') {
      // root of this subdomain → 'slug'
      nameForGoDaddy = relativeDomain;
    } else {
      // e.g. 'send.slug', 'dkim._domainkey.slug'
      nameForGoDaddy = `${r.name}.${relativeDomain}`;
    }

    const key = `${r.type}:${nameForGoDaddy}`;

    if (!grouped[key]) grouped[key] = [];

    grouped[key].push({
      type: r.type,
      name: nameForGoDaddy,
      data: r.value,
      priority: r.priority,
    });
  }

  for (const [key, records] of Object.entries(grouped)) {
    const [type, name] = key.split(':');
    await upsertDNSRecords(ROOT_DOMAIN, type, name, records);
  }
}
Resend’s Domains API returns required DNS entries for sending/receiving; we map that into GoDaddy per their API structure.[web:6][web:9][web:2]

4. Domain Verification Polling
After DNS is in place, Resend needs time to verify.[web:31][web:12]

lib/email-domain-status.ts
ts
import { resend } from './resend';

export async function getResendDomainStatus(domainId: string) {
  const { data, error } = await resend.domains.get({ id: domainId } as any);
  if (error) throw error;
  return (data as any).status as string; // 'pending' | 'verified'
}
Implement a background job (cron / queue) that:

Finds communities with emailDomainStatus = 'provisioning'.

Calls getResendDomainStatus(community.resendDomainId).

When verified, sets emailDomainStatus = 'active'.

Resend’s docs describe this polling pattern for verifying domains.[web:6][web:31]

5. Hooking Domain Provisioning into Community Creation
Example Next.js App Router API route:

ts
// app/api/communities/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createResendDomainForCommunity } from '@/lib/email-domain';
// import db from '@/lib/db'; // your actual DB layer

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, name } = body as { slug: string; name: string };

  // 1. Create community row
  const community = await db.community.create({
    data: {
      slug,
      name,
      emailDomain: `${slug}.${process.env.GODADDY_DOMAIN}`,
      emailDomainStatus: 'provisioning',
    },
  });

  // 2. Fire the domain provisioning logic
  const domain = await createResendDomainForCommunity(slug);

  await db.community.update({
    where: { id: community.id },
    data: {
      resendDomainId: domain.id,
    },
  });

  return NextResponse.json({ communityId: community.id }, { status: 201 });
}
6. Inbound Email → Kyozo Inbox (Replies)
Goal: All emails to handle@slug.kyozo.com show up in a Kyozo inbox, and optionally a copy is forwarded to the owner’s personal email.

6.1 Resend Receiving + Webhook
In Resend dashboard, enable Receiving for your domains (MX records already created).[web:31][web:12]

Create a webhook (in Resend) for email.received events pointing to:

POST https://app.kyozo.com/api/resend/inbound

Resend inbound docs describe email.received payload and receiving flow.[web:31][web:35]

6.2 DB Sketch
You can adapt this to your own schema:

ts
// tables (rough sketch):

Community: {
  id: string;
  slug: string;
  emailDomain: string;          // 'slug.kyozo.com'
  resendDomainId: string | null;
  emailDomainStatus: 'provisioning' | 'active';
  ownerId: string;
  forwardToEmail: string | null; // owner personal email
}

Conversation: {
  id: string;
  communityId: string;
  subject: string | null;
  externalThreadKey: string | null; // e.g. original inbound message_id
  createdAt: Date;
}

Message: {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  externalMessageId: string | null; // Resend message_id / email_id
  createdAt: Date;
}
6.3 Inbound Webhook Handler
ts
// app/api/resend/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
// import db from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // Adjust to actual event shape; Resend docs show event envelope.[1][2]
  const eventType = payload.type;
  if (eventType !== 'email.received') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const received = payload.data; // shape includes: to, from, subject, email_id, etc.

  const toAddress: string = received.to.email; // e.g. handle@slug.kyozo.com
  const fromAddress: string = received.from.email;
  const subject: string | null = received.subject ?? null;
  const emailId: string = received.id || received.email_id; // receiving email id

  // 1. Map to community + handle by domain
  const [localPart, domainPart] = toAddress.split('@'); // 'handle', 'slug.kyozo.com'

  const community = await db.community.findFirst({
    where: { emailDomain: domainPart },
  });
  if (!community) {
    // Unknown domain, ignore or log
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 2. Fetch full email content from Resend Receiving API[3]
  const { data: fullEmail, error } = await resend.emails.getReceived({
    id: emailId,
  } as any);
  if (error) throw error;

  const text = (fullEmail as any).text ?? null;
  const html = (fullEmail as any).html ?? null;
  const messageId = (fullEmail as any).message_id ?? null;

  // 3. Find or create conversation
  let conversation = await db.conversation.findFirst({
    where: {
      communityId: community.id,
      externalThreadKey: messageId,
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        communityId: community.id,
        subject,
        externalThreadKey: messageId,
      },
    });
  }

  // 4. Store message
  await db.message.create({
    data: {
      conversationId: conversation.id,
      direction: 'inbound',
      fromEmail: fromAddress,
      toEmail: toAddress,
      subject,
      text,
      html,
      externalMessageId: emailId,
    },
  });

  // 5. Optional: forward to community owner’s personal email[4]
  if (community.forwardToEmail) {
    await resend.emails.send({
      from: `Kyozo <${process.env.RESEND_FROM_FALLBACK}>`,
      to: community.forwardToEmail,
      subject: `[${community.slug}] Fwd: ${subject ?? ''}`,
      html:
        html ??
        `<pre>${text ?? ''}</pre>`,
      text: text ?? undefined,
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
We use Resend’s “Retrieve Received Email” API to get full body/HTML.[web:60][web:31]

Webhook event type and fields should be aligned to Resend’s latest docs.[web:31][web:38]

7. Sending Emails From Kyozo Inbox
When an owner replies inside Kyozo, we send an outbound email via Resend, linking it to the original thread.

7.1 Send helper
ts
// lib/send-community-email.ts
import { resend } from './resend';
// import db from '@/lib/db';

export async function sendCommunityEmail(params: {
  communityId: string;
  conversationId: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const community = await db.community.findUnique({
    where: { id: params.communityId },
  });
  if (!community) throw new Error('Community not found');

  const emailDomain = community.emailDomain; // 'slug.kyozo.com'
  const fromAddress = `no-reply@${emailDomain}`;

  // Optionally load last inbound message to set threading headers[5][1]
  const lastInbound = await db.message.findFirst({
    where: {
      conversationId: params.conversationId,
      direction: 'inbound',
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers: Record<string, string> = {};

  if (lastInbound?.externalMessageId) {
    headers['In-Reply-To'] = lastInbound.externalMessageId;
    headers['References'] = lastInbound.externalMessageId;
  }

  const { data, error } = await resend.emails.send({
    from: `Kyozo <${fromAddress}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    headers,
  } as any);
  if (error) throw error;

  const messageId = (data as any).id ?? null;

  await db.message.create({
    data: {
      conversationId: params.conversationId,
      direction: 'outbound',
      fromEmail: fromAddress,
      toEmail: params.to,
      subject: params.subject,
      text: params.text ?? null,
      html: params.html ?? null,
      externalMessageId: messageId,
    },
  });
}
Resend recommends using In-Reply-To / References to keep threads together in external clients.[web:28][web:31]

8. SaaS Settings and UI
8.1 Settings for community owner
In the Kyozo UI, per community:

Show email domain: slug.kyozo.com (status: provisioning / active).

Allow configuring:

“Forward incoming messages to personal email”: forwardToEmail (optional).

Show instructions (if needed) to configure “Send mail as” via Resend SMTP, if you choose to expose that.[web:15][web:52]

8.2 Inbox UI
Frontend view per community:

Conversations list:

GET /api/communities/:id/conversations

Conversation detail:

GET /api/conversations/:id/messages

Reply form:

POST /api/conversations/:id/reply

Calls sendCommunityEmail internally.

9. Summary of Behaviours
Outbound emails: Sent via Resend using per‑community domain slug.kyozo.com.[web:6][web:23]

Replies: Delivered to Resend (MX), posted to Kyozo via webhook, stored as Message rows.[web:31][web:35]

Optional owner visibility: Forwarded to owner’s personal email using Resend send API.[web:27]

Owners reply inside Kyozo: Kyozo sends via Resend, sets proper headers to keep external threading.[web:28][web:31]

This keeps handle@slug.kyozo.com as a platform‑owned inbox (no IMAP/POP), while still giving owners good visibility and control through Kyozo and optionally their personal email.