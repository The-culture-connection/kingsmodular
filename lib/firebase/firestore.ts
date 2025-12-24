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
      // Ensure approvalStatus is set - default to 'approved' for admin users
      const role = data.role || ''
      const isAdmin = role === 'admin' || role === 'office_admin'
      const approvalStatus = data.approvalStatus || (isAdmin ? 'approved' : 'pending')
      
      return {
        ...data,
        approvalStatus: approvalStatus, // Ensure approvalStatus is set
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
  timeEstimate?: number // Number of days this job will take
  requiredMaterials?: string[] // Array of material IDs that are usually required for this service
  requiredMaterialsData?: Array<{ materialId: string; quantity: number; cost: number }> // Full material data with quantity and cost
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
      // Handle Time Estimation - can be string or number
      let timeEstimate = 0
      const timeEstValue = data.timeEstimate || data.time_estimate || data.TimeEstimate || data['Time Estimation'] || 0
      if (typeof timeEstValue === 'string') {
        // Parse string like "3 " to number
        timeEstimate = parseFloat(timeEstValue.trim()) || 0
      } else {
        timeEstimate = timeEstValue || 0
      }
      
      jobs.push({
        id: doc.id,
        name: data.name || data.Name || doc.id, // Use document ID as fallback if no name field
        description: data.description || data.Description || '',
        price: data.price || data.Price || 0,
        timeEstimate: timeEstimate,
        requiredMaterials: data.requiredMaterials || [], // Include required materials (IDs)
        requiredMaterialsData: data.requiredMaterialsData || [], // Include required materials data (with quantity and cost)
        createdAt: data.createdAt?.toDate() || data.CreatedAt?.toDate() || new Date(),
      })
    })
    
    return jobs
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    throw new Error(`Failed to get jobs: ${error.message}`)
  }
}

/**
 * Add a new service/job to the Jobs collection
 * Uses the description as the document ID (like "Single Wide Setup")
 */
export async function addService(
  description: string, 
  price: number, 
  timeEstimate: string,
  requiredMaterials?: string[], // Array of material IDs (for backward compatibility)
  requiredMaterialsData?: Array<{ materialId: string; quantity: number; cost: number }> // Full material data with quantity and cost
): Promise<string> {
  try {
    // Use description as document ID - trim and normalize spaces
    // Firestore allows spaces in document IDs, so we keep them
    const docId = description.trim().replace(/\s+/g, ' ')
    
    if (!docId) {
      throw new Error('Description cannot be empty')
    }
    
    // Use materialsData if provided, otherwise fall back to just IDs
    const materialsToSave = requiredMaterialsData || (requiredMaterials?.map(id => ({ materialId: id, quantity: 1, cost: 0 })) || [])
    
    // Check if document already exists - if so, update it instead of creating new
    const serviceRef = doc(db, JOBS_COLLECTION, docId)
    await setDoc(serviceRef, {
      Description: description,
      description: description,
      Price: price,
      price: price,
      'Time Estimation': timeEstimate,
      TimeEstimate: timeEstimate,
      timeEstimate: timeEstimate,
      requiredMaterials: requiredMaterials || [], // Save material IDs for backward compatibility
      requiredMaterialsData: materialsToSave, // Save full material data with quantity and cost
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true }) // Merge to preserve existing data if updating
    
    return docId
  } catch (error: any) {
    throw new Error(`Failed to add service: ${error.message}`)
  }
}

