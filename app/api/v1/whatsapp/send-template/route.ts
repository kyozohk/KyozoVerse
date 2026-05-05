import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

const RAW_API_KEY =
  process.env.D360_API_KEY ||
  process.env.D360_DIALOG_API_KEY ||
  process.env['360_API_KEY'] ||
  '';
const WEBHOOK_URL = process.env['360_WEBHOOK'] || 'https://waba-v2.360dialog.io';
const API_URL = `${WEBHOOK_URL}/messages`;

function mapComponentType(type: string): string {
  const map: Record<string, string> = {
    BUTTONS: 'BUTTON',
    buttons: 'BUTTON',
    button: 'BUTTON',
    HEADER: 'HEADER',
    header: 'HEADER',
    BODY: 'BODY',
    body: 'BODY',
    FOOTER: 'FOOTER',
    footer: 'FOOTER',
  };
  return map[type] || map[type.toUpperCase()] || type.toUpperCase();
}

/**
 * POST /api/v1/whatsapp/send-template
 *
 * Body shape:
 *   {
 *     to: string,                  // E.164 phone, e.g. "+15551234567"
 *     template: {
 *       name: string,
 *       language: string | { code: string },
 *       components?: Array<{
 *         type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTON',
 *         text?: string,
 *         parameters?: Array<{
 *           type: 'text' | 'image' | 'document' | 'video',
 *           text?: string,
 *           image?: { link: string },
 *           document?: { link: string },
 *           video?: { link: string },
 *         }>,
 *       }>,
 *     },
 *     wabaAccountId?: string,
 *   }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'whatsapp:send' });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();

    if (!body.to || !body.template?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: "to" and "template.name"', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    const components: Array<Record<string, unknown>> = [];
    if (Array.isArray(body.template.components)) {
      for (const comp of body.template.components) {
        if (!comp || !comp.type) continue;
        const componentType = mapComponentType(comp.type);

        // 360dialog rejects BUTTON in payload; templates manage their own
        if (componentType === 'BUTTON') continue;
        // 360dialog rejects HEADER without parameters
        if (componentType === 'HEADER' && (!comp.parameters || comp.parameters.length === 0)) continue;

        const clean: Record<string, unknown> = { type: componentType };
        if (comp.text && componentType === 'FOOTER') clean.text = comp.text;
        if (Array.isArray(comp.parameters) && comp.parameters.length > 0) {
          clean.parameters = comp.parameters.map((p: any) => {
            const cp: Record<string, unknown> = { type: p.type || 'text' };
            if (p.type === 'image' && p.image?.link) cp.image = { link: p.image.link };
            else if (p.type === 'document' && p.document?.link) cp.document = { link: p.document.link };
            else if (p.type === 'video' && p.video?.link) cp.video = { link: p.video.link };
            else cp.text = p.text || '';
            return cp;
          });
        }
        components.push(clean);
      }
    }

    const payload = {
      to: body.to,
      type: 'template',
      template: {
        name: body.template.name,
        language: {
          code:
            (typeof body.template.language === 'string'
              ? body.template.language
              : body.template.language?.code) || 'en_US',
        },
        components,
      },
      messaging_product: 'whatsapp',
    };

    if (!RAW_API_KEY) {
      return NextResponse.json(
        { error: '360dialog API key not configured', code: 'SERVICE_ERROR' },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      'D360-API-KEY': RAW_API_KEY,
      'Content-Type': 'application/json',
    };
    if (body.wabaAccountId) headers['D360-WABA-ACCOUNT-ID'] = body.wabaAccountId;

    const r = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await r.json();

    return NextResponse.json(
      {
        success: r.ok,
        data,
        errorMessage: !r.ok && data?.error ? JSON.stringify(data.error) : null,
      },
      { status: r.ok ? 200 : 502 }
    );
  } catch (e) {
    console.error('[v1/whatsapp/send-template] error:', e);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send WhatsApp template',
        details: (e as Error).message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
