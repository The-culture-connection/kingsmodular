import admin from "firebase-admin";

// Initialize Firebase Admin only if not already initialized
let app: admin.app.App | null = null;
let bucket: any = null;

function initializeFirebaseAdmin() {
  if (bucket) {
    return bucket; // Already initialized
  }

  try {
    if (admin.apps.length === 0) {
      // Check for required environment variables
      if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn("FIREBASE_PROJECT_ID is not set - Firebase Storage will not be available");
        return null;
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        console.warn("FIREBASE_CLIENT_EMAIL is not set - Firebase Storage will not be available");
        return null;
      }
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.warn("FIREBASE_PRIVATE_KEY is not set - Firebase Storage will not be available");
        return null;
      }

      // Validate private key format
      if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
        console.warn("FIREBASE_PRIVATE_KEY appears to be malformed - Firebase Storage will not be available");
        return null;
      }

      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Important: replace escaped newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else {
      app = admin.app();
    }

    bucket = admin.storage().bucket();
    return bucket;
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
    console.error("Firebase Storage will not be available. PDFs will be returned directly.");
    return null;
  }
}

// Lazy initialization - only initialize when bucket is accessed
export function getBucket() {
  if (!bucket) {
    bucket = initializeFirebaseAdmin();
  }
  return bucket;
}

export { admin };

