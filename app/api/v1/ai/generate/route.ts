import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * POST /api/v1/ai/generate
 *
 * Body: { prompt: string, currentValue?: string, type?: 'short' | 'long' }
 * Returns: { text: string }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'ai:generate' });
  if (!auth.ok) return auth.response;

  try {
    const { prompt, currentValue, type } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: prompt', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured', code: 'SERVICE_ERROR' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const systemPrompt =
      type === 'short'
        ? `You're a chill writing buddy who crafts short, catchy email subjects and form fields. Keep it simple, fun, use emojis where they fit naturally, add a tiny wink of humor. One clean line, no quotes. Topic: ${prompt}`
        : `You're the friendly email wizard who makes people actually want to read messages. Write clear, warm, engaging content with simple words, well-placed emojis, and a gentle smile of humor. Keep it professional but not stuffy. Topic: ${prompt}`;

    const fullPrompt = currentValue
      ? `${systemPrompt}\n\nCurrent draft: "${currentValue}"\n\nMake it better.`
      : systemPrompt;

    const result = await model.generateContent(fullPrompt);
    const text = (await result.response).text();

    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    console.error('[v1/ai/generate] error:', e);
    return NextResponse.json(
      { error: 'Failed to generate content', details: (e as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
