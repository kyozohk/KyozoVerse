import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin at module load time (same pattern as upload route)
let app: App;

try {
  if (!getApps().length) {
    console.log('[broadcast-templates] Firebase Admin SDK initialization:');
    console.log('[broadcast-templates] Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('[broadcast-templates] Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('[broadcast-templates] Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
    });
    
    console.log('[broadcast-templates] Firebase Admin SDK initialized successfully');
  } else {
    console.log('[broadcast-templates] Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('[broadcast-templates] Error initializing Firebase Admin SDK:', error);
}

function getDb() {
  return getFirestore();
}

// GET - Fetch all broadcast templates
export async function GET() {
  try {
    console.log('[broadcast-templates] GET request received');
    const db = getDb();
    console.log('[broadcast-templates] Got Firestore instance');
    
    const templatesRef = db.collection('broadcastTemplates');
    console.log('[broadcast-templates] Fetching templates...');
    
    const snapshot = await templatesRef.orderBy('createdAt', 'desc').get();
    console.log('[broadcast-templates] Found', snapshot.docs.length, 'templates');
    
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error: any) {
    console.error('[broadcast-templates] Error fetching templates:', error?.message || error);
    console.error('[broadcast-templates] Error stack:', error?.stack);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new broadcast template
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, subject, message, type } = body;
    
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }
    
    const templatesRef = db.collection('broadcastTemplates');
    const docRef = await templatesRef.add({
      name,
      subject: subject || '',
      message,
      type: type || 'email',
      createdAt: FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json(
      { id: docRef.id, message: 'Template created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
