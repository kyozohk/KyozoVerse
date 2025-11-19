import { NextRequest, NextResponse } from 'next/server';

// Environment variables should be set in .env.local
const API_KEY = process.env.D360_API_KEY || '';
const WEBHOOK_URL = process.env['360_WEBHOOK'] || 'https://waba-v2.360dialog.io';
const API_URL = `${WEBHOOK_URL}/pricing`;
const PARTNER_ID = process.env['360_PARTNER_ID'] || '';
const WHATSAPP_NUMBER = process.env['360_NUMBER'] || '';
const CALLBACK_URL = process.env['360_CALLBACK'] || '';

console.log('WhatsApp Pricing API Configuration:', {
  API_KEY: API_KEY ? '✓ Set' : '✗ Missing',
  API_URL,
  PARTNER_ID: PARTNER_ID ? '✓ Set' : '✗ Missing',
  WHATSAPP_NUMBER: WHATSAPP_NUMBER ? '✓ Set' : '✗ Missing',
  CALLBACK_URL: CALLBACK_URL ? '✓ Set' : '✗ Missing',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (body.recipientCount === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: recipientCount' },
        { status: 400 }
      );
    }
    
    // If no API key is available, return simulated pricing
    if (!API_KEY) {
      console.warn('No 360dialog API key found. Returning simulated pricing.');
      
      // Return simulated pricing data
      return NextResponse.json({
        success: true,
        pricing: {
          recipientCount: body.recipientCount,
          messageRate: 0.005,
          totalCost: body.recipientCount * 0.005,
          currency: 'USD',
          isTemplate: body.isTemplate || true,
          templateName: body.templateName || 'Unknown',
          source: 'simulated'
        }
      });
    }
    
    // Set up headers
    const headers = {
      'D360-API-KEY': API_KEY,
      'Content-Type': 'application/json',
    };
    
    // Send the request to 360dialog pricing API
    const response = await fetch(API_URL, {
      method: 'GET',
      headers,
    });
    
    // Get the response data
    const data = await response.json();
    
    // Log the response
    console.log('360dialog pricing response:', JSON.stringify(data, null, 2));
    
    // Check if the response contains pricing information
    if (response.ok && data.pricing) {
      // Calculate total cost based on recipient count and message rate
      const messageRate = data.pricing.template_message || 0.005;
      const totalCost = body.recipientCount * messageRate;
      
      return NextResponse.json({
        success: true,
        pricing: {
          recipientCount: body.recipientCount,
          messageRate,
          totalCost,
          currency: data.pricing.currency || 'USD',
          isTemplate: body.isTemplate || true,
          templateName: body.templateName || 'Unknown',
          source: 'api'
        }
      });
    } else {
      // If pricing info is not available, return estimated pricing
      return NextResponse.json({
        success: true,
        pricing: {
          recipientCount: body.recipientCount,
          messageRate: 0.005,
          totalCost: body.recipientCount * 0.005,
          currency: 'USD',
          isTemplate: body.isTemplate || true,
          templateName: body.templateName || 'Unknown',
          source: 'estimated'
        }
      });
    }
  } catch (error) {
    console.error('Error checking WhatsApp pricing:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : 'Unknown error';
        
    return NextResponse.json(
      { success: false, error: 'Failed to check WhatsApp pricing', errorMessage },
      { status: 500 }
    );
  }
}
