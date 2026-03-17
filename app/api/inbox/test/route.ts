import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Test endpoint to simulate an incoming email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderEmail = 'test@example.com', senderName = 'Test User', messageText = 'This is a test message', communityId } = body;

    // If no communityId provided, try to find it from the sender's email
    let finalCommunityId = communityId;
    
    if (!finalCommunityId && senderEmail) {
      const membersQuery = await adminDb
        .collection('communityMembers')
        .where('userDetails.email', '==', senderEmail)
        .limit(1)
        .get();
      
      if (!membersQuery.empty) {
        finalCommunityId = membersQuery.docs[0].data().communityId;
      }
    }

    // Store a test message
    const messageData = {
      senderEmail,
      senderName,
      userId: null,
      communityId: finalCommunityId || null,
      recipientEmail: 'inbox@kyozo.com',
      subject: 'Test Message',
      messageText,
      htmlContent: null,
      direction: 'incoming' as const,
      type: 'email' as const,
      read: false,
      broadcastId: null,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        from: senderEmail,
        to: 'inbox@kyozo.com',
        messageId: `test-${Date.now()}`,
        inReplyTo: null,
      },
    };

    const docRef = await adminDb.collection('inboxMessages').add(messageData);

    console.log(`✅ Test inbox message created: ${docRef.id}`);

    return NextResponse.json({ 
      success: true, 
      messageId: docRef.id,
      message: 'Test message created successfully'
    });

  } catch (error: any) {
    console.error('Error creating test message:', error);
    return NextResponse.json(
      { error: 'Failed to create test message', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint for inbox messages',
    usage: {
      POST: {
        description: 'Create a test inbox message',
        body: {
          senderEmail: 'string (optional)',
          senderName: 'string (optional)',
          messageText: 'string (optional)'
        }
      }
    }
  });
}
