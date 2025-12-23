// Job-related Firestore functions for admin operations
import { collection, query, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from './config'

export interface EstimateJob {
  id: string
  name: string
  description: string
  price: number
  timeEstimate?: number // Number of days this job will take
  createdAt?: Date | any
}

export interface Estimate {
  id: string
  uid: string
  customerId: string
  customerEmail: string
  customerCompanyName?: string
  jobs: EstimateJob[]
  totalPrice: number
  dateRange: {
    start: string
    end: string
  }
  location: string
  status: string // "Approved", "pending", etc. - can be mixed case
  createdAt: Date | any
  updatedAt?: Date | any
}

export interface TransformedJob {
  id: string
  name: string
  site?: string
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'pending_approval'
  revenue: number
  cost: number
  profit: number
  startDate: string
  endDate: string
  customerName?: string
  customerId: string
  customerEmail: string
  approved: boolean
  paid: boolean
  photosUploaded: boolean // Default to false, can be updated later
  materialsFinalized: boolean // Default to false, can be updated later
  payrollPending: boolean // Default to false, can be updated later
  invoiceDrafted: boolean // Default to false, can be updated later
  estimateId: string // Keep reference to original estimate
  location: string
  jobs: EstimateJob[] // Array of individual jobs included in this estimate
  assignedEmployees?: string[] // Array of employee UIDs assigned to this job
  selectedMaterials?: { materialId: string; quantity: number }[] // Array of material selections with quantities
  photos?: string[] // Array of photo URLs
  totalDays?: number // Total number of days (sum of job time estimates)
  payrollCost?: number // Calculated payroll cost
  materialsCost?: number // Calculated materials cost
  materials?: { materialId: string; name: string; quantity: number; unitCost: number; totalCost: number }[] // Detailed materials breakdown
  payroll?: { employeeId: string; employeeName: string; hourlyRate: number; hours: number; totalCost: number }[] // Detailed payroll breakdown
  Cost?: {
    materialsCost: number
    materials: { materialId: string; name: string; quantity: number; unitCost: number; totalCost: number }[]
    payrollCost: number
    payroll: { employeeId: string; employeeName: string; hourlyRate: number; hours: number; totalCost: number }[]
    totalCost: number
  }
}

/**
 * Normalize status from Firestore to our internal status format
 * Handles various case formats: "Approved", "approved", "pending", etc.
 */
function normalizeStatus(status: string): 'draft' | 'approved' | 'in_progress' | 'completed' | 'pending_approval' {
  if (!status) return 'draft'
  
  const normalized = status.toLowerCase().trim()
  
  switch (normalized) {
    case 'approved':
      return 'approved'
    case 'pending':
    case 'pending_approval':
    case 'pending approval':
      return 'pending_approval'
    case 'in_progress':
    case 'in progress':
    case 'ongoing':
      return 'in_progress'
    case 'completed':
    case 'complete':
    case 'done':
      return 'completed'
    case 'paid':
      return 'completed' // Treat paid as completed
    case 'denied':
    case 'rejected':
      return 'draft' // Treat denied as draft for now
    default:
      console.warn(`Unknown status: "${status}", defaulting to draft`)
      return 'draft'
  }
}

/**
 * Fetch all estimates from consolidated jobs collection
 * Now uses simple collection query instead of collection group
 */
export async function getAllEstimates(): Promise<Estimate[]> {
  try {
    const estimates: Estimate[] = []
    
    // Query the consolidated jobs collection
    const jobsRef = collection(db, 'jobs')
    const jobsQuery = query(jobsRef)
    const jobsSnapshot = await getDocs(jobsQuery)
    
    jobsSnapshot.forEach((jobDoc) => {
      const data = jobDoc.data()
      
      estimates.push({
        id: jobDoc.id,
        uid: data.uid || data.customerId || '',
        customerId: data.customerId || '',
        customerEmail: data.customerEmail || '',
        customerCompanyName: data.customerCompanyName || '',
        jobs: data.jobs || [],
        totalPrice: data.totalPrice || 0,
        dateRange: data.dateRange || { start: '', end: '' },
        location: data.location || '',
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      })
    })
    
    return estimates
  } catch (error: any) {
    console.error('Error fetching all estimates:', error)
    throw new Error(`Failed to fetch estimates: ${error.message}`)
  }
}


/**
 * Transform estimate to Job format for the Job Suite
 */
export function transformEstimateToJob(estimate: Estimate): TransformedJob {
  // Normalize status
  const status = normalizeStatus(estimate.status)
  
  // Calculate financials
  // Revenue = totalPrice from estimate
  const revenue = estimate.totalPrice || 0
  
  // Cost calculation - for now, we'll estimate 70% of revenue as cost
  // TODO: Replace with actual cost tracking when available
  const cost = revenue * 0.7
  
  // Profit = revenue - cost
  const profit = revenue - cost
  
  // Determine boolean flags based on status
  const approved = status === 'approved' || status === 'in_progress' || status === 'completed'
  const paid = status === 'completed' // or check for a 'paid' status/field
  
  // Extract site from location (take first part before comma)
  const site = estimate.location?.split(',')[0] || undefined
  
  // Create job name from jobs array or use location
  let jobName = 'Unnamed Job'
  if (estimate.jobs && estimate.jobs.length > 0) {
    if (estimate.jobs.length === 1) {
      jobName = estimate.jobs[0].name || 'Unnamed Job'
    } else {
      jobName = `${estimate.jobs[0].name} +${estimate.jobs.length - 1} more`
    }
  } else if (site) {
    jobName = site
  }
  
  // Extract saved materials, employees, and costs from estimate
  // Check both old format (direct fields) and new format (Cost object)
  const costData = (estimate as any).Cost || {}
  const selectedMaterials = (estimate as any).selectedMaterials || []
  const assignedEmployees = (estimate as any).assignedEmployees || []
  const materialsCost = costData.materialsCost || (estimate as any).materialsCost || 0
  const payrollCost = costData.payrollCost || (estimate as any).payrollCost || 0
  const materials = costData.materials || (estimate as any).materials || []
  const payroll = costData.payroll || (estimate as any).payroll || []
  const totalDays = (estimate as any).totalDays || 0
  const photos = (estimate as any).photos || []
  
  // Recalculate cost and profit with actual materials and payroll
  const actualCost = materialsCost + payrollCost
  const actualProfit = revenue - actualCost

  return {
    id: estimate.id,
    name: jobName,
    site: site,
    status: status,
    revenue: revenue,
    cost: actualCost > 0 ? actualCost : cost, // Use actual cost if available, otherwise use estimate
    profit: actualProfit !== revenue - cost ? actualProfit : profit, // Use actual profit if calculated
    startDate: estimate.dateRange.start || '',
    endDate: estimate.dateRange.end || '',
    customerName: estimate.customerCompanyName || undefined,
    customerId: estimate.customerId,
    customerEmail: estimate.customerEmail,
    approved: approved,
    paid: paid,
    photosUploaded: photos.length > 0,
    materialsFinalized: selectedMaterials.length > 0,
    payrollPending: assignedEmployees.length === 0,
    invoiceDrafted: false, // TODO: Check if invoice exists
    estimateId: estimate.id,
    location: estimate.location || '',
    jobs: estimate.jobs || [], // Include the jobs array
    selectedMaterials: selectedMaterials, // Include saved materials
    assignedEmployees: assignedEmployees, // Include saved employees
    photos: photos, // Include photo URLs
    totalDays: totalDays,
    payrollCost: payrollCost,
    materialsCost: materialsCost,
    materials: materials, // Detailed materials breakdown
    payroll: payroll, // Detailed payroll breakdown
    Cost: {
      materialsCost,
      materials,
      payrollCost,
      payroll,
      totalCost: actualCost,
    },
  }
}

/**
 * Fetch all jobs (transformed from estimates)
 */
export async function getAllJobs(): Promise<TransformedJob[]> {
  try {
    const estimates = await getAllEstimates()
    return estimates.map(transformEstimateToJob)
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }
}

/**
 * Fetch a single estimate by ID from consolidated jobs collection
 */
export async function getEstimateById(customerId: string, estimateId: string): Promise<Estimate | null> {
  try {
    const jobRef = doc(db, 'jobs', estimateId)
    const jobDoc = await getDoc(jobRef)
    
    if (!jobDoc.exists()) {
      return null
    }
    
    const data = jobDoc.data()
    
    // Verify this job belongs to the customer (security check)
    if (data.customerId !== customerId) {
      console.warn(`Job ${estimateId} does not belong to customer ${customerId}`)
      return null
    }
    
    return {
      id: jobDoc.id,
      uid: data.uid || data.customerId || customerId,
      customerId: data.customerId || customerId,
      customerEmail: data.customerEmail || '',
      customerCompanyName: data.customerCompanyName || '',
      jobs: data.jobs || [],
      totalPrice: data.totalPrice || 0,
      dateRange: data.dateRange || { start: '', end: '' },
      location: data.location || '',
      status: data.status || 'pending',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
    }
  } catch (error: any) {
    console.error('Error fetching estimate:', error)
    throw new Error(`Failed to fetch estimate: ${error.message}`)
  }
}

/**
 * Update job status in Firestore
 */
export async function updateJobStatus(jobId: string, status: string): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId)
    await updateDoc(jobRef, {
      status: status,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error('Error updating job status:', error)
    throw new Error(`Failed to update job status: ${error.message}`)
  }
}

