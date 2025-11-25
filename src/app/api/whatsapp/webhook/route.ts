import { NextRequest, NextResponse } from "next/server";
import { db } from '@/firebase/firestore';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * GET handler for webhook verification
 * 360dialog sends GET requests to verify the webhook endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[Webhook] GET verification request:', { mode, token, challenge });

    // Verify token (you can set a custom token in your env)
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'kyozo_webhook_token';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook] Verification successful');
      return new NextResponse(challenge, { status: 200 });
    }

    console.log('[Webhook] Verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  } catch (error) {
    console.error('[Webhook] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST handler for incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('WhatsApp webhook payload:', JSON.stringify(body, null, 2));

    // Parse 360dialog webhook structure
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const value = change.value;
            
            if (value?.messages && Array.isArray(value.messages)) {
              // Process each incoming message
              for (let i = 0; i < value.messages.length; i++) {
                const message = value.messages[i];
                const contact = value.contacts?.[i];
                
                // Handle all message types: text, image, video, audio, document, etc.
                if (message.type) {
                  const senderPhone = message.from;
                  const messageId = message.id;
                  const timestamp = message.timestamp;
                  const senderName = contact?.profile?.name || 'Unknown';
                  
                  // Extract message content based on type
                  let messageText = '';
                  let mediaId = null;
                  let mimeType = null;
                  let fileName = null;
                  
                  if (message.type === 'text') {
                    messageText = message.text?.body || '';
                    console.log(`[Webhook] Incoming TEXT from: ${senderPhone} (${senderName}) | Text: ${messageText}`);
                  } else if (message.type === 'image') {
                    messageText = message.image?.caption || '📷 Image';
                    mediaId = message.image?.id;
                    mimeType = message.image?.mime_type;
                    console.log(`[Webhook] Incoming IMAGE from: ${senderPhone} (${senderName}) | Caption: ${messageText} | MediaID: ${mediaId}`);
                  } else if (message.type === 'video') {
                    messageText = message.video?.caption || '🎥 Video';
                    mediaId = message.video?.id;
                    mimeType = message.video?.mime_type;
                    console.log(`[Webhook] Incoming VIDEO from: ${senderPhone} (${senderName}) | Caption: ${messageText} | MediaID: ${mediaId}`);
                  } else if (message.type === 'audio') {
                    messageText = '🎵 Audio';
                    mediaId = message.audio?.id;
                    mimeType = message.audio?.mime_type;
                    console.log(`[Webhook] Incoming AUDIO from: ${senderPhone} (${senderName}) | MediaID: ${mediaId}`);
                  } else if (message.type === 'document') {
                    fileName = message.document?.filename || 'Document';
                    messageText = message.document?.caption || `📄 ${fileName}`;
                    mediaId = message.document?.id;
                    mimeType = message.document?.mime_type;
                    console.log(`[Webhook] Incoming DOCUMENT from: ${senderPhone} (${senderName}) | File: ${fileName} | MediaID: ${mediaId}`);
                  } else if (message.type === 'voice') {
                    messageText = '🎤 Voice message';
                    mediaId = message.voice?.id;
                    mimeType = message.voice?.mime_type;
                    console.log(`[Webhook] Incoming VOICE from: ${senderPhone} (${senderName}) | MediaID: ${mediaId}`);
                  } else if (message.type === 'sticker') {
                    messageText = '🎨 Sticker';
                    mediaId = message.sticker?.id;
                    mimeType = message.sticker?.mime_type;
                    console.log(`[Webhook] Incoming STICKER from: ${senderPhone} (${senderName}) | MediaID: ${mediaId}`);
                  } else {
                    messageText = `📎 ${message.type}`;
                    console.log(`[Webhook] Incoming ${message.type.toUpperCase()} from: ${senderPhone} (${senderName})`);
                  }
                  
                  // Find user by wa_id (WhatsApp ID - phone without + and spaces)
                  const wa_id = senderPhone; // 360dialog sends it without +
                  
                  console.log(`[Webhook] Searching for user with wa_id: ${wa_id}`);
                  
                  const usersRef = collection(db, 'users');
                  let userId = null;
                  let userName = senderName;
                  
                  // Try wa_id first (most reliable)
                  const waIdQuery = query(usersRef, where('wa_id', '==', wa_id));
                  let userSnapshot = await getDocs(waIdQuery);
                  
                  if (!userSnapshot.empty) {
                    console.log(`[Webhook] ✅ Found user by wa_id: ${wa_id}`);
                  } else {
                    // Fallback: try phone formats
                    const phoneFormats = [
                      `+${senderPhone}`,      // +85260434478
                      senderPhone,            // 85260434478
                    ];
                    
                    console.log(`[Webhook] wa_id not found, trying phone formats:`, phoneFormats);
                    
                    // Try phoneNumber field
                    for (const phoneFormat of phoneFormats) {
                      const phoneQuery = query(usersRef, where('phoneNumber', '==', phoneFormat));
                      userSnapshot = await getDocs(phoneQuery);
                      if (!userSnapshot.empty) {
                        console.log(`[Webhook] Found user by phoneNumber: ${phoneFormat}`);
                        break;
                      }
                    }
                    
                    // Try phone field if not found
                    if (userSnapshot.empty) {
                      for (const phoneFormat of phoneFormats) {
                        const phoneQuery = query(usersRef, where('phone', '==', phoneFormat));
                        userSnapshot = await getDocs(phoneQuery);
                        if (!userSnapshot.empty) {
                          console.log(`[Webhook] Found user by phone: ${phoneFormat}`);
                          break;
                        }
                      }
                    }
                  }
                  
                  if (!userSnapshot.empty) {
                    const userDoc = userSnapshot.docs[0];
                    userId = userDoc.id;
                    const userData = userDoc.data();
                    userName = userData.displayName || senderName;
                    console.log(`[Webhook] ✅ Found user: ${userId} (${userName})`);
                  } else {
                    console.log(`[Webhook] ❌ User not found for wa_id: ${wa_id}`);
                  }
                  
                  // Save message to Firestore - using service-specific collection
                  const messagesRef = collection(db, 'messages_whatsapp');
                  const messageData: any = {
                    messageId,
                    userId,
                    senderPhone: `+${senderPhone}`,
                    senderName: userName,
                    messageText,
                    messageType: message.type, // 'text', 'image', 'video', etc.
                    messagingService: 'whatsapp', // Service type: whatsapp, email, sms, telegram, app, etc.
                    direction: 'incoming', // incoming from user
                    timestamp: serverTimestamp(),
                    whatsappTimestamp: timestamp,
                    read: false,
                    metadata: {
                      displayPhoneNumber: value.metadata?.display_phone_number,
                      phoneNumberId: value.metadata?.phone_number_id,
                    }
                  };
                  
                  // Add media data if it's a media message (image, video, audio, document, etc.)
                  if (mediaId) {
                    // Download media immediately
                    try {
                      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                      const mediaResponse = await fetch(`${baseUrl}/api/whatsapp/media/${mediaId}`);
                      
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        messageData.media = {
                          id: mediaId,
                          url: mediaData.url,
                          mimeType: mimeType,
                          fileName: fileName,
                        };
                        console.log(`[Webhook] ✅ Media downloaded: ${mediaData.url}`);
                      } else {
                        // Fallback: store ID only
                        messageData.media = {
                          id: mediaId,
                          mimeType: mimeType,
                          fileName: fileName,
                        };
                        console.log(`[Webhook] ⚠️ Media download failed, storing ID only`);
                      }
                    } catch (error) {
                      console.error(`[Webhook] Error downloading media:`, error);
                      // Fallback: store ID only
                      messageData.media = {
                        id: mediaId,
                        mimeType: mimeType,
                        fileName: fileName,
                      };
                    }
                  }
                  
                  await addDoc(messagesRef, messageData);
                  
                  console.log(`✅ ${message.type.toUpperCase()} message saved to Firestore for user ${userId || senderPhone}`);
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
