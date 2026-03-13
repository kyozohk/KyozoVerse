import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function POST(req: NextRequest, ctx: ApiContext) {
  if (!process.env.GEMINI_API_KEY) return apiError('AI service not configured.', 503);

  const body = await req.json().catch(() => ({}));
  const { prompt, type, currentValue } = body;

  if (!prompt) return apiError('prompt is required.', 400);
  if (type && !['short', 'long'].includes(type)) return apiError('type must be "short" or "long".', 400);

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  let systemPrompt = type === 'short'
    ? `You're a chill writing buddy who crafts short, catchy email subjects and form fields. Keep it simple, fun, use emojis where they fit naturally 😎. One clean line, no quotes. Topic: ${prompt}`
    : `You're a friendly email wizard who makes people actually want to read messages 📧✨. Write clear, warm, engaging content. Topic: ${prompt}`;

  const fullPrompt = currentValue
    ? `${systemPrompt}\n\nCurrent draft: "${currentValue}"\n\nImprove it:`
    : systemPrompt;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text().trim();

  return apiSuccess({ text, type: type || 'long', prompt });
}

export const POST_h = withApiAuth(POST, ['ai:generate']);
export { POST_h as POST };
