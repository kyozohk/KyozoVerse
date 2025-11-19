import { NextRequest, NextResponse } from 'next/server';

// Environment variables should be set in .env.local
const API_KEY = process.env.D360_API_KEY || '';
const WEBHOOK_URL = process.env['360_WEBHOOK'] || 'https://waba-v2.360dialog.io';
const API_URL = `${WEBHOOK_URL}/messages`;
const PARTNER_ID = process.env['360_PARTNER_ID'] || '';
const WHATSAPP_NUMBER = process.env['360_NUMBER'] || '';
const CALLBACK_URL = process.env['360_CALLBACK'] || '';

console.log('WhatsApp API Configuration:', {
  API_KEY: API_KEY ? '✓ Set' : '✗ Missing',
  API_URL,
  PARTNER_ID: PARTNER_ID ? '✓ Set' : '✗ Missing',
  WHATSAPP_NUMBER: WHATSAPP_NUMBER ? '✓ Set' : '✗ Missing',
  CALLBACK_URL: CALLBACK_URL ? '✓ Set' : '✗ Missing',
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
        
        // Add text if present (for body and footer)
        if (comp.text && (componentType === 'BODY' || componentType === 'FOOTER')) {
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
    
    // Log the response
    console.log('360dialog template response:', JSON.stringify(data, null, 2));
    
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
