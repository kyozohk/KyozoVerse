import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  console.log('✅ [VERIFY] Starting verify-code request');
  
  try {
    const body = await request.json();
    const { email, code } = body;
    
    console.log('✅ [VERIFY] Request body:', { email, code });

    if (!email || !code) {
      console.error('✅ [VERIFY] ERROR: Missing email or code');
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Get verification record from Firestore
    console.log('✅ [VERIFY] Fetching verification record from Firestore for:', email);
    const verificationRef = adminDb.collection('emailVerifications').doc(email);
    const verificationDoc = await verificationRef.get();

    if (!verificationDoc.exists) {
      console.error('✅ [VERIFY] ERROR: No verification record found for:', email);
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 404 }
      );
    }

    const verificationData = verificationDoc.data();
    console.log('✅ [VERIFY] Verification data found:', {
      storedCode: verificationData?.code,
      providedCode: code,
      verified: verificationData?.verified,
      expiresAt: verificationData?.expiresAt,
    });

    if (!verificationData) {
      console.error('✅ [VERIFY] ERROR: Invalid verification data');
      return NextResponse.json(
        { error: 'Invalid verification data' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (verificationData.verified) {
      console.log('✅ [VERIFY] Email already verified');
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const expiresAt = verificationData.expiresAt.toDate ? 
      verificationData.expiresAt.toDate() : 
      new Date(verificationData.expiresAt);
    
    console.log('✅ [VERIFY] Expiry check - now:', new Date().toISOString(), 'expiresAt:', expiresAt.toISOString());
    
    if (new Date() > expiresAt) {
      console.error('✅ [VERIFY] ERROR: Code has expired');
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if code matches
    console.log('✅ [VERIFY] Code comparison - stored:', verificationData.code, 'provided:', code, 'match:', verificationData.code === code);
    if (verificationData.code !== code) {
      console.error('✅ [VERIFY] ERROR: Code mismatch');
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Mark as verified
    console.log('✅ [VERIFY] Marking email as verified...');
    await verificationRef.update({
      verified: true,
      verifiedAt: new Date(),
    });

    console.log('✅ [VERIFY] SUCCESS: Email verified successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('✅ [VERIFY] FATAL ERROR:', error);
    console.error('✅ [VERIFY] Error message:', (error as Error).message);
    console.error('✅ [VERIFY] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
