# 📱 Mobile App Email API Integration Guide

## 🎯 Overview

This guide provides instructions for integrating the KyozoVerse Email API into your mobile application for sending verification emails, notifications, and other communications.

---

## 🔗 API Base URL

### **Development**
```
http://localhost:9003/api/send-email
```

### **Production**
```
https://your-domain.com/api/send-email
```

---

## 📧 Email Sending Endpoint

### **Endpoint Details**
- **URL**: `/api/send-email`
- **Method**: `POST`
- **Content-Type**: `application/json`

### **Request Body Structure**
```json
{
  "to": "recipient@example.com",
  "from": "Sender Name <sender@domain.com>",
  "subject": "Email Subject",
  "html": "<h1>HTML Content</h1><p>Email body</p>"
}
```

### **Required Fields**
- `to` - Recipient email address
- `subject` - Email subject line
- `html` - HTML email content

### **Optional Fields**
- `from` - Custom sender (defaults to `Kyozo <dev@kyozo.com>`)

---

## 📱 Mobile App Integration

### **1. HTTP Client Setup**

#### **iOS (Swift)**
```swift
import Foundation

class EmailService {
    private let baseURL: String
    private let session: URLSession
    
    init(baseURL: String = "http://localhost:9003") {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }
    
    struct EmailRequest: Codable {
        let to: String
        let from: String?
        let subject: String
        let html: String
    }
    
    struct EmailResponse: Codable {
        let success: Bool
        let id: String?
        let error: String?
    }
    
    func sendEmail(request: EmailRequest) async throws -> EmailResponse {
        let url = URL(string: "\(baseURL)/api/send-email")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        urlRequest.httpBody = try JSONEncoder().encode(request)
        
        let (data, response) = try await session.data(for: urlRequest)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw EmailError.serverError
        }
        
        let emailResponse = try JSONDecoder().decode(EmailResponse.self, from: data)
        
        if !emailResponse.success {
            throw EmailError.emailFailed(emailResponse.error ?? "Unknown error")
        }
        
        return emailResponse
    }
}

enum EmailError: Error, LocalizedError {
    case serverError
    case emailFailed(String)
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .serverError:
            return "Server error occurred"
        case .emailFailed(let message):
            return "Email sending failed: \(message)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}
```

#### **Android (Kotlin)**
```kotlin
import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

data class EmailRequest(
    val to: String,
    val from: String? = null,
    val subject: String,
    val html: String
)

data class EmailResponse(
    val success: Boolean,
    val id: String? = null,
    val error: String? = null
)

class EmailService(private val context: Context) {
    private val client = OkHttpClient()
    private val gson = Gson()
    private val baseURL = "http://localhost:9003"
    
    suspend fun sendEmail(request: EmailRequest): Result<EmailResponse> = withContext(Dispatchers.IO) {
        try {
            val json = gson.toJson(request)
            val requestBody = json.toRequestBody("application/json".toMediaType())
            
            val httpRequest = Request.Builder()
                .url("$baseURL/api/send-email")
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .build()
            
            val response = client.newCall(httpRequest).execute()
            
            if (!response.isSuccessful) {
                return@withContext Result.failure(IOException("Unexpected code $response"))
            }
            
            val responseBody = response.body?.string()
                ?: return@withContext Result.failure(IOException("Empty response"))
            
            val emailResponse = gson.fromJson(responseBody, EmailResponse::class.java)
            
            if (emailResponse.success) {
                Result.success(emailResponse)
            } else {
                Result.failure(Exception(emailResponse.error ?: "Unknown error"))
            }
            
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### **React Native**
```javascript
import axios from 'axios';