/**
 * Delete a job from Firestore
 */
export async function deleteJob(jobId: string): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId)
    await deleteDoc(jobRef)
  } catch (error: any) {
    console.error('Error deleting job:', error)
    throw new Error(`Failed to delete job: ${error.message}`)
  }
}

/**
 * Update job with materials, employees, etc.
 */
export async function updateJobData(jobId: string, updates: {
  assignedEmployees?: string[]
  selectedMaterials?: string[] | { materialId: string; quantity: number }[]
  photos?: string[]
  totalDays?: number
  payrollCost?: number
  materialsCost?: number
  materials?: { materialId: string; name: string; quantity: number; unitCost: number; totalCost: number }[]
  payroll?: { employeeId: string; employeeName: string; hourlyRate: number; hours: number; totalCost: number }[]
}): Promise<void> {
  try {
    const jobRef = doc(db, 'jobs', jobId)
    
    // Get existing job data to preserve Cost object fields
    const jobDoc = await getDoc(jobRef)
    const existingData = jobDoc.exists() ? jobDoc.data() : {}
    const existingCost = existingData.Cost || {}
    
    // Build Cost object structure - merge with existing
    const costUpdate: any = {
      ...existingCost, // Preserve existing cost data
    }
    
    // Update materials if provided
    if (updates.materialsCost !== undefined || updates.materials !== undefined) {
      costUpdate.materialsCost = updates.materialsCost ?? existingCost.materialsCost ?? 0
      costUpdate.materials = updates.materials ?? existingCost.materials ?? []
    }
    
    // Update payroll if provided
    if (updates.payrollCost !== undefined || updates.payroll !== undefined) {
      costUpdate.payrollCost = updates.payrollCost ?? existingCost.payrollCost ?? 0
      costUpdate.payroll = updates.payroll ?? existingCost.payroll ?? []
    }
    
    // Calculate total cost
    costUpdate.totalCost = (costUpdate.materialsCost || 0) + (costUpdate.payrollCost || 0)
    
    // Prepare update data - exclude materials and payroll from top level
    const { materials, payroll, ...otherUpdates } = updates
    const updateData: any = {
      ...otherUpdates,
      Cost: costUpdate, // Always include Cost object
      updatedAt: serverTimestamp(),
    }
    
    await updateDoc(jobRef, updateData)
    console.log('Updated job data:', { jobId, costUpdate })
  } catch (error: any) {
    console.error('Error updating job data:', error)
    throw new Error(`Failed to update job data: ${error.message}`)
  }
}

/**
 * Duplicate a job (create a copy)
 */
export async function duplicateJob(jobId: string): Promise<string> {
  try {
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await getDoc(jobRef)
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found')
    }
    
    const data = jobDoc.data()
    
    // Create a new job document with the same data
    const newJobRef = doc(collection(db, 'jobs'))
    await setDoc(newJobRef, {
      ...data,
      status: 'pending', // Reset status to pending for duplicate
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return newJobRef.id
  } catch (error: any) {
    console.error('Error duplicating job:', error)
    throw new Error(`Failed to duplicate job: ${error.message}`)
  }
}

