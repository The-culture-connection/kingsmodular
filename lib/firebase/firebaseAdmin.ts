import admin from 'firebase-admin'

let adminApp: admin.app.App | null = null

/**
 * Check if Firebase Admin SDK is configured
 */
export function isFirebaseAdminConfigured(): boolean {
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID
  const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY
  const hasStorageBucket = !!process.env.FIREBASE_STORAGE_BUCKET

  return hasProjectId && hasClientEmail && hasPrivateKey && hasStorageBucket
}

/**
 * Get or initialize Firebase Admin SDK
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (adminApp) {
    return adminApp
  }

  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin SDK is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET environment variables.')
  }

  try {
    // Format private key (handle newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')

    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    })

    console.log('[FirebaseAdmin] Initialized successfully')
    return adminApp
  } catch (error: any) {
    console.error('[FirebaseAdmin] Initialization error:', error)
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`)
  }
}

// Export admin for direct access if needed
export { admin }