class EmailService {
    constructor(baseURL = 'http://localhost:9003') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async sendEmail({ to, from, subject, html }) {
        try {
            const response = await this.client.post('/api/send-email', {
                to,
                from,
                subject,
                html,
            });

            return {
                success: response.data.success,
                id: response.data.id,
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            throw new Error(`Email sending failed: ${errorMessage}`);
        }
    }
}

export default new EmailService();
```

#### **Flutter (Dart)**
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class EmailService {
  final String baseUrl;
  
  EmailService({this.baseUrl = 'http://localhost:9003'});
  
  Future<EmailResponse> sendEmail({
    required String to,
    String? from,
    required String subject,
    required String html,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/send-email'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'to': to,
          'from': from,
          'subject': subject,
          'html': html,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success']) {
        return EmailResponse(
          success: true,
          id: data['id'],
        );
      } else {
        throw EmailException(data['error'] ?? 'Unknown error');
      }
    } catch (e) {
      throw EmailException(e.toString());
    }
  }
}

class EmailResponse {
  final bool success;
  final String? id;
  final String? error;
  
  EmailResponse({required this.success, this.id, this.error});
}

class EmailException implements Exception {
  final String message;
  EmailException(this.message);
  
  @override
  String toString() => 'EmailException: $message';
}
```

---

## 📋 Use Cases

### **1. Email Verification**

#### **iOS Implementation**
```swift
func sendVerificationEmail(to email: String, verificationCode: String) async {
    let html = """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0;">📧 Verify Your Email</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Your Verification Code</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">\(verificationCode)</span>
            </div>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
    </div>
    """
    
    let request = EmailService.EmailRequest(
        to: email,
        subject: "📧 Verify Your Email Address",
        html: html
    )
    
    do {
        let response = try await emailService.sendEmail(request: request)
        print("✅ Verification email sent: \(response.id)")
    } catch {
        print("❌ Failed to send verification email: \(error.localizedDescription)")
        throw error
    }
}
```

#### **Android Implementation**
```kotlin
suspend fun sendVerificationEmail(email: String, verificationCode: String): Result<String> {
    val html = """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0;">📧 Verify Your Email</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Your Verification Code</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">$verificationCode</span>
                </div>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
            </div>
        </div>
    """.trimIndent()
    
    val request = EmailRequest(
        to = email,
        subject = "📧 Verify Your Email Address",
        html = html
    )
    
    return emailService.sendEmail(request).fold(
        onSuccess = { response ->
            Result.success(response.id ?: "unknown")
        },
        onFailure = { error ->
            Result.failure(error)
        }
    )
}
```

### **2. Welcome Email**

#### **React Native Implementation**
```javascript
const sendWelcomeEmail = async (userEmail, userName) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0;">🎉 Welcome to KyozoVerse!</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Welcome, ${userName}!</h2>
                <p style="color: #666;">We're excited to have you join our community. Here's what you can do next:</p>
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #4CAF50;">🚀 Getting Started</h3>
                    <ul style="color: #555;">
                        <li>✅ Complete your profile</li>
                        <li>🎨 Explore communities</li>
                        <li>👥 Connect with members</li>
                        <li>📱 Use our mobile app</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="#" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
                </div>
            </div>
        </div>
    `;
    
    try {
        const response = await emailService.sendEmail({
            to: userEmail,
            subject: '🎉 Welcome to KyozoVerse!',
            html: html
        });
        
        console.log('✅ Welcome email sent:', response.id);
        return response;
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error.message);
        throw error;
    }
};
```

### **3. Password Reset**

#### **Flutter Implementation**
```dart
Future<void> sendPasswordResetEmail(String email, String resetLink) async {
  final html = '''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0;">🔐 Reset Your Password</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666;">We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="$resetLink" style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email. This link will expire in 1 hour.</p>
        </div>
    </div>
  ''';
  
  try {
    final response = await emailService.sendEmail(
      to: email,
      subject: '🔐 Reset Your Password',
      html: html,
    );
    
    print('✅ Password reset email sent: ${response.id}');
  } catch (e) {
    print('❌ Failed to send password reset email: $e');
    rethrow;
  }
}
```

---

## 🔧 Configuration

### **Environment Configuration**

#### **iOS (Info.plist)**
```xml
<key>EmailAPIBaseURL</key>
<string>$(EMAIL_API_BASE_URL)</string>
```

#### **Android (build.gradle)**
```gradle
android {
    defaultConfig {
        buildConfigField "String", "EMAIL_API_BASE_URL", "\"$EMAIL_API_BASE_URL\""
    }
}
```

#### **React Native (.env)**
```env
EMAIL_API_BASE_URL=http://localhost:9003
```

#### **Flutter (pubspec.yaml)**
```yaml
flutter:
  assets:
    - .env
