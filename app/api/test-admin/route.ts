import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured, getFirebaseAdminApp } from "@/lib/firebase/firebaseAdmin";

export async function GET() {
  try {
    const checks = {
      envVars: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        projectId: process.env.FIREBASE_PROJECT_ID || 'MISSING',
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        privateKeyStartsWith: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'MISSING',
        privateKeyEndsWith: process.env.FIREBASE_PRIVATE_KEY?.substring(Math.max(0, (process.env.FIREBASE_PRIVATE_KEY?.length || 0) - 30)) || 'MISSING',
        hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'MISSING',
      },
      isConfigured: isFirebaseAdminConfigured(),
    };

    let adminApp = null;
    let firestore = null;
    let testQuery = null;
    let error = null;

    try {
      adminApp = getFirebaseAdminApp();
      if (adminApp) {
        firestore = adminApp.firestore();
        // Try a simple query to test access
        const testRef = firestore.collection('users').limit(1);
        testQuery = 'Firestore accessible';
      }
    } catch (initError: any) {
      error = {
        name: initError.name,
        message: initError.message,
        code: (initError as any).code,
        stack: process.env.NODE_ENV === 'development' ? initError.stack : undefined,
      };
    }

    return NextResponse.json({
      success: !error && !!adminApp,
      checks,
      adminApp: adminApp ? 'Initialized' : 'Not initialized',
      firestore: firestore ? 'Accessible' : 'Not accessible',
      testQuery,
      error,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    }, { status: 500 });
  }
}

