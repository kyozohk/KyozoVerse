import { NextRequest, NextResponse } from 'next/server';

// Environment variables should be set in .env.local
// Support multiple possible env var names for the 360dialog API key,
// mirroring the reference project's behavior.
const RAW_API_KEY =
  process.env.D360_API_KEY ||
  process.env.D360_DIALOG_API_KEY ||
  process.env['360_API_KEY'] ||
  '';

const API_KEY_SOURCE = RAW_API_KEY
  ? (process.env.D360_API_KEY
      ? 'D360_API_KEY'
      : process.env.D360_DIALOG_API_KEY
        ? 'D360_DIALOG_API_KEY'
        : process.env['360_API_KEY']
          ? '360_API_KEY'
          : 'unknown')
  : null;

const API_KEY = RAW_API_KEY;

const WEBHOOK_URL = process.env['360_WEBHOOK'] || 'https://waba-v2.360dialog.io';
const API_URL = `${WEBHOOK_URL}/messages`;
const PARTNER_ID = process.env['360_PARTNER_ID'] || '';
const WHATSAPP_NUMBER = process.env['360_NUMBER'] || '';
const CALLBACK_URL = process.env['360_CALLBACK'] || '';

// Safe configuration log: never print secret values, only whether they exist
console.log('WhatsApp API Configuration (KyozoVerse):', {
  hasApiKey: !!API_KEY,
  apiKeySource: API_KEY_SOURCE,
  WEBHOOK_URL,
  API_URL,
  has_360_PARTNER_ID: !!PARTNER_ID,
  has_360_NUMBER: !!WHATSAPP_NUMBER,
  has_360_CALLBACK: !!CALLBACK_URL,
});

// Helper function to map component types to the correct format expected by the API
function mapComponentType(type: string): string {
  // Convert to uppercase for comparison
  const upperType = type.toUpperCase();
  
  // Map of component types that need special handling
  const typeMap: Record<string, string> = {
    'BUTTONS': 'BUTTON',
    'buttons': 'BUTTON',
    'button': 'BUTTON',
    'HEADER': 'HEADER',
    'header': 'HEADER',
    'BODY': 'BODY',
    'body': 'BODY',
    'FOOTER': 'FOOTER',
    'footer': 'FOOTER'
  };
  
  // Return the mapped type or the original if no mapping exists
  return typeMap[upperType] || typeMap[type] || upperType;
}