```

### **Production URLs**
```bash
# Development
EMAIL_API_BASE_URL=http://localhost:9003

# Staging
EMAIL_API_BASE_URL=https://staging.kyozo.com

# Production
EMAIL_API_BASE_URL=https://api.kyozo.com
```

---

## 🛡️ Error Handling

### **Common Error Scenarios**

#### **1. Network Issues**
```swift
// iOS
catch {
    case EmailError.networkError(let networkError):
        showUserAlert(title: "Network Error", message: "Please check your internet connection and try again.")
    case EmailError.serverError:
        showUserAlert(title: "Server Error", message: "Our servers are experiencing issues. Please try again later.")
}
```

#### **2. Domain Verification Issues**
```kotlin
// Android
when (error) {
    is EmailException -> {
        when {
            error.message.contains("domain not verified") -> {
                // Use fallback sender
                sendWithFallbackSender(email, subject, html)
            }
            error.message.contains("Invalid email address") -> {
                showUserError("Please enter a valid email address")
            }
            else -> {
                showUserError("Failed to send email: ${error.message}")
            }
        }
    }
}
```

#### **3. Rate Limiting**
```javascript
// React Native
const sendEmailWithRetry = async (emailData, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await emailService.sendEmail(emailData);
            return response;
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};
```

---

## 📊 Logging & Analytics

### **iOS Logging**
```swift
import os.log

let logger = Logger(subsystem: "com.kyozo.mobile", category: "EmailService")

func sendEmail(request: EmailRequest) async throws -> EmailResponse {
    logger.info("Sending email to: \(request.to)")
    
    let startTime = CFAbsoluteTimeGetCurrent()
    defer {
        let duration = CFAbsoluteTimeGetCurrent() - startTime
        logger.info("Email request completed in \(duration) seconds")
    }
    
    // ... email sending logic
    
    if response.success {
        logger.info("Email sent successfully with ID: \(response.id ?? "unknown")")
    } else {
        logger.error("Email sending failed: \(response.error ?? "unknown")")
    }
    
    return response
}
```

### **Android Logging**
```kotlin
import timber.log.Timber

class EmailService(private val context: Context) {
    private val logger = Timber.tag("EmailService")
    
    suspend fun sendEmail(request: EmailRequest): Result<EmailResponse> {
        logger.i("Sending email to: ${request.to}")
        
        val startTime = System.currentTimeMillis()
        
        return try {
            val result = performEmailRequest(request)
            val duration = System.currentTimeMillis() - startTime
            
            if (result.isSuccess) {
                logger.i("Email sent successfully in ${duration}ms")
            } else {
                logger.e("Email sending failed in ${duration}ms")
            }
            
            result
        } catch (e: Exception) {
            val duration = System.currentTimeMillis() - startTime
            logger.e(e, "Email sending failed after ${duration}ms")
            Result.failure(e)
        }
    }
}
```

---

## 🧪 Testing

### **Unit Tests**

#### **iOS (XCTest)**
```swift
import XCTest
@testable import YourApp

class EmailServiceTests: XCTestCase {
    var emailService: EmailService!
    
    override func setUp() {
        super.setUp()
        emailService = EmailService(baseURL: "http://localhost:9003")
    }
    
    func testSendEmailSuccess() async throws {
        let request = EmailRequest(
            to: "test@example.com",
            subject: "Test",
            html: "<h1>Test</h1>"
        )
        
        let response = try await emailService.sendEmail(request: request)
        
        XCTAssertTrue(response.success)
        XCTAssertNotNil(response.id)
    }
    
