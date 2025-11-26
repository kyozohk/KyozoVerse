
/**
 * Simple test script to send an email via the local API using Resend.
 * 
 * Usage: node test-email-send.js
 */

const http = require('http');

const emailData = {
  to: 'ashok@kyozo.com',
  subject: 'Test Email from Kyozo App',
  html: '<h1>Hello!</h1><p>This is a test email sent from the Kyozo application using Resend.</p>',
};

const payloadString = JSON.stringify(emailData);

const options = {
  hostname: 'localhost',
  port: 9003, // Based on your package.json dev script
  path: '/api/send-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payloadString)
  }
};

console.log('Sending test email via local API...');
console.log('API URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Recipient:', emailData.to);
console.log('Payload:', JSON.stringify(emailData, null, 2));
console.log('---');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('---');
      console.log('Parsed Response:', JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('✅ Email sent successfully!');
        if (jsonData.id) {
          console.log('Message ID:', jsonData.id);
        }
      } else {
        console.log('❌ Email failed to send');
        if (jsonData.error) {
          console.log('Error:', jsonData.error);
        }
      }
    } catch (e) {
      console.log('Could not parse response as JSON. Raw response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(payloadString);
req.end();
