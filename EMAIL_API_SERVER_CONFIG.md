# 📧 Email API Server Configuration

## 🔧 Server Setup

### **Environment Variables**

Create or update your `.env.local` file with the following variables:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GoDaddy DNS API (for domain verification)
GODADDY_API_KEY=your_godaddy_api_key
GODADDY_API_SECRET=your_godaddy_api_secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

---

## 🚀 API Endpoints

### **1. Send Email API**

**Endpoint:** `POST /api/send-email`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "from": "Sender Name <sender@domain.com>",
  "subject": "Email Subject",
  "html": "<h1>HTML Content</h1><p>Email body</p>"
}
```

**Response:**
```json
{
  "success": true,
  "id": "26f84a87-9b1c-4aef-9f9d-b1f92cfe9526"
}
```

**Error Response:**
```json
{
  "error": "The domain is not verified. Please, add and verify your domain on https://resend.com/domains"
}
```

---

### **2. Email Domain Setup API**

**Endpoint:** `POST /api/setup-email-domain`

**Headers:**
```
Content-Type: application/json
```

**Request Actions:**

#### **List All Domains**
```json
{
  "action": "list"
}
```

#### **Get Domain Status**
```json
{
  "action": "get",
  "handle": "community-name"
}
```

#### **Add New Domain**
```json
{
  "handle": "community-name",
  "action": "add"
}
```

#### **Verify Domain**
```json
{
  "action": "verify",
  "handle": "community-name"
}
```

**Response:**
```json
{
  "success": true,
  "domain": "community-name.kyozo.com",
  "status": "pending",
  "domainId": "6feb31cb-dc5e-4ec2-986b-011175a205c4",
  "dnsRecords": [...],
  "godaddyResults": [...],
  "verifyResult": {...},
  "message": "DNS records added. Domain verification may take a few minutes."
}
```

---

## 📋 Server File Structure

```
app/api/
├── send-email/
│   └── route.ts          # Email sending endpoint
├── setup-email-domain/
│   └── route.ts          # Domain management endpoint
└── posts/
    └── delete/
        └── route.ts      # Post deletion (with email cleanup)
```

---

## 🔐 Authentication & Security

### **API Key Configuration**

The server uses the following API keys:

1. **Resend API Key** (`RESEND_API_KEY`)
   - Required for email sending
   - Get from: https://resend.com/api-keys

2. **GoDaddy API Keys** (`GODADDY_API_KEY`, `GODADDY_API_SECRET`)
   - Required for DNS record management
   - Get from: https://developer.godaddy.com/keys

### **Security Measures**

- Environment variables for sensitive data
- Request validation and sanitization
- Error handling without exposing sensitive information
- Rate limiting (implement as needed)

---

## 🏗️ Server Implementation Details

### **Email Sending Logic**

```typescript
// app/api/send-email/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, from, subject, html } = body;

    // Validation
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // API Key Check
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Default sender
    const fromAddress = from || 'Kyozo <dev@kyozo.com>';

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **Domain Management Logic**

```typescript
// app/api/setup-email-domain/route.ts
export async function POST(request: NextRequest) {
  const { handle, action, domain } = await request.json();
  
  // Environment checks
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
  const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET;

  // Action routing
  switch (action) {
    case 'list':
      return await listResendDomains();
    case 'get':
      return await getDomainDetails(handle, domain);
    case 'verify':
      return await verifyDomain(handle, domain);
    default:
      return await addDomain(handle, domain);
  }
}

async function addDomain(handle: string, domain: string) {
  // 1. Check if domain exists in Resend
  // 2. Add domain if not exists
  // 3. Get DNS records from Resend
  // 4. Add DNS records to GoDaddy
  // 5. Verify domain with Resend
  // 6. Return results
}
```

---

## 🔄 Domain Verification Process

### **Automatic DNS Setup**

1. **Domain Creation**: Add domain to Resend
2. **DNS Records**: Get required DNS records from Resend
3. **GoDaddy Integration**: Automatically add records to GoDaddy
4. **Verification**: Trigger domain verification
5. **Status Check**: Monitor verification status

### **DNS Record Types**

- **TXT Records**: Domain ownership verification
- **MX Records**: Email routing
- **DKIM Records**: Email authentication

---

## 📊 Monitoring & Logging

### **Server Logs**

```typescript
console.log('📧 [EMAIL] Sending email to:', to);
console.log('📧 [EMAIL] From address:', fromAddress);
console.log('📧 [DOMAIN] Setting up domain:', targetDomain);
console.log('📧 [GODADDY] Adding DNS records:', recordCount);
```

### **Error Tracking**

- Email sending failures
- Domain verification issues
- DNS record problems
- API key errors

---

## 🚦 Deployment Considerations

### **Environment Setup**

1. **Production Environment Variables**
   ```bash
   NODE_ENV=production
   RESEND_API_KEY=prod_api_key
   GODADDY_API_KEY=prod_godaddy_key
   ```

2. **Development Environment**
   ```bash
   NODE_ENV=development
   RESEND_API_KEY=dev_api_key
   ```

### **Server Requirements**

- Node.js 18+
- Next.js 13+
- Firebase Admin SDK
- Resend API access
- GoDaddy API access

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. API Key Not Found**
```
Error: RESEND_API_KEY not configured
```
**Solution**: Add `RESEND_API_KEY` to environment variables

#### **2. Domain Verification Failed**
```
Error: The domain is not verified
```
**Solution**: Use verified domains or complete domain setup

#### **3. GoDaddy API Error**
```
Error: GoDaddy API credentials not configured
```
**Solution**: Add GoDaddy API keys to environment

### **Debug Mode**

Enable debug logging:
```typescript
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) {
  console.log('🔍 Debug info:', debugData);
}
```

---

## 📈 Performance Optimization

### **Caching Strategy**

- Cache domain verification status
- Cache DNS record results
- Implement email queue for bulk sending

### **Rate Limiting**

```typescript
// Implement rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

---

## 🔗 API Dependencies

### **External Services**

1. **Resend API** - Email delivery service
   - Base URL: `https://api.resend.com`
   - Authentication: Bearer token

2. **GoDaddy API** - DNS management
   - Base URL: `https://api.godaddy.com`
   - Authentication: API Key + Secret

3. **Firebase Admin SDK** - Database and storage
   - Firestore for email logs
   - Storage for email attachments

---

## 📋 API Version Control

### **Current Version**: v1.0.0

### **Version History**
- v1.0.0 - Initial release with basic email sending
- v1.1.0 - Added domain management
- v1.2.0 - Enhanced error handling

### **Future Updates**
- Email templates management
- Bulk email sending
- Email analytics
- Webhook support

---

## 🚀 Quick Start Commands

### **Setup Server**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### **Test API Endpoints**
```bash
# Test email sending
curl -X POST "http://localhost:9003/api/send-email" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "html": "<h1>Test</h1>"}'

# Test domain setup
curl -X POST "http://localhost:9003/api/setup-email-domain" \
  -H "Content-Type: application/json" \
  -d '{"handle": "test", "action": "add"}'
```

---

## 📞 Support & Maintenance

### **Monitoring**
- Check server logs regularly
- Monitor email delivery rates
- Track domain verification status

### **Maintenance Tasks**
- Rotate API keys periodically
- Update DNS records as needed
- Monitor service quotas and limits

### **Backup Strategy**
- Backup environment variables
- Document custom configurations
- Maintain API key inventory

**🎉 The Email API Server is now configured and ready for production use!**