export async function createPendingEstimate(estimate: Omit<PendingEstimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    // Automatically collect required materials from selected jobs
    // Use requiredMaterialsData if available (has quantity and cost), otherwise fall back to requiredMaterials (just IDs)
    const materialMap = new Map<string, { materialId: string; quantity: number; cost: number; name?: string }>()
    
    estimate.jobs.forEach((job) => {
      // Prefer requiredMaterialsData (has quantity and cost) over requiredMaterials (just IDs)
      if (job.requiredMaterialsData && Array.isArray(job.requiredMaterialsData) && job.requiredMaterialsData.length > 0) {
        job.requiredMaterialsData.forEach((matData) => {
          // If material already exists, sum quantities (in case same material is in multiple services)
          if (materialMap.has(matData.materialId)) {
            const existing = materialMap.get(matData.materialId)!
            existing.quantity += matData.quantity
          } else {
            materialMap.set(matData.materialId, {
              materialId: matData.materialId,
              quantity: matData.quantity,
              cost: matData.cost,
            })
          }
        })
      } else if (job.requiredMaterials && Array.isArray(job.requiredMaterials)) {
        // Fall back to just IDs if requiredMaterialsData is not available
        job.requiredMaterials.forEach((materialId) => {
          if (!materialMap.has(materialId)) {
            materialMap.set(materialId, {
              materialId: materialId,
              quantity: 1, // Default quantity if only ID is available
              cost: 0, // Will be filled from material lookup
            })
          }
        })
      }
    })

    // Get material details if there are required materials
    let autoMaterials: any[] = []
    if (materialMap.size > 0) {
      try {
        // Import getAllMaterials dynamically to avoid circular dependency
        const { getAllMaterials } = await import('./materials')
        const allMaterials = await getAllMaterials()
        
        // Create material entries using quantities and costs from requiredMaterialsData
        autoMaterials = Array.from(materialMap.values()).map((matData) => {
          const material = allMaterials.find((m) => m.id === matData.materialId)
          if (material) {
            // Use cost from requiredMaterialsData if available, otherwise use material's base cost
            const unitCost = matData.cost > 0 ? matData.cost : material.cost
            const quantity = matData.quantity || 1
            return {
              materialId: material.id,
              name: material.name,
              quantity: quantity, // Use quantity from requiredMaterialsData
              unitCost: unitCost, // Use cost from requiredMaterialsData or material's base cost
              totalCost: unitCost * quantity,
              ordered: false, // Default to not ordered
              orderLink: '', // Default to no order link
            }
          }
          return null
        }).filter((m) => m !== null) as any[]
      } catch (materialError) {
        // Non-critical error - log but don't fail
        console.warn('Failed to load materials for auto-add (non-critical):', materialError)
      }
    }

    // Calculate materials cost
    const materialsCost = autoMaterials.reduce((sum, mat) => sum + (mat.totalCost || 0), 0)

    // Save estimate to consolidated jobs collection: /jobs/{jobId}
    // This makes it easier for admins to query all jobs and for customers to query their own
    const jobsRef = collection(db, 'jobs')
    const newJobRef = doc(jobsRef)
    
    // Prepare the estimate data with auto-added materials
    const estimateData: any = {
      ...estimate,
      uid: estimate.customerId, // Explicitly save UID from customerId
      customerId: estimate.customerId, // Ensure customerId is saved for filtering
      status: estimate.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Add Cost object with auto-added materials if any
    if (autoMaterials.length > 0) {
      estimateData.Cost = {
        materialsCost: materialsCost,
        materials: autoMaterials,
        payrollCost: 0,
        payroll: [],
        gasCost: 0, // Will be calculated after job is created
        totalCost: materialsCost,
        hoursPerDay: 10, // Default hours per day
      }
      // Also save at top level for backward compatibility
      estimateData.materialsCost = materialsCost
      estimateData.materials = autoMaterials
      estimateData.selectedMaterials = autoMaterials.map((m) => ({
        materialId: m.materialId,
        quantity: m.quantity,
      }))
    } else {
      // Initialize Cost object even if no materials
      estimateData.Cost = {
        materialsCost: 0,
        materials: [],
        payrollCost: 0,
        payroll: [],
        gasCost: 0, // Will be calculated after job is created
        totalCost: 0,
        hoursPerDay: 10,
      }
    }
    
    await setDoc(newJobRef, estimateData)
    
    // Calculate gas pricing after job is created (via API route for server-side execution)
    console.log('🔵 [FIRESTORE] Starting gas calculation for new job:', newJobRef.id)
    
    // Use setTimeout to make this non-blocking and run after job creation completes
    setTimeout(async () => {
      try {
        // Call API route instead of direct function to ensure server-side execution
        // Use relative URL for same-origin requests
        const response = await fetch('/api/jobs/calculate-gas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobId: newJobRef.id }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to calculate gas')
        }
        
        console.log('✅ [FIRESTORE] Gas calculation completed for job:', newJobRef.id)
      } catch (gasError) {
        // Non-critical error - log but don't fail job creation
        console.error('❌ [FIRESTORE] Failed to calculate gas pricing (non-critical):', gasError)
      }
    }, 100) // Small delay to ensure job document is fully written
    
    // Also save to user's subcollection for backward compatibility during transition
    // TODO: Remove this once fully migrated to jobs collection
    try {
      const userRef = doc(db, USERS_COLLECTION, estimate.customerId)
      const estimatesRef = collection(userRef, ESTIMATES_SUBCOLLECTION)
      const userEstimateRef = doc(estimatesRef, newJobRef.id) // Use same ID for consistency
      
      await setDoc(userEstimateRef, {
        ...estimate,
        uid: estimate.customerId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (subcollectionError) {
      // Non-critical error - log but don't fail
      console.warn('Failed to write to user subcollection (non-critical):', subcollectionError)
    }
    
    return newJobRef.id
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
    
    // Get estimates from consolidated jobs collection filtered by customerId
    const jobsRef = collection(db, 'jobs')
    const q = query(jobsRef, where('customerId', '==', customerId))
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
      console.log('Loaded estimate:', estimate.id, 'Raw Status:', rawStatus, 'Normalized Status:', status)
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