    func testSendEmailFailure() async {
        let request = EmailRequest(
            to: "invalid-email",
            subject: "Test",
            html: "<h1>Test</h1>"
        )
        
        do {
            _ = try await emailService.sendEmail(request: request)
            XCTFail("Expected error")
        } catch {
            XCTAssertTrue(error is EmailError)
        }
    }
}
```

#### **Android (JUnit)**
```kotlin
import org.junit.Test
import org.junit.Assert.*
import kotlinx.coroutines.runBlocking

class EmailServiceTest {
    private val emailService = EmailService(InstrumentationRegistry.getInstrumentation().targetContext)
    
    @Test
    fun sendEmailSuccess() = runBlocking {
        val request = EmailRequest(
            to = "test@example.com",
            subject = "Test",
            html = "<h1>Test</h1>"
        )
        
        val result = emailService.sendEmail(request)
        
        assertTrue(result.isSuccess)
        assertNotNull(result.getOrNull()?.id)
    }
    
    @Test
    fun sendEmailFailure() = runBlocking {
        val request = EmailRequest(
            to = "invalid-email",
            subject = "Test",
            html = "<h1>Test</h1>"
        )
        
        val result = emailService.sendEmail(request)
        
        assertTrue(result.isFailure)
    }
}
```

---

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] Update API base URLs for production
- [ ] Configure environment variables
- [ ] Test email sending functionality
- [ ] Verify error handling
- [ ] Set up logging and monitoring

### **Post-Deployment**
- [ ] Monitor email delivery rates
- [ ] Check error logs regularly
- [ ] Test fallback mechanisms
- [ ] Verify rate limiting effectiveness

---

## 📞 Support & Troubleshooting

### **Common Issues**

#### **1. Connection Timeout**
- **Solution**: Increase timeout duration or check network connectivity
- **Code**: `URLSessionConfiguration.timeoutIntervalForRequest = 30`

#### **2. SSL Certificate Issues**
- **Solution**: Configure ATS settings for iOS or network security config for Android
- **iOS**: Add domain to `NSExceptionDomains` in Info.plist
- **Android**: Create `network_security_config.xml`

#### **3. API Key Issues**
- **Solution**: Verify server environment variables are properly configured
- **Check**: Server logs for API key errors

### **Debug Mode**
```swift
#if DEBUG
let emailService = EmailService(baseURL: "http://localhost:9003")
#else
let emailService = EmailService(baseURL: "https://api.kyozo.com")
#endif
```

---

## 🎯 Quick Start Example

### **Complete iOS Integration**
```swift
// AppDelegate.swift
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var emailService: EmailService!
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        #if DEBUG
        emailService = EmailService(baseURL: "http://localhost:9003")
        #else
        emailService = EmailService(baseURL: "https://api.kyozo.com")
        #endif
        
        return true
    }
}

// Usage in ViewController
class SignUpViewController: UIViewController {
    private let emailService = (UIApplication.shared.delegate as! AppDelegate).emailService
    
    @IBAction func signUpButtonTapped(_ sender: UIButton) {
        Task {
            await sendVerificationEmail()
        }
    }
    
    private func sendVerificationEmail() async {
        do {
            let response = try await emailService.sendEmail(request: EmailRequest(
                to: "user@example.com",
                subject: "📧 Verify Your Email",
                html: verificationEmailHTML
            ))
            
            print("✅ Verification email sent: \(response.id)")
            showAlert(title: "Success", message: "Verification email sent!")
            
        } catch {
            print("❌ Failed to send email: \(error.localizedDescription)")
            showAlert(title: "Error", message: "Failed to send verification email")
        }
    }
}
```

**🎉 Your mobile app is now ready to send emails through the KyozoVerse API!**

This integration provides a robust, scalable email solution for your mobile application with proper error handling, logging, and fallback mechanisms.
