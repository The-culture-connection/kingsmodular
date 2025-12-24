// PTO (Paid Time Off) request data models and functions
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './config'

export interface PTORequest {
  id?: string
  employeeId: string
  employeeName?: string
  startDate: Date | Timestamp
  endDate: Date | Timestamp
  type: 'vacation' | 'sick' | 'personal' | 'other'
  reason?: string
  status: 'pending' | 'approved' | 'denied'
  requestedAt: Date | Timestamp
  reviewedBy?: string
  reviewedAt?: Date | Timestamp
  reviewNotes?: string
  totalDays: number // Calculated days requested
}

/**
 * Create a PTO request
 */
export async function createPTORequest(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  type: PTORequest['type'],
  reason?: string
): Promise<string> {
  try {
    // Calculate total days (excluding weekends)
    const totalDays = calculateBusinessDays(startDate, endDate)
    
    const ptoRequestRef = doc(collection(db, 'ptoRequests'))
    const ptoRequest: Omit<PTORequest, 'id'> = {
      employeeId,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      type,
      reason,
      status: 'pending',
      totalDays,
      requestedAt: serverTimestamp() as any,
    }
    
    await setDoc(ptoRequestRef, ptoRequest)
    return ptoRequestRef.id
  } catch (error: any) {
    console.error('Error creating PTO request:', error)
    throw new Error(`Failed to create PTO request: ${error.message}`)
  }
}

/**
 * Get PTO requests for an employee
 */
export async function getPTORequests(employeeId?: string): Promise<PTORequest[]> {
  try {
    let q
    if (employeeId) {
      // Query without orderBy to avoid index requirement, sort client-side
      q = query(
        collection(db, 'ptoRequests'),
        where('employeeId', '==', employeeId)
      )
    } else {
      // For all requests, just get the collection
      q = query(collection(db, 'ptoRequests'))
    }
    
    const snapshot = await getDocs(q)
    const requests = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
        endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
        requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date(data.requestedAt),
        reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate() : undefined,
      } as PTORequest
    })
    
    // Sort client-side by requestedAt descending
    return requests.sort((a, b) => {
      const aDate = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt)
      const bDate = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt)
      return bDate.getTime() - aDate.getTime()
    })
  } catch (error: any) {
    console.error('Error getting PTO requests:', error)
    return []
  }
}

/**
 * Get pending PTO requests (for admin)
 */
export async function getPendingPTORequests(): Promise<PTORequest[]> {
  try {
    // Query without orderBy to avoid index requirement, sort client-side
    const q = query(
      collection(db, 'ptoRequests'),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(q)
    const requests = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate),
        endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate),
        requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate() : new Date(data.requestedAt),
      } as PTORequest
    })
    
    // Sort client-side by requestedAt ascending
    return requests.sort((a, b) => {
      const aDate = a.requestedAt instanceof Date ? a.requestedAt : new Date(a.requestedAt)
      const bDate = b.requestedAt instanceof Date ? b.requestedAt : new Date(b.requestedAt)
      return aDate.getTime() - bDate.getTime()
    })
  } catch (error: any) {
    console.error('Error getting pending PTO requests:', error)
    return []
  }
}

/**
 * Approve or deny a PTO request
 */
export async function reviewPTORequest(
  ptoRequestId: string,
  approved: boolean,
  reviewedBy: string,
  reviewNotes?: string
): Promise<void> {
  try {
    const ptoRequestRef = doc(db, 'ptoRequests', ptoRequestId)
    await setDoc(ptoRequestRef, {
      status: approved ? 'approved' : 'denied',
      reviewedBy,
      reviewedAt: serverTimestamp(),
      reviewNotes,
    }, { merge: true })
  } catch (error: any) {
    console.error('Error reviewing PTO request:', error)
    throw new Error(`Failed to ${approved ? 'approve' : 'deny'} PTO request: ${error.message}`)
  }
}

/**
 * Calculate business days between two dates (excluding weekends)
 */
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

