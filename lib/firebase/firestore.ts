import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { User, ApprovalStatus } from '../types'

// Define EstimateStatus type - exported for use in other modules
export type EstimateStatus = 'pending' | 'approved' | 'denied' | 'outstanding' | 'in_progress' | 'paid'

const USERS_COLLECTION = 'users'

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: string
  companyName?: string
  companyType?: string
  approvalStatus: ApprovalStatus
  createdAt: Date | any
  emailVerified: boolean
  updatedAt?: Date | any
}

export async function createUserProfile(uid: string, profileData: UserProfile) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return profileData
  } catch (error: any) {
    throw new Error(`Failed to create user profile: ${error.message}`)
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const data = userSnap.data()
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile
    }
    return null
  } catch (error: any) {
    throw new Error(`Failed to get user profile: ${error.message}`)
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(`Failed to update user profile: ${error.message}`)
  }
}

export async function getPendingApprovals(): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('approvalStatus', '==', 'pending')
    )
    const querySnapshot = await getDocs(q)
    const users: UserProfile[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        ...data,
        uid: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile)
    })
    
    return users
  } catch (error: any) {
    throw new Error(`Failed to get pending approvals: ${error.message}`)
  }
}

export async function approveUser(uid: string, role?: string) {
  try {
    const updates: any = {
      approvalStatus: 'approved',
      updatedAt: serverTimestamp(),
    }
    
    if (role) {
      updates.role = role
    }
    
    await updateUserProfile(uid, updates)
  } catch (error: any) {
    throw new Error(`Failed to approve user: ${error.message}`)
  }
}

export async function denyUser(uid: string) {
  try {
    await updateUserProfile(uid, {
      approvalStatus: 'denied',
      updatedAt: serverTimestamp(),
    } as Partial<UserProfile>)
  } catch (error: any) {
    throw new Error(`Failed to deny user: ${error.message}`)
  }
}

// Jobs collection - Note: Firestore collection names are case-sensitive
const JOBS_COLLECTION = 'Jobs'
const ESTIMATES_SUBCOLLECTION = 'estimates'

export interface Job {
  id: string
  name: string
  description: string
  price: number
  createdAt?: Date | any
}

export interface PendingEstimate {
  id?: string
  uid: string  // User's Firebase UID
  customerId: string
  customerEmail: string
  customerCompanyName?: string
  jobs: Job[]
  totalPrice: number
  dateRange: {
    start: string
    end: string
  }
  location: string
  status: 'pending' | 'approved' | 'denied' | 'outstanding' | 'in_progress' | 'paid'
  createdAt: Date | any
  updatedAt?: Date | any
}

export async function getJobs(): Promise<Job[]> {
  try {
    const q = query(collection(db, JOBS_COLLECTION))
    const querySnapshot = await getDocs(q)
    const jobs: Job[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Handle both naming conventions: 'name' or document ID, 'Description' or 'description', 'Price' or 'price'
      jobs.push({
        id: doc.id,
        name: data.name || data.Name || doc.id, // Use document ID as fallback if no name field
        description: data.description || data.Description || '',
        price: data.price || data.Price || 0,
        createdAt: data.createdAt?.toDate() || data.CreatedAt?.toDate() || new Date(),
      })
    })
    
    return jobs
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    throw new Error(`Failed to get jobs: ${error.message}`)
  }
}

export async function createPendingEstimate(estimate: Omit<PendingEstimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    // Save estimate as subcollection under user's profile: users/{uid}/estimates/{estimateId}
    const userRef = doc(db, USERS_COLLECTION, estimate.customerId)
    const estimatesRef = collection(userRef, ESTIMATES_SUBCOLLECTION)
    const newEstimateRef = doc(estimatesRef)
    
    await setDoc(newEstimateRef, {
      ...estimate,
      uid: estimate.customerId, // Explicitly save UID from customerId
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return newEstimateRef.id
  } catch (error: any) {
    throw new Error(`Failed to create pending estimate: ${error.message}`)
  }
}

export async function getCustomerPendingEstimates(customerId: string): Promise<PendingEstimate[]> {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    console.log('Fetching estimates for customer:', customerId)
    
    // Get estimates from user's subcollection: users/{uid}/estimates
    const userRef = doc(db, USERS_COLLECTION, customerId)
    const estimatesRef = collection(userRef, ESTIMATES_SUBCOLLECTION)
    const q = query(estimatesRef)
    const querySnapshot = await getDocs(q)
    
    console.log('Query snapshot size:', querySnapshot.size)
    
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
      console.log('Loaded estimate:', estimate.id, 'Raw Status:', rawStatus, 'Normalized Status:', status, 'Full Data:', JSON.stringify(data))
      estimates.push(estimate)
    })
    
    console.log('Total estimates loaded:', estimates.length)
    
    // Sort by creation date, newest first
    const sorted = estimates.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return bDate.getTime() - aDate.getTime()
    })
    
    return sorted
  } catch (error: any) {
    console.error('Error in getCustomerPendingEstimates:', error)
    throw new Error(`Failed to get customer estimates: ${error.message || 'Unknown error'}`)
  }
}

export async function getCustomerApprovedEstimates(customerId: string): Promise<PendingEstimate[]> {
  try {
    // Get approved estimates from user's subcollection: users/{uid}/estimates
    const userRef = doc(db, USERS_COLLECTION, customerId)
    const estimatesRef = collection(userRef, ESTIMATES_SUBCOLLECTION)
    const q = query(estimatesRef, where('status', '==', 'approved'))
    const querySnapshot = await getDocs(q)
    const estimates: PendingEstimate[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      estimates.push({
        id: doc.id,
        uid: data.uid || data.customerId || customerId,
        customerId: data.customerId || customerId,
        customerEmail: data.customerEmail,
        customerCompanyName: data.customerCompanyName,
        jobs: data.jobs || [],
        totalPrice: data.totalPrice || 0,
        dateRange: data.dateRange || { start: '', end: '' },
        location: data.location || '',
        status: data.status || 'approved',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      })
    })
    
    // Sort by creation date, newest first
    return estimates.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
      return bDate.getTime() - aDate.getTime()
    })
  } catch (error: any) {
    throw new Error(`Failed to get customer approved estimates: ${error.message}`)
  }
}
