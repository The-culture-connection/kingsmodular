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
 * Reuses existing app if already initialized to avoid duplicate initialization errors
 */
export function getFirebaseAdminApp(): admin.app.App {
  // Return cached app if available
  if (adminApp) {
    return adminApp
  }

  // Check if app already exists (from previous initialization)
  try {
    const existingApp = admin.app()
    if (existingApp) {
      console.log('[FirebaseAdmin] Reusing existing Firebase Admin app')
      adminApp = existingApp
      return adminApp
    }
  } catch (error) {
    // No existing app, continue with initialization
  }

  // Try to get from getApps() if available
  try {
    const apps = admin.apps
    if (apps.length > 0) {
      console.log('[FirebaseAdmin] Reusing existing Firebase Admin app from apps array')
      adminApp = apps[0] as admin.app.App
      return adminApp
    }
  } catch (error) {
    // No apps found, continue with initialization
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
    // If initialization fails due to existing app, try to get it
    if (error.message?.includes('already exists')) {
      try {
        const existingApp = admin.app()
        console.log('[FirebaseAdmin] App already exists, reusing it')
        adminApp = existingApp
        return adminApp
      } catch (getAppError) {
        // Fall through to throw original error
      }
    }
    console.error('[FirebaseAdmin] Initialization error:', error)
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`)
  }
}

// Export admin for direct access if needed
export { admin }

