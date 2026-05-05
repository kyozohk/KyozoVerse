import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

/** GET /api/v1/broadcast-templates — list templates (newest first). */
export async function GET(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'broadcast:read' });
  if (!auth.ok) return auth.response;

  try {
    const snap = await db
      .collection('broadcastTemplates')
      .orderBy('createdAt', 'desc')
      .get();
    const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ templates });
  } catch (e) {
    console.error('[v1/broadcast-templates GET]', e);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: (e as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/broadcast-templates
 *
 * Body: { name: string, message: string, subject?: string, type?: 'email' | 'whatsapp' }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'broadcast:write' });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { name, subject, message, type } = body || {};

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    const ref = await db.collection('broadcastTemplates').add({
      name,
      subject: subject || '',
      message,
      type: type || 'email',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { id: ref.id, message: 'Template created successfully' },
      { status: 201 }
    );
  } catch (e) {
    console.error('[v1/broadcast-templates POST]', e);
    return NextResponse.json(
      { error: 'Failed to create template', details: (e as Error).message },
      { status: 500 }
    );
  }
}
