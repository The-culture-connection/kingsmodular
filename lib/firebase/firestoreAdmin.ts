// Server-side Firestore functions using Firebase Admin SDK
import { getFirebaseAdminApp } from './firebaseAdmin'
import { PendingEstimate, EstimateStatus } from './firestore'

const USERS_COLLECTION = 'users'
const ESTIMATES_SUBCOLLECTION = 'estimates'

export async function getCustomerPendingEstimatesAdmin(customerId: string): Promise<PendingEstimate[]> {
  const logPrefix = `[Admin-${Date.now()}]`;
  try {
    if (!customerId) {
      console.error(`${logPrefix} Customer ID is missing!`);
      throw new Error('Customer ID is required')
    }

    console.log(`${logPrefix} Fetching estimates for customer:`, customerId)
    console.log(`${logPrefix} Customer ID type:`, typeof customerId, 'length:', customerId.length)
    
    // Initialize Admin SDK and get Firestore instance
    console.log(`${logPrefix} Initializing Firebase Admin SDK...`);
    const initStartTime = Date.now();
    const adminApp = getFirebaseAdminApp()
    const initDuration = Date.now() - initStartTime;
    console.log(`${logPrefix} Admin SDK initialization took ${initDuration}ms`);
    
    if (!adminApp) {
      console.error(`${logPrefix} Firebase Admin SDK initialization returned null/undefined!`);
      console.error(`${logPrefix} Environment variables check:`, {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET
      });
      throw new Error('Firebase Admin SDK not initialized. Please check environment variables.')
    }
    
    console.log(`${logPrefix} Getting Firestore instance...`);
    const db = adminApp.firestore()
    console.log(`${logPrefix} Firestore instance obtained`);
    
    // Get estimates from user's subcollection: users/{uid}/estimates
    console.log(`${logPrefix} Building Firestore query path:`, {
      collection: USERS_COLLECTION,
      documentId: customerId,
      subcollection: ESTIMATES_SUBCOLLECTION,
      fullPath: `${USERS_COLLECTION}/${customerId}/${ESTIMATES_SUBCOLLECTION}`
    });
    const userRef = db.collection(USERS_COLLECTION).doc(customerId)
    const estimatesRef = userRef.collection(ESTIMATES_SUBCOLLECTION)
    
    console.log(`${logPrefix} Executing Firestore query...`);
    const queryStartTime = Date.now();
    const querySnapshot = await estimatesRef.get()
    const queryDuration = Date.now() - queryStartTime;
    
    console.log(`${logPrefix} Query completed in ${queryDuration}ms`);
    console.log(`${logPrefix} Query snapshot size:`, querySnapshot.size)
    console.log(`${logPrefix} Query snapshot empty:`, querySnapshot.empty)
    
    const estimates: PendingEstimate[] = []
    let docIndex = 0;
    
    querySnapshot.forEach((doc) => {
      docIndex++;
      console.log(`${logPrefix} Processing document ${docIndex}/${querySnapshot.size}:`, doc.id);
      const data = doc.data()
      console.log(`${logPrefix} Document ${doc.id} raw data keys:`, Object.keys(data));
      console.log(`${logPrefix} Document ${doc.id} status (raw):`, data.status, 'type:', typeof data.status);
      
      // Normalize status to lowercase and ensure it's a valid status
      const rawStatus = data.status || 'pending'
      const normalizedStatus = String(rawStatus).toLowerCase().trim()
      
      // Validate status against allowed values
      const validStatuses: EstimateStatus[] = ['pending', 'approved', 'denied', 'outstanding', 'in_progress', 'paid']
      const status: EstimateStatus = validStatuses.includes(normalizedStatus as EstimateStatus) ? (normalizedStatus as EstimateStatus) : 'pending'
      
      console.log(`${logPrefix} Document ${doc.id} status processing:`, {
        raw: rawStatus,
        normalized: normalizedStatus,
        final: status,
        isValid: validStatuses.includes(normalizedStatus as EstimateStatus)
      });
      
      const estimate: PendingEstimate = {
        id: doc.id,
        uid: data.uid || data.customerId || customerId,
        customerId: data.customerId || customerId,
        customerEmail: data.customerEmail || '',
        customerCompanyName: data.customerCompanyName || '',
        jobs: data.jobs || [],
        totalPrice: data.totalPrice || 0,
        dateRange: data.dateRange || { start: '', end: '' },
        location: data.location || '',
        status: status,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
      }
      
      console.log(`${logPrefix} Loaded estimate:`, {
        id: estimate.id,
        status: estimate.status,
        totalPrice: estimate.totalPrice,
        jobsCount: estimate.jobs?.length || 0,
        customerId: estimate.customerId
      });
      estimates.push(estimate)
    })
    
    console.log(`${logPrefix} Total estimates loaded:`, estimates.length)
    console.log(`${logPrefix} Estimate IDs:`, estimates.map(e => e.id));
    console.log(`${logPrefix} Estimate statuses:`, estimates.map(e => ({ id: e.id, status: e.status })));
    
    // Sort by creation date, newest first
    const sorted = estimates.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return bDate.getTime() - aDate.getTime()
    })
    
    console.log(`${logPrefix} Returning ${sorted.length} sorted estimates`);
    return sorted
  } catch (error: any) {
    const logPrefix = `[Admin-${Date.now()}]`;
    console.error(`${logPrefix} Error fetching customer estimates:`, error)
    console.error(`${logPrefix} Error name:`, error.name);
    console.error(`${logPrefix} Error message:`, error.message);
    console.error(`${logPrefix} Error stack:`, error.stack);
    console.error(`${logPrefix} Error code:`, (error as any).code);
    console.error(`${logPrefix} Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(`Failed to get customer estimates: ${error.message}`)
  }
}

