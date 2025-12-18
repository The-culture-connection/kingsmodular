import admin from "firebase-admin";

// Initialize Firebase Admin only if not already initialized
let app: admin.app.App | null = null;
let bucket: any = null;

function initializeFirebaseAdmin() {
  // If already initialized, return the app
  if (app && admin.apps.length > 0) {
    return app;
  }

  try {
    if (admin.apps.length === 0) {
      // Check for required environment variables
      if (!process.env.FIREBASE_PROJECT_ID) {
        const error = new Error("FIREBASE_PROJECT_ID is required for Firebase Admin SDK");
        console.error("Firebase Admin initialization error:", error.message);
        throw error;
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        const error = new Error("FIREBASE_CLIENT_EMAIL is required for Firebase Admin SDK");
        console.error("Firebase Admin initialization error:", error.message);
        throw error;
      }
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        const error = new Error("FIREBASE_PRIVATE_KEY is required for Firebase Admin SDK");
        console.error("Firebase Admin initialization error:", error.message);
        throw error;
      }

      // Validate private key format
      if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
        const error = new Error("FIREBASE_PRIVATE_KEY appears to be malformed");
        console.error("Firebase Admin initialization error:", error.message);
        throw error;
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
      console.log("Firebase Admin SDK initialized successfully");
    } else {
      app = admin.app();
    }

    return app;
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

// Get Firebase Admin app instance (initializes if needed)
export function getFirebaseAdminApp() {
  if (!app) {
    app = initializeFirebaseAdmin();
  }
  return app;
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

