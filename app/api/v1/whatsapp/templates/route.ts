import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

const RAW_API_KEY =
  process.env.D360_API_KEY ||
  process.env.D360_DIALOG_API_KEY ||
  process.env['360_API_KEY'] ||
  '';
const WEBHOOK_URL = process.env['360_WEBHOOK'] || 'https://waba-v2.360dialog.io';
const TEMPLATES_URL = `${WEBHOOK_URL}/v1/configs/templates`;

/** GET /api/v1/whatsapp/templates — list message templates from 360dialog. */
export async function GET(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'whatsapp:read' });
  if (!auth.ok) return auth.response;

  if (!RAW_API_KEY) {
    return NextResponse.json(
      { success: false, templates: [], error: 'Missing 360dialog API key', code: 'SERVICE_ERROR' },
      { status: 500 }
    );
  }

  try {
    const r = await fetch(TEMPLATES_URL, {
      headers: { 'D360-API-KEY': RAW_API_KEY, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!r.ok) {
      return NextResponse.json(
        {
          success: false,
          templates: [],
          error: `360dialog returned ${r.status}`,
          code: 'UPSTREAM_ERROR',
        },
        { status: 502 }
      );
    }
    const raw = await r.json();
    const wabaTemplates = Array.isArray(raw.waba_templates)
      ? raw.waba_templates
      : Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw)
          ? raw
          : [];

    const templates = wabaTemplates.map((t: any) => ({
      id: t.id || t.name,
      name: t.name,
      language: t.language || (t.language?.code ? t.language.code : 'en_US'),
      components: Array.isArray(t.components)
        ? t.components.map((c: any) => ({
            type: c.type,
            text: c.text,
            format: c.format,
            example: c.example,
            buttons: c.buttons,
          }))
        : [],
    }));

    return NextResponse.json({ success: true, templates });
  } catch (e) {
    return NextResponse.json(
      { success: false, templates: [], error: (e as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
