import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
    console.log('WhatsApp webhook payload:', JSON.stringify(body, null, 2));

  if (body.contacts && body.messages) {
    // Log each incoming message from WhatsApp user
    body.messages.forEach((message: any, idx: number) => {
      if (message.text && message.text.body) {
        const sender = body.contacts[idx]?.wa_id; // WhatsApp number of sender
        console.log(`[FROM USER] Sender: ${sender} | Message: ${message.text.body}`);
      }
    });

    return NextResponse.json({ ok: true });
  }

  // If not a WhatsApp reply (no body/messages)
  return NextResponse.json({ ok: true });
}
