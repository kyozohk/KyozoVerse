import { NextRequest, NextResponse } from "next/server";
import { db } from '@/firebase/firestore';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

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
                
                if (message.type === 'text' && message.text?.body) {
                  const senderPhone = message.from;
                  const messageText = message.text.body;
                  const messageId = message.id;
                  const timestamp = message.timestamp;
                  const senderName = contact?.profile?.name || 'Unknown';
                  
                  console.log(`[FROM USER] Sender: ${senderPhone} (${senderName}) | Message: ${messageText}`);
                  
                  // Find user by phone number
                  const usersRef = collection(db, 'users');
                  const phoneQuery = query(
                    usersRef,
                    where('phoneNumber', '==', `+${senderPhone}`)
                  );
                  const phoneQuery2 = query(
                    usersRef,
                    where('phone', '==', `+${senderPhone}`)
                  );
                  
                  let userSnapshot = await getDocs(phoneQuery);
                  if (userSnapshot.empty) {
                    userSnapshot = await getDocs(phoneQuery2);
                  }
                  
                  let userId = null;
                  if (!userSnapshot.empty) {
                    userId = userSnapshot.docs[0].id;
                  }
                  
                  // Save message to Firestore
                  const messagesRef = collection(db, 'whatsapp_messages');
                  await addDoc(messagesRef, {
                    messageId,
                    userId,
                    senderPhone,
                    senderName,
                    messageText,
                    direction: 'incoming', // incoming from user
                    timestamp: serverTimestamp(),
                    whatsappTimestamp: timestamp,
                    read: false,
                    metadata: {
                      displayPhoneNumber: value.metadata?.display_phone_number,
                      phoneNumberId: value.metadata?.phone_number_id,
                    }
                  });
                  
                  console.log(`✅ Message saved to Firestore for user ${userId || senderPhone}`);
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
