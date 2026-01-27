# Kyozo Email API Documentation

## Overview

The Kyozo Email API allows you to send emails programmatically from your applications. This API is hosted at `pro.kyozo.com` and uses Resend as the email delivery provider.

## Base URL

```
https://pro.kyozo.com/api/v1/email
```

## Authentication

All API requests require an API key to be included in the request headers.

```
x-api-key: your_api_key_here
```

To obtain an API key, contact the Kyozo team or generate one from your dashboard.

---

## Endpoints

### Send Email

Send an email to one or more recipients.

**Endpoint:** `POST /api/v1/email/send`

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | Yes | Your Kyozo API key |
| `Content-Type` | Yes | Must be `application/json` |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string \| string[] | Yes | Recipient email address(es) |
| `subject` | string | Yes | Email subject line |
| `html` | string | Yes* | HTML content of the email |
| `text` | string | Yes* | Plain text content (required if html not provided) |
| `from` | string | No | Sender address (defaults to Kyozo) |
| `replyTo` | string | No | Reply-to email address |
| `communityName` | string | No | Community name to use in sender |

*Either `html` or `text` must be provided.

#### Example Request

```bash
curl -X POST 'https://pro.kyozo.com/api/v1/email/send' \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from Kyozo",
    "html": "<h1>Welcome!</h1><p>This is a test email from Kyozo.</p>",
    "communityName": "My Community"
  }'
```

#### Example Request (Multiple Recipients)

```bash
curl -X POST 'https://pro.kyozo.com/api/v1/email/send' \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": ["user1@example.com", "user2@example.com"],
    "subject": "Community Update",
    "html": "<h1>New Update!</h1><p>Check out the latest news.</p>",
    "replyTo": "admin@mycommunity.com"
  }'
```

#### Success Response

```json
{
  "success": true,
  "id": "email_abc123xyz",
  "message": "Email sent successfully to 1 recipient(s)"
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "Invalid or missing API key",
  "code": "UNAUTHORIZED"
}
```

**400 Bad Request**
```json
{
  "error": "Missing required field: subject",
  "code": "MISSING_FIELD"
}
```

**500 Server Error**
```json
{
  "error": "Email service not configured",
  "code": "SERVICE_ERROR"
}
```

---

## Code Examples

### JavaScript / Node.js

```javascript
const sendEmail = async () => {
  const response = await fetch('https://pro.kyozo.com/api/v1/email/send', {
    method: 'POST',
    headers: {
      'x-api-key': 'your_api_key_here',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: 'recipient@example.com',
      subject: 'Hello from Kyozo',
      html: '<h1>Welcome!</h1><p>This is a test email.</p>',
    }),
  });

  const data = await response.json();
  console.log(data);
};

sendEmail();
```

### Python

```python
import requests

url = 'https://pro.kyozo.com/api/v1/email/send'
headers = {
    'x-api-key': 'your_api_key_here',
    'Content-Type': 'application/json'
}
payload = {
    'to': 'recipient@example.com',
    'subject': 'Hello from Kyozo',
    'html': '<h1>Welcome!</h1><p>This is a test email.</p>'
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### Swift (iOS)

```swift
import Foundation

func sendEmail() {
    let url = URL(string: "https://pro.kyozo.com/api/v1/email/send")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("your_api_key_here", forHTTPHeaderField: "x-api-key")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = [
        "to": "recipient@example.com",
        "subject": "Hello from Kyozo",
        "html": "<h1>Welcome!</h1><p>This is a test email.</p>"
    ]
    
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let data = data {
            print(String(data: data, encoding: .utf8) ?? "")
        }
    }.resume()
}
```

### Kotlin (Android)

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

fun sendEmail() {
    val client = OkHttpClient()
    
    val json = JSONObject().apply {
        put("to", "recipient@example.com")
        put("subject", "Hello from Kyozo")
        put("html", "<h1>Welcome!</h1><p>This is a test email.</p>")
    }
    
    val body = json.toString()
        .toRequestBody("application/json".toMediaType())
    
    val request = Request.Builder()
        .url("https://pro.kyozo.com/api/v1/email/send")
        .addHeader("x-api-key", "your_api_key_here")
        .post(body)
        .build()
    
    client.newCall(request).execute().use { response ->
        println(response.body?.string())
    }
}
```

---

## Email Templates

### Basic HTML Template

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5B4A3A; margin: 0; font-size: 24px;">Your Community Name</h1>
      </div>
      <div style="color: #374151; font-size: 16px; line-height: 1.6;">
        <p>Hi {{name}},</p>
        <p>Your message content goes here.</p>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent via Kyozo</p>
      </div>
    </div>
  </body>
</html>
```

---

## Rate Limits

- **Free tier:** 100 emails/day
- **Pro tier:** 10,000 emails/day
- **Enterprise:** Unlimited

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Best Practices

1. **Always use HTML and text versions** - Some email clients don't render HTML
2. **Keep subject lines under 50 characters** - Better deliverability
3. **Include unsubscribe links** - Required for compliance
4. **Test with multiple email providers** - Gmail, Outlook, Yahoo, etc.
5. **Handle errors gracefully** - Implement retry logic for failed sends

---

## Support

For questions or issues, contact:
- Email: support@kyozo.com
- Documentation: https://pro.kyozo.com/docs
- Status: https://status.kyozo.com
