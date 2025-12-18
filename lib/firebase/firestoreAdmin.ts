// Server-side Firestore functions using Firebase Admin SDK
import { getFirebaseAdminApp } from './firebaseAdmin'
import { PendingEstimate, EstimateStatus } from './firestore'

const USERS_COLLECTION = 'users'
const ESTIMATES_SUBCOLLECTION = 'estimates'

export async function getCustomerPendingEstimatesAdmin(customerId: string): Promise<PendingEstimate[]> {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    console.log('[Admin] Fetching estimates for customer:', customerId)
    
    // Initialize Admin SDK and get Firestore instance
    const adminApp = getFirebaseAdminApp()
    if (!adminApp) {
      throw new Error('Firebase Admin SDK not initialized. Please check environment variables.')
    }
    
    const db = adminApp.firestore()
    
    // Get estimates from user's subcollection: users/{uid}/estimates
    const userRef = db.collection(USERS_COLLECTION).doc(customerId)
    const estimatesRef = userRef.collection(ESTIMATES_SUBCOLLECTION)
    const querySnapshot = await estimatesRef.get()
    
    console.log('[Admin] Query snapshot size:', querySnapshot.size)
    
    const estimates: PendingEstimate[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Normalize status to lowercase and ensure it's a valid status
      const rawStatus = data.status || 'pending'
      const normalizedStatus = String(rawStatus).toLowerCase().trim()
      
      // Validate status against allowed values
      const validStatuses: EstimateStatus[] = ['pending', 'approved', 'denied', 'outstanding', 'in_progress', 'paid']
      const status: EstimateStatus = validStatuses.includes(normalizedStatus as EstimateStatus) ? (normalizedStatus as EstimateStatus) : 'pending'
      
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
      
      console.log('[Admin] Loaded estimate:', estimate.id, 'Status:', status)
      estimates.push(estimate)
    })
    
    console.log('[Admin] Total estimates loaded:', estimates.length)
    
    // Sort by creation date, newest first
    const sorted = estimates.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return bDate.getTime() - aDate.getTime()
    })
    
    return sorted
  } catch (error: any) {
    console.error('[Admin] Error fetching customer estimates:', error)
    throw new Error(`Failed to get customer estimates: ${error.message}`)
  }
}

