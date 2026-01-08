import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentValue, type } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Using stable model alias (fixed 404 error)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    let systemPrompt = '';
    if (type === 'short') {
      // Updated: Casual, emoji-friendly, humorous tone for subjects/labels
      systemPrompt = `You're a chill writing buddy who crafts short, catchy email subjects and form fields. 
Keep it simple, fun, use emojis where they fit naturally 😎, add a tiny wink of humor. 
One clean line, no quotes needed. Here's what to work with: ${prompt}`;
    } else {
      // Updated: Friendly, conversational emails with light humor + emojis
      systemPrompt = `You're the friendly email wizard who makes people actually want to read messages 📧✨. 
Write clear, warm, engaging content with simple words everyone gets. 
Sprinkle in well-placed emojis and a gentle smile of humor. Keep it professional but not stuffy. 
Topic: ${prompt}`;
    }

    const fullPrompt = currentValue 
      ? `${systemPrompt}\n\nCurrent draft: "${currentValue}"\n\nMake it better with your magic ✨`
      : systemPrompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
