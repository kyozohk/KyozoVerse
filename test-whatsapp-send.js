/**
 * Simple test script to send WhatsApp template message via local API
 * 
 * Usage: node test-whatsapp-send.js
 */

const http = require('http');

// Hardcoded configuration
const CONFIG = {
  localApiUrl: 'http://localhost:9003',
  recipientPhone: '85260434478', // +852-6043-4478 (without + and -)
  templateName: 'sample_1',
  variable1: 'Ashok',
  variable2: 'Kyozo Test',
  headerImageUrl: 'https://images.unsplash.com/photo-1761839259484-4741afbbdcbf?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

/**
 * Send WhatsApp template message via local API
 */
function sendWhatsAppMessage() {
  const payload = {
    to: CONFIG.recipientPhone,
    type: 'template',
    template: {
      name: CONFIG.templateName,
      language: {
        code: 'en_US'
      },
      components: [
        {
          type: 'HEADER',
          parameters: [
            {
              type: 'image',
              image: {
                link: CONFIG.headerImageUrl
              }
            }
          ]
        },
        {
          type: 'BODY',
          parameters: [
            {
              type: 'text',
              text: CONFIG.variable1
            },
            {
              type: 'text',
              text: CONFIG.variable2
            }
          ]
        }
      ]
    },
    messaging_product: 'whatsapp'
  };

  const payloadString = JSON.stringify(payload);

  const options = {
    hostname: 'localhost',
    port: 9003,
    path: '/api/whatsapp/send-template',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString)
    }
  };

  console.log('Sending WhatsApp message via local API...');
  console.log('API URL:', CONFIG.localApiUrl + '/api/whatsapp/send-template');
  console.log('Recipient:', CONFIG.recipientPhone);
  console.log('Template:', CONFIG.templateName);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('---');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
      console.log('Response Body:', data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('---');
        console.log('Parsed Response:', JSON.stringify(jsonData, null, 2));
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Message sent successfully!');
          if (jsonData.messages && jsonData.messages[0]) {
            console.log('Message ID:', jsonData.messages[0].id);
          }
        } else {
          console.log('❌ Message failed to send');
          if (jsonData.error) {
            console.log('Error:', jsonData.error);
          }
        }
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.write(payloadString);
  req.end();
}

// Run the script
console.log('=== 360dialog WhatsApp Test Script ===');
console.log('');
sendWhatsAppMessage();
