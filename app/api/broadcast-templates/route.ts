import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/firebase/admin-config';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Fetch all broadcast templates
export async function GET() {
  try {
    const templatesRef = adminFirestore.collection('broadcastTemplates');
    const snapshot = await templatesRef.orderBy('createdAt', 'desc').get();
    
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create a new broadcast template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, message, type } = body;
    
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }
    
    const templatesRef = adminFirestore.collection('broadcastTemplates');
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
