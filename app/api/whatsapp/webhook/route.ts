import { NextRequest, NextResponse } from "next/server";
import { db as adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Constant-time string comparison to defeat timing attacks on the shared
 * webhook secret comparison.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify the inbound 360dialog webhook came from 360dialog by checking the
 * pre-shared secret configured in the 360dialog partner dashboard
 * (Settings → Webhooks → Custom headers).
 *
 * Returns true if the secret matches OR no secret is configured (dev only).
 * Returns false to indicate the webhook should be rejected.
 */
function verifyWebhookSecret(req: NextRequest): boolean {
  const expected = process.env.WHATSAPP_WEBHOOK_SECRET;
  // In production, missing config is a fatal misconfiguration — refuse traffic.
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[whatsapp/webhook] WHATSAPP_WEBHOOK_SECRET is not set; rejecting webhook in production.');
      return false;
    }
    // In dev, allow unsigned for local testing.
    return true;
  }
  const provided =
    req.headers.get('x-webhook-secret') ||
    req.headers.get('x-360-webhook-secret') ||
    '';
  return provided.length > 0 && timingSafeEqual(provided, expected);
}

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

    // Verify token must come from env. The previous hardcoded fallback
    // ('kyozo_webhook_token') has been removed — refuse if unset in prod.
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
    if (!verifyToken) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[whatsapp/webhook] WEBHOOK_VERIFY_TOKEN not configured');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
      }
      // Dev fallback so emulator setups still work; never used in prod.
      console.warn('[whatsapp/webhook] WEBHOOK_VERIFY_TOKEN not set, dev fallback in use');
    }

    if (mode === 'subscribe' && token && verifyToken && timingSafeEqual(token, verifyToken)) {
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
 * POST handler for incoming WhatsApp messages.
 *
 * SECURITY: requires the pre-shared `x-webhook-secret` header configured in
 * the 360dialog partner dashboard. Without a valid secret the request is
 * rejected.
 *
 * SECURITY: writes are now made via the Admin SDK (`@/firebase/admin`)
 * because firestore.rules locked down direct client SDK writes to
 * `messages_whatsapp` after the May 2026 audit.
 */
export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    console.warn('[whatsapp/webhook] Rejected POST: invalid or missing webhook secret');
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

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
                  
                  const usersCollection = adminDb.collection('users');
                  let userId: string | null = null;
                  let userName = senderName;

                  // Try wa_id first (most reliable)
                  let userSnapshot = await usersCollection.where('wa_id', '==', wa_id).limit(1).get();

                  if (!userSnapshot.empty) {
                    console.log(`[Webhook] ✅ Found user by wa_id: ${wa_id}`);
                  } else {
                    // Fallback: try phone formats
                    const phoneFormats = [
                      `+${senderPhone}`,      // +85260434478
                      senderPhone,            // 85260434478
                    ];
                    console.log(`[Webhook] wa_id not found, trying phone formats:`, phoneFormats);

                    for (const phoneFormat of phoneFormats) {
                      userSnapshot = await usersCollection.where('phoneNumber', '==', phoneFormat).limit(1).get();
                      if (!userSnapshot.empty) {
                        console.log(`[Webhook] Found user by phoneNumber: ${phoneFormat}`);
                        break;
                      }
                    }
                    if (userSnapshot.empty) {
                      for (const phoneFormat of phoneFormats) {
                        userSnapshot = await usersCollection.where('phone', '==', phoneFormat).limit(1).get();
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

                  // Save message to Firestore via Admin SDK
                  const messageData: any = {
                    messageId,
                    userId,
                    senderPhone: `+${senderPhone}`,
                    senderName: userName,
                    messageText,
                    messageType: message.type,
                    messagingService: 'whatsapp',
                    direction: 'incoming',
                    timestamp: FieldValue.serverTimestamp(),
                    whatsappTimestamp: timestamp,
                    read: false,
                    metadata: {
                      displayPhoneNumber: value.metadata?.display_phone_number,
                      phoneNumberId: value.metadata?.phone_number_id,
                    }
                  };
                  
                  // Add media data if it's a media message (image, video, audio, document, etc.)
                  if (mediaId) {
                    // Download media immediately using internal API call
                    try {
                      // Use request headers to construct base URL
                      const headers = new Headers(req.headers);
                      const protocol = (headers.get('x-forwarded-proto') || 'http').split(',')[0].trim();
                      const host = (headers.get('host') || 'localhost:3000').split(',')[0].trim();
                      const baseUrl = `${protocol}://${host}`;
                      
                      console.log(`[Webhook] Downloading media from: ${baseUrl}/api/whatsapp/media/${mediaId}`);
                      
                      const mediaResponse = await fetch(`${baseUrl}/api/whatsapp/media/${mediaId}`, {
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      });
                      
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
                        const errorText = await mediaResponse.text();
                        console.log(`[Webhook] ⚠️ Media download failed (${mediaResponse.status}): ${errorText}`);
                        // Fallback: store ID only
                        messageData.media = {
                          id: mediaId,
                          mimeType: mimeType,
                          fileName: fileName,
                        };
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
                  
                  await adminDb.collection('messages_whatsapp').add(messageData);

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
