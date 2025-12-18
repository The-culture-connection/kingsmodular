import admin from "firebase-admin";

// Initialize Firebase Admin only if not already initialized
let app: admin.app.App | null = null;
let bucket: any = null;

function initializeFirebaseAdmin() {
  const logPrefix = `[AdminInit-${Date.now()}]`;
  console.log(`${logPrefix} Starting Firebase Admin initialization...`);
  
  // If already initialized, return the app
  if (app && admin.apps.length > 0) {
    console.log(`${logPrefix} Firebase Admin already initialized, returning existing app`);
    return app;
  }

  try {
    if (admin.apps.length === 0) {
      console.log(`${logPrefix} No existing apps found, initializing new app...`);
      
      // Check for required environment variables
      console.log(`${logPrefix} Checking environment variables...`);
      const envCheck = {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_STORAGE_BUCKET: !!process.env.FIREBASE_STORAGE_BUCKET,
      };
      console.log(`${logPrefix} Environment variables present:`, envCheck);
      
      if (!process.env.FIREBASE_PROJECT_ID) {
        const error = new Error("FIREBASE_PROJECT_ID is required for Firebase Admin SDK");
        console.error(`${logPrefix} Firebase Admin initialization error:`, error.message);
        throw error;
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        const error = new Error("FIREBASE_CLIENT_EMAIL is required for Firebase Admin SDK");
        console.error(`${logPrefix} Firebase Admin initialization error:`, error.message);
        throw error;
      }
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        const error = new Error("FIREBASE_PRIVATE_KEY is required for Firebase Admin SDK");
        console.error(`${logPrefix} Firebase Admin initialization error:`, error.message);
        throw error;
      }

      // Validate private key format
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      console.log(`${logPrefix} Private key length:`, privateKey.length);
      console.log(`${logPrefix} Private key starts with BEGIN:`, privateKey.includes('BEGIN PRIVATE KEY'));
      console.log(`${logPrefix} Private key contains newlines:`, privateKey.includes('\n') || privateKey.includes('\\n'));
      
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        const error = new Error("FIREBASE_PRIVATE_KEY appears to be malformed");
        console.error(`${logPrefix} Firebase Admin initialization error:`, error.message);
        throw error;
      }

      console.log(`${logPrefix} Initializing Firebase Admin app...`);
      const initStartTime = Date.now();
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Important: replace escaped newlines
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      const initDuration = Date.now() - initStartTime;
      console.log(`${logPrefix} Firebase Admin SDK initialized successfully in ${initDuration}ms`);
      console.log(`${logPrefix} Project ID:`, process.env.FIREBASE_PROJECT_ID);
      console.log(`${logPrefix} Storage Bucket:`, process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`);
    } else {
      console.log(`${logPrefix} Existing app found, using it`);
      app = admin.app();
    }

    return app;
  } catch (error: any) {
    console.error(`${logPrefix} Firebase Admin initialization error:`, error.message);
    console.error(`${logPrefix} Error name:`, error.name);
    console.error(`${logPrefix} Error stack:`, error.stack);
    throw error;
  }
}

// Get Firebase Admin app instance (initializes if needed)
export function getFirebaseAdminApp() {
  try {
    if (!app) {
      app = initializeFirebaseAdmin();
    }
    return app;
  } catch (error: any) {
    console.error("[getFirebaseAdminApp] Error during initialization:", error);
    throw error;
  }
}

// Check if Firebase Admin is properly configured
export function isFirebaseAdminConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')
  );
}

// Lazy initialization - only initialize when bucket is accessed
export function getBucket() {
  if (!bucket) {
    const adminApp = getFirebaseAdminApp();
    if (adminApp) {
      bucket = adminApp.storage().bucket();
    }
  }
  return bucket;
}

export { admin };