// Helper function to check if a template has a header with an image
function hasHeaderWithImage(template: any): boolean {
  if (!template.components || !Array.isArray(template.components)) {
    return false;
  }
  
  const headerComponent = template.components.find((comp: any) => 
    (comp.type === 'HEADER' || comp.type === 'header') &&
    comp.parameters && 
    Array.isArray(comp.parameters) &&
    comp.parameters.some((param: any) => param.type === 'image' && param.image?.link)
  );
  
  return !!headerComponent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.to || !body.template?.name) {
      return NextResponse.json(
        { error: 'Missing required fields: "to" and "template.name" are required' },
        { status: 400 }
      );
    }

    // Log which template and language we are about to send, for debugging 360 errors
    console.log('WhatsApp template debug (KyozoVerse):', {
      to: body.to,
      templateName: body.template.name,
      templateLanguage: body.template.language?.code || body.template.language,
    });

    // Log the incoming template structure
    console.log('Incoming template structure:', JSON.stringify(body.template, null, 2));
    
    // Format the request for 360dialog
    const payload: {
      to: string;
      type: string;
      template: {
        name: string;
        language: {
          code: string;
        };
        components: Array<{
          type: string;
          text?: string;
          parameters?: Array<any>;
          buttons?: Array<any>;
        }>;
      };
      messaging_product: string;
    } = {
      to: body.to,
      type: "template",
      template: {
        name: body.template.name,
        language: {
          code: body.template.language?.code || body.template.language || "en_US"
        },
        components: []
      },
      messaging_product: "whatsapp"
    };
    
    // Check if the template has a header with image
    const templateHasHeaderImage = hasHeaderWithImage(body.template);
    console.log(`Template ${body.template.name} has header with image: ${templateHasHeaderImage}`);
    
    // Only add components if they exist and are properly formatted
    if (body.template.components && Array.isArray(body.template.components) && body.template.components.length > 0) {
      // Process each component
      body.template.components.forEach((comp: any) => {
        if (!comp || !comp.type) return;
        
        // Map the component type to the correct format
        const componentType = mapComponentType(comp.type);
        
        // Create a clean component object
        const cleanComponent: any = {
          type: componentType
        };
        
        // Add text only for FOOTER. BODY text is defined in the template itself and
        // 360dialog rejects a "text" key on BODY components in the payload.
        if (comp.text && componentType === 'FOOTER') {
          cleanComponent.text = comp.text;
        }
        
        // Handle parameters based on component type
        if (comp.parameters && Array.isArray(comp.parameters) && comp.parameters.length > 0) {
          cleanComponent.parameters = comp.parameters.map((param: any) => {
            // Create a clean parameter
            const cleanParam: any = {
              type: param.type || 'text'
            };
            
            // Handle different parameter types
            if (param.type === 'image' && param.image?.link) {
              // Handle image parameter for header
              cleanParam.image = {
                link: param.image.link
              };
            } else if (param.type === 'document' && param.document?.link) {
              // Handle document parameter
              cleanParam.document = {
                link: param.document.link
              };
            } else if (param.type === 'video' && param.video?.link) {
              // Handle video parameter
              cleanParam.video = {
                link: param.video.link
              };
            } else {
              // Default to text parameter
              cleanParam.text = param.text || '';
            }
            
            return cleanParam;
          });
        }
        
        // Handle buttons specifically
        if (componentType === 'BUTTON' && comp.buttons && Array.isArray(comp.buttons)) {
          cleanComponent.buttons = comp.buttons.map((button: any) => {
            if (!button || !button.type) return null;
            
            // Create a clean button based on type
            if (button.type === 'URL' && button.text && button.url) {
              return {
                type: 'URL',
                text: button.text,
                url: button.url
              };
            } else if (button.type === 'PHONE_NUMBER' && button.text && button.phone_number) {
              return {
                type: 'PHONE_NUMBER',
                text: button.text,
                phone_number: button.phone_number
              };
            } else if (button.type === 'QUICK_REPLY' && button.text) {
              return {
                type: 'QUICK_REPLY',
                text: button.text
              };
            }
            return null;
          }).filter(Boolean);
        }
        
        // Add the component to the payload
        payload.template.components.push(cleanComponent);
      });
    }
    
    // Log the outgoing request
    console.log('Sending 360dialog template message:', JSON.stringify(payload, null, 2));
    
    // Check if API key is available
    if (!API_KEY) {
      console.warn('No 360dialog API key found. Simulating successful response.');
      
      // Return a simulated successful response for development
      return NextResponse.json({
        success: true,
        data: {
          messages: [
            {
              id: `simulated-${Date.now()}`,
              message_status: "accepted"
            }
          ]
        }
      });
    }
    
    // Set up headers
    const headers: Record<string, string> = {
      'D360-API-KEY': API_KEY,
      'Content-Type': 'application/json',
    };
    
    // If a specific WABA account ID is provided, we'll use the D360-WABA-ACCOUNT-ID header
    if (body.wabaAccountId) {
      console.log(`Using specific WABA account ID: ${body.wabaAccountId}`);
      headers['D360-WABA-ACCOUNT-ID'] = body.wabaAccountId;
    }
    
    // Send the request to 360dialog
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    // Get the response data
    const data = await response.json();

    // Log the response with HTTP status and any structured error info
    console.log('360dialog template response:', {
      httpStatus: response.status,
      ok: response.ok,
      errorMessage: data?.error?.message,
      errorCode: data?.error?.code,
      errorDetails: data?.error?.error_data?.details,
      raw: data,
    });
    
    // Store the message in our database for history
    // This would typically save to Firestore or another database
    console.log('Template message stored in history:', {
      to: body.to,
      template: body.template.name,
      timestamp: new Date().toISOString(),
      messageId: data.messages?.[0]?.id,
      status: response.ok ? 'sent' : 'failed'
    });
    
    // Return the response from 360dialog
    return NextResponse.json({
      success: response.ok,
      data,
      errorMessage: !response.ok && data.error ? 
        (typeof data.error === 'object' ? JSON.stringify(data.error) : data.error) : null
    });
  } catch (error) {
    console.error('Error sending WhatsApp template message:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : 'Unknown error';
        
    return NextResponse.json(
      { success: false, error: 'Failed to send WhatsApp template message', errorMessage },
      { status: 500 }
    );
  }
}
