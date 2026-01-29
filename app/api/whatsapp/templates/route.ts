import { NextRequest, NextResponse } from 'next/server';

// Reuse the same env pattern as send-template
const RAW_API_KEY =
  process.env.D360_API_KEY ||
  process.env.D360_DIALOG_API_KEY ||
  process.env['360_API_KEY'] ||
  '';

const API_KEY = RAW_API_KEY;
const WEBHOOK_URL = process.env['360_WEBHOOK'] || 'https://waba-v2.360dialog.io';

// Primary endpoint used by the reference project's direct-templates route
const DIRECT_TEMPLATES_URL = 'https://waba-v2.360dialog.io/message-templates';
// Fallback endpoint
const ALT_TEMPLATES_URL = `${WEBHOOK_URL}/v1/configs/templates`;

export async function GET(_req: NextRequest) {
  try {
    if (!API_KEY) {
      console.warn('[whatsapp/templates] No 360dialog API key configured');
      return NextResponse.json({ success: false, templates: [], error: 'Missing API key' }, { status: 200 });
    }

    // Helper to call an endpoint and return JSON or null
    const fetchFrom = async (url: string) => {
      console.log('[whatsapp/templates] Fetching templates from 360dialog', { url });
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'D360-API-KEY': API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      console.log('[whatsapp/templates] Response status:', res.status, res.statusText);
      if (!res.ok) return null;
      return res.json();
    };

    // Try direct message-templates endpoint first (returns waba_templates[])
    // NOTE: The direct endpoint consistently returns 404 for this account,
    // so we skip it and go straight to the working alternative endpoint.
    // Uncomment the lines below if you want to try both endpoints:
    // let raw = await fetchFrom(DIRECT_TEMPLATES_URL);
    // if (!raw) {
    //   console.log('[whatsapp/templates] Direct endpoint failed, trying alternative');
    //   raw = await fetchFrom(ALT_TEMPLATES_URL);
    // }
    
    // Use the working endpoint directly
    let raw = await fetchFrom(ALT_TEMPLATES_URL);

    if (!raw) {
      return NextResponse.json(
        { success: false, templates: [], error: 'Failed to fetch templates from 360dialog' },
        { status: 200 }
      );
    }

    // Reference direct-templates response shape:
    // { count, waba_templates: [ { id, name, language, components, ... } ] }
    const wabaTemplates = Array.isArray((raw as any).waba_templates)
      ? (raw as any).waba_templates
      : Array.isArray((raw as any).data)
        ? (raw as any).data
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
            format: c.format, // Preserve format field (e.g., "IMAGE", "TEXT", "DOCUMENT")
            example: c.example, // Preserve example field (contains header_handle for images)
            buttons: c.buttons, // Preserve buttons for button components
          }))
        : [],
    }));

    console.log('[whatsapp/templates] Normalized templates count:', templates.length);

    return NextResponse.json({ success: templates.length > 0, templates, raw }, { status: 200 });
  } catch (error) {
    console.error('[whatsapp/templates] Error fetching templates from 360dialog:', error);
    const message =
      error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : 'Unknown error';
    return NextResponse.json({ success: false, templates: [], error: message }, { status: 500 });
  }
}
