import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import { getGasPricingConfig, GasPricingConfig, getMileagePayrollConfig, MileagePayrollConfig } from './pricingConfig'
// Import will be done dynamically to avoid circular dependencies

/**
 * Calculate mileage payroll for a job item
 * Formula: number of assigned employees * distanceMiles * ratePerMile
 * Returns array of mileage payroll entries per employee
 */
export interface MileagePayrollEntry {
  employeeId: string
  employeeName: string
  miles: number
  ratePerMile: number
  totalCost: number
}

export async function calculateMileagePayroll(
  assignedEmployees: string[],
  distanceMiles: number,
  adminDb?: any
): Promise<MileagePayrollEntry[]> {
  const logPrefix = '🚗 [MILEAGE_PAYROLL]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Calculating mileage payroll`)
  console.log(`${logPrefix} Assigned employees:`, assignedEmployees.length)
  console.log(`${logPrefix} Distance:`, distanceMiles.toFixed(2), 'miles')
  console.log(`${logPrefix} ========================================`)

  if (!assignedEmployees || assignedEmployees.length === 0) {
    console.log(`${logPrefix} No employees assigned, mileage payroll = 0`)
    return []
  }

  if (distanceMiles <= 0) {
    console.log(`${logPrefix} Distance is 0, mileage payroll = 0`)
    return []
  }

  try {
    // Get mileage payroll config
    const config = await getMileagePayrollConfig()
    if (!config.enabled) {
      console.log(`${logPrefix} Mileage payroll is disabled`)
      return []
    }

    const ratePerMile = config.ratePerMile
    console.log(`${logPrefix} Rate per mile: $${ratePerMile.toFixed(2)}`)

    // Get employee names from Firestore
    const mileagePayroll: MileagePayrollEntry[] = []
    
    // Use admin DB if provided, otherwise use client DB
    const dbToUse = adminDb || db

    for (const employeeId of assignedEmployees) {
      try {
        // Try to get employee name from employees collection
        const employeeRef = doc(dbToUse, 'employees', employeeId)
        const employeeDoc = await getDoc(employeeRef)
        
        let employeeName = employeeId // Fallback to ID if name not found
        if (employeeDoc.exists()) {
          const employeeData = employeeDoc.data()
          employeeName = employeeData.name || employeeData.displayName || employeeId
        }

        const totalCost = distanceMiles * ratePerMile
        mileagePayroll.push({
          employeeId,
          employeeName,
          miles: Math.round(distanceMiles * 100) / 100,
          ratePerMile,
          totalCost: Math.round(totalCost * 100) / 100,
        })

        console.log(`${logPrefix} Employee ${employeeName}:`, {
          miles: distanceMiles.toFixed(2),
          ratePerMile: `$${ratePerMile.toFixed(2)}`,
          totalCost: `$${totalCost.toFixed(2)}`,
        })
      } catch (error: any) {
        console.error(`${logPrefix} Error fetching employee ${employeeId}:`, error)
        // Still add entry with employeeId as name
        const totalCost = distanceMiles * ratePerMile
        mileagePayroll.push({
          employeeId,
          employeeName: employeeId,
          miles: Math.round(distanceMiles * 100) / 100,
          ratePerMile,
          totalCost: Math.round(totalCost * 100) / 100,
        })
      }
    }

    const totalMileagePayrollCost = mileagePayroll.reduce((sum, entry) => sum + entry.totalCost, 0)
    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} ✅ Mileage payroll calculated:`, {
      entries: mileagePayroll.length,
      totalCost: `$${totalMileagePayrollCost.toFixed(2)}`,
    })
    console.log(`${logPrefix} ========================================`)

    return mileagePayroll
  } catch (error: any) {
    console.error(`${logPrefix} ========================================`)
    console.error(`${logPrefix} ❌ Error calculating mileage payroll:`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
    })
    console.error(`${logPrefix} ========================================`)
    return []
  }
}

/**
 * Recursively remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item))
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {}
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefinedValues(obj[key])
      }
    }
    return cleaned
  }
  
  return obj
}

export interface GasCalculation {
  enabled: boolean
  originType: 'prior_job' | 'office'
  originJobId?: string
  originAddress: string
  destinationAddress: string
  distanceMiles: number
  gasPricePerGallon: number
  mpg: number
  basePerMile: number
  surgeApplied: boolean
  surgeMilesThreshold: number
  surgeMultiplier: number
  surgePerMile: number
  expenseCost: number
  customerSurcharge: number
  lastCalculatedAt: Date
}

/**
 * Calculate distance between two addresses using Google Maps Distance Matrix API
 * For now, returns a placeholder - you'll need to implement the actual API call
 */
export async function calculateDistanceMiles(origin: string, destination: string): Promise<number> {
  console.log('🟢 [GAS PRICING] calculateDistanceMiles called:', { origin, destination })
  
  try {
    // Import distance calculation function
    const { calculateDrivingDistance } = await import('./distanceApi')
    const result = await calculateDrivingDistance(origin, destination)
    
    if (result && result.distanceMiles > 0) {
      console.log('✅ [GAS PRICING] Distance calculated:', result.distanceMiles, 'miles')
      return result.distanceMiles
    }
    
    // Fallback: if API not implemented, return 0 (gas will be 0)
    console.warn('⚠️ [GAS PRICING] Distance calculation returned 0 - API may not be implemented yet or addresses invalid')
    return 0
  } catch (error: any) {
    console.error('❌ [GAS PRICING] Error calculating distance:', error)
    // Return 0 on error so job creation doesn't fail
    return 0
  }
}

/**
 * Find the most recent prior job that ended 1-2 days before the given start date
 * SPEC: Look for jobs that ended within [startDate - 2 days, startDate - 1 day]
 * If multiple qualify, choose the one with the latest end date (closest in time)
 */
export async function findPriorJob(
  startDate: Date,
  excludeJobId?: string
): Promise<{ jobId: string; location: string; endDate: Date } | null> {
  const logPrefix = '🔍 [FIND_PRIOR_JOB]'
  console.log(`${logPrefix} Starting prior job lookup:`, {
    startDate: startDate.toISOString(),
    excludeJobId,
  })
  
  try {
    // Calculate lookback window: 1-2 days before start date
    const lookbackStart = new Date(startDate)
    lookbackStart.setDate(lookbackStart.getDate() - 2)
    lookbackStart.setHours(0, 0, 0, 0)
    
    const lookbackEnd = new Date(startDate)
    lookbackEnd.setDate(lookbackEnd.getDate() - 1)
    lookbackEnd.setHours(23, 59, 59, 999)
    
    console.log(`${logPrefix} Lookback window:`, {
      start: lookbackStart.toISOString(),
      end: lookbackEnd.toISOString(),
      windowDays: '1-2 days before start',
    })
    
    // Query all jobs - include scheduled/approved jobs that might be used as origins
    const jobsRef = collection(db, 'jobs')
    const q = query(
      jobsRef,
      where('status', 'in', ['completed', 'paid', 'in_progress', 'approved', 'outstanding', 'pending'])
    )
    
    console.log(`${logPrefix} Querying jobs collection...`)
    const snapshot = await getDocs(q)
    console.log(`${logPrefix} Found ${snapshot.size} total jobs to check`)
    
    let bestMatch: { jobId: string; location: string; endDate: Date } | null = null
    let latestEndDate: Date | null = null
    let candidatesChecked = 0
    let candidatesInWindow = 0
    
    snapshot.forEach((doc) => {
      if (doc.id === excludeJobId) {
        console.log(`${logPrefix} Skipping excluded job: ${doc.id}`)
        return
      }
      
      candidatesChecked++
      const data = doc.data()
      
      if (!data.dateRange?.end) {
        console.log(`${logPrefix} Job ${doc.id} has no dateRange.end, skipping`)
        return
      }
      
      // Parse end date
      const endDate = typeof data.dateRange.end === 'string' 
        ? new Date(data.dateRange.end) 
        : (data.dateRange.end.toDate ? data.dateRange.end.toDate() : new Date(data.dateRange.end))
      
      if (!endDate || isNaN(endDate.getTime())) {
        console.log(`${logPrefix} Job ${doc.id} has invalid end date, skipping`)
        return
      }
      
      console.log(`${logPrefix} Checking job ${doc.id}:`, {
        endDate: endDate.toISOString(),
        location: data.location || 'N/A',
        status: data.status,
        inWindow: endDate >= lookbackStart && endDate <= lookbackEnd,
      })
      
      // Check if end date is within lookback window (1-2 days before start)
      if (endDate >= lookbackStart && endDate <= lookbackEnd) {
        candidatesInWindow++
        console.log(`${logPrefix} ✅ Job ${doc.id} is in window!`, {
          endDate: endDate.toISOString(),
          daysBeforeStart: Math.round((startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10,
        })
        
        // Choose the one with the latest end date (closest in time to start)
        if (!latestEndDate || endDate > latestEndDate) {
          console.log(`${logPrefix} 🎯 New best match found: ${doc.id} (end date: ${endDate.toISOString()})`)
          latestEndDate = endDate
          bestMatch = {
            jobId: doc.id,
            location: data.location || '',
            endDate: endDate,
          }
        } else {
          console.log(`${logPrefix} Job ${doc.id} is in window but not the latest (current best: ${latestEndDate.toISOString()})`)
        }
      }
    })
    
    let bestMatchForLog: { jobId: string; location: string; endDate: string } | null = null
    if (bestMatch !== null) {
      const match = bestMatch as { jobId: string; location: string; endDate: Date }
      bestMatchForLog = {
        jobId: match.jobId,
        location: match.location,
        endDate: match.endDate.toISOString(),
      }
    }
    
    console.log(`${logPrefix} Prior job lookup complete:`, {
      candidatesChecked,
      candidatesInWindow,
      bestMatch: bestMatchForLog,
    })
    
    return bestMatch
  } catch (error: any) {
    console.error(`${logPrefix} ❌ Error finding prior job:`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
    })
    return null
  }
}

/**
 * Server-side version using Firebase Admin SDK
 * SPEC: Look for jobs that ended within [startDate - 2 days, startDate - 1 day]
 * If multiple qualify, choose the one with the latest end date (closest in time)
 */
export async function findPriorJobAdmin(
  startDate: Date,
  excludeJobId?: string,
  adminDb?: any
): Promise<{ jobId: string; location: string; endDate: Date } | null> {
  const logPrefix = '🔍 [FIND_PRIOR_JOB_ADMIN]'
  console.log(`${logPrefix} Starting prior job lookup (Admin SDK):`, {
    startDate: startDate.toISOString(),
    excludeJobId,
  })
  
  try {
    // Calculate lookback window: 1-2 days before start date
    const lookbackStart = new Date(startDate)
    lookbackStart.setDate(lookbackStart.getDate() - 2)
    lookbackStart.setHours(0, 0, 0, 0)
    
    const lookbackEnd = new Date(startDate)
    lookbackEnd.setDate(lookbackEnd.getDate() - 1)
    lookbackEnd.setHours(23, 59, 59, 999)
    
    console.log(`${logPrefix} Lookback window:`, {
      start: lookbackStart.toISOString(),
      end: lookbackEnd.toISOString(),
      windowDays: '1-2 days before start',
    })
    
    if (!adminDb) {
      const { getFirebaseAdminApp } = await import('./firebaseAdmin')
      const adminApp = getFirebaseAdminApp()
      adminDb = adminApp.firestore()
      console.log(`${logPrefix} Initialized Admin Firestore instance`)
    }
    
    // Query all jobs - include scheduled/approved jobs that might be used as origins
    const jobsRef = adminDb.collection('jobs')
    console.log(`${logPrefix} Querying jobs collection with Admin SDK...`)
    const snapshot = await jobsRef
      .where('status', 'in', ['completed', 'paid', 'in_progress', 'approved', 'outstanding', 'pending'])
      .get()
    
    console.log(`${logPrefix} Found ${snapshot.size} total jobs to check`)
    
    let bestMatch: { jobId: string; location: string; endDate: Date } | null = null
    let latestEndDate: Date | null = null
    let candidatesChecked = 0
    let candidatesInWindow = 0
    
    snapshot.forEach((doc: any) => {
      if (doc.id === excludeJobId) {
        console.log(`${logPrefix} Skipping excluded job: ${doc.id}`)
        return
      }
      
      candidatesChecked++
      const data = doc.data()
      
      if (!data.dateRange?.end) {
        console.log(`${logPrefix} Job ${doc.id} has no dateRange.end, skipping`)
        return
      }
      
      // Parse end date (Admin SDK returns Timestamp objects)
      const endDate = data.dateRange.end?.toDate 
        ? data.dateRange.end.toDate() 
        : (typeof data.dateRange.end === 'string' 
          ? new Date(data.dateRange.end) 
          : new Date(data.dateRange.end))
      
      if (!endDate || isNaN(endDate.getTime())) {
        console.log(`${logPrefix} Job ${doc.id} has invalid end date, skipping`)
        return
      }
      
      console.log(`${logPrefix} Checking job ${doc.id}:`, {
        endDate: endDate.toISOString(),
        location: data.location || 'N/A',
        status: data.status,
        inWindow: endDate >= lookbackStart && endDate <= lookbackEnd,
      })
      
      // Check if end date is within lookback window (1-2 days before start)
      if (endDate >= lookbackStart && endDate <= lookbackEnd) {
        candidatesInWindow++
        console.log(`${logPrefix} ✅ Job ${doc.id} is in window!`, {
          endDate: endDate.toISOString(),
          daysBeforeStart: Math.round((startDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10,
        })
        
        // Choose the one with the latest end date (closest in time to start)
        if (!latestEndDate || endDate > latestEndDate) {
          console.log(`${logPrefix} 🎯 New best match found: ${doc.id} (end date: ${endDate.toISOString()})`)
          latestEndDate = endDate
          bestMatch = {
            jobId: doc.id,
            location: data.location || '',
            endDate: endDate,
          }
        } else {
          console.log(`${logPrefix} Job ${doc.id} is in window but not the latest (current best: ${latestEndDate.toISOString()})`)
        }
      }
    })
    
    let bestMatchForLogAdmin: { jobId: string; location: string; endDate: string } | null = null
    if (bestMatch !== null) {
      const match = bestMatch as { jobId: string; location: string; endDate: Date }
      bestMatchForLogAdmin = {
        jobId: match.jobId,
        location: match.location,
        endDate: match.endDate.toISOString(),
      }
    }
    
    console.log(`${logPrefix} Prior job lookup complete:`, {
      candidatesChecked,
      candidatesInWindow,
      bestMatch: bestMatchForLogAdmin,
    })
    
    return bestMatch
  } catch (error: any) {
    console.error(`${logPrefix} ❌ Error finding prior job (Admin):`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
    })
    return null
  }
}

/**
 * Calculate gas pricing for a single job item
 * SPEC: basePerMile = gasPricePerGallon / mpg
 *       expenseCost = distanceMiles * basePerMile (always, internal cost)
 *       customerSurcharge = surgeApplied ? (FULL_SURGE: distanceMiles * surgePerMile, INCREMENT_ONLY: distanceMiles * (surgePerMile - basePerMile)) : 0
 */
export async function calculateGasForJobItem(
  jobItem: any,
  jobStartDate: Date,
  currentJobId?: string
): Promise<GasCalculation | null> {
  const logPrefix = '🟡 [GAS_CALC_ITEM]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Starting gas calculation for job item:`, {
    jobItemId: jobItem.id || jobItem.name,
    jobItemName: jobItem.name || 'Unnamed',
    jobStartDate: jobStartDate.toISOString(),
    currentJobId,
    jobItemLocation: jobItem.location || 'MISSING',
  })
  console.log(`${logPrefix} ========================================`)
  
  try {
    // Step 1: Load pricing configuration
    console.log(`${logPrefix} Step 1: Loading pricing configuration...`)
    const config = await getGasPricingConfig()
    console.log(`${logPrefix} ✅ Config loaded:`, {
      enabled: config.enabled,
      officeAddress: config.officeAddress,
      gasPricePerGallon: config.gasPricePerGallon,
      mpg: config.mpg,
      surgeEnabled: config.surge.enabled,
      surgeThreshold: config.surge.milesThreshold,
      surgeMultiplier: config.surge.multiplier,
      pricingMode: config.pricingMode,
    })
    
    if (!config.enabled) {
      console.warn(`${logPrefix} ⚠️ Gas pricing is disabled in config - returning null`)
      return null
    }
    
    // Step 2: Validate destination
    const destination = jobItem.location || ''
    if (!destination) {
      console.warn(`${logPrefix} ⚠️ Job item has no location/destination address - returning null`)
      return null
    }
    console.log(`${logPrefix} Step 2: Destination validated:`, { destination })
    
    // Step 3: Find prior job or use office
    console.log(`${logPrefix} Step 3: Finding origin (prior job or office)...`)
    console.log(`${logPrefix} Looking for jobs that ended 1-2 days before: ${jobStartDate.toISOString()}`)
    const priorJob = await findPriorJob(jobStartDate, currentJobId)
    const originType: 'prior_job' | 'office' = priorJob ? 'prior_job' : 'office'
    const originAddress = priorJob ? priorJob.location : config.officeAddress
    
    console.log(`${logPrefix} ✅ Origin determined:`, {
      originType,
      originAddress,
      priorJobId: priorJob?.jobId || 'N/A',
      priorJobEndDate: priorJob?.endDate.toISOString() || 'N/A',
      reason: priorJob ? `Found prior job ending ${Math.round((jobStartDate.getTime() - priorJob.endDate.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10} days before` : 'No prior job found, using office',
    })
    
    // Step 4: Calculate distance
    console.log(`${logPrefix} Step 4: Calculating driving distance...`)
    console.log(`${logPrefix} Route: ${originAddress} → ${destination}`)
    const distanceMiles = await calculateDistanceMiles(originAddress, destination)
    console.log(`${logPrefix} ✅ Distance calculated:`, {
      distanceMiles: distanceMiles.toFixed(2),
      distanceMeters: (distanceMiles * 1609.34).toFixed(0),
    })
    
    if (distanceMiles <= 0) {
      console.warn(`${logPrefix} ⚠️ Invalid distance (${distanceMiles}) - returning null`)
      return null
    }
    
    // Step 5: Calculate base pricing
    console.log(`${logPrefix} Step 5: Calculating base pricing...`)
    const basePerMile = config.gasPricePerGallon / config.mpg
    console.log(`${logPrefix} Base per mile calculation:`, {
      formula: `${config.gasPricePerGallon} / ${config.mpg}`,
      basePerMile: basePerMile.toFixed(4),
      units: '$/mile',
    })
    
    // Step 6: Check if surge applies
    console.log(`${logPrefix} Step 6: Checking surge conditions...`)
    const surgeApplied = config.surge.enabled && distanceMiles > config.surge.milesThreshold
    const surgePerMile = basePerMile * config.surge.multiplier
    
    console.log(`${logPrefix} Surge check:`, {
      surgeEnabled: config.surge.enabled,
      distanceMiles: distanceMiles.toFixed(2),
      threshold: config.surge.milesThreshold,
      comparison: `${distanceMiles.toFixed(2)} > ${config.surge.milesThreshold}`,
      surgeApplied,
      surgeMultiplier: config.surge.multiplier,
      surgePerMile: surgePerMile.toFixed(4),
    })
    
    // Step 7: Calculate costs (SPEC: expenseCost always calculated, surcharge only on surge)
    console.log(`${logPrefix} Step 7: Calculating costs...`)
    const expenseCost = distanceMiles * basePerMile
    console.log(`${logPrefix} Internal expense cost:`, {
      formula: `${distanceMiles.toFixed(2)} * ${basePerMile.toFixed(4)}`,
      expenseCost: expenseCost.toFixed(2),
      units: '$',
      note: 'Always calculated (internal cost)',
    })
    
    // Calculate customer surcharge based on pricing mode
    let customerSurcharge = 0
    if (surgeApplied) {
      if (config.pricingMode === 'FULL_SURGE') {
        // SPEC: Customer pays full surge rate
        customerSurcharge = distanceMiles * surgePerMile
        console.log(`${logPrefix} Customer surcharge (FULL_SURGE):`, {
          formula: `${distanceMiles.toFixed(2)} * ${surgePerMile.toFixed(4)}`,
          customerSurcharge: customerSurcharge.toFixed(2),
          units: '$',
          note: 'Customer pays full surge rate',
        })
      } else {
        // SPEC: INCREMENT_ONLY - customer pays only the increment above base
        customerSurcharge = distanceMiles * (surgePerMile - basePerMile)
        console.log(`${logPrefix} Customer surcharge (INCREMENT_ONLY):`, {
          formula: `${distanceMiles.toFixed(2)} * (${surgePerMile.toFixed(4)} - ${basePerMile.toFixed(4)})`,
          increment: (surgePerMile - basePerMile).toFixed(4),
          customerSurcharge: customerSurcharge.toFixed(2),
          units: '$',
          note: 'Customer pays only increment above base',
        })
      }
    } else {
      console.log(`${logPrefix} No customer surcharge (surge not applied)`)
    }
    
    // Step 8: Build result object
    // Note: originJobId is optional - only set if priorJob exists (Firestore doesn't allow undefined)
    const result: GasCalculation = {
      enabled: true,
      originType,
      ...(priorJob?.jobId && { originJobId: priorJob.jobId }), // Only include if defined
      originAddress,
      destinationAddress: destination,
      distanceMiles: Math.round(distanceMiles * 100) / 100, // Round to 2 decimals
      gasPricePerGallon: config.gasPricePerGallon,
      mpg: config.mpg,
      basePerMile: Math.round(basePerMile * 10000) / 10000, // Round to 4 decimals
      surgeApplied,
      surgeMilesThreshold: config.surge.milesThreshold,
      surgeMultiplier: config.surge.multiplier,
      surgePerMile: Math.round(surgePerMile * 10000) / 10000, // Round to 4 decimals
      expenseCost: Math.round(expenseCost * 100) / 100, // Round to 2 decimals
      customerSurcharge: Math.round(customerSurcharge * 100) / 100, // Round to 2 decimals
      lastCalculatedAt: new Date(),
    }
    
    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} ✅ Gas calculation complete:`, {
      expenseCost: `$${result.expenseCost.toFixed(2)}`,
      customerSurcharge: `$${result.customerSurcharge.toFixed(2)}`,
      distanceMiles: `${result.distanceMiles.toFixed(2)} miles`,
      surgeApplied: result.surgeApplied ? 'YES' : 'NO',
      originType: result.originType,
      originJobId: result.originJobId || 'N/A (using office)',
    })
    console.log(`${logPrefix} ========================================`)
    
    return result
  } catch (error: any) {
    console.error(`${logPrefix} ========================================`)
    console.error(`${logPrefix} ❌ Error calculating gas for job item:`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
      jobItemId: jobItem.id || jobItem.name,
    })
    console.error(`${logPrefix} ========================================`)
    return null
  }
}

/**
 * Server-side version using Firebase Admin SDK
 * SPEC: basePerMile = gasPricePerGallon / mpg
 *       expenseCost = distanceMiles * basePerMile (always, internal cost)
 *       customerSurcharge = surgeApplied ? (FULL_SURGE: distanceMiles * surgePerMile, INCREMENT_ONLY: distanceMiles * (surgePerMile - basePerMile)) : 0
 */
export async function calculateGasForJobItemAdmin(
  jobItem: any,
  jobStartDate: Date,
  currentJobId?: string,
  adminDb?: any
): Promise<GasCalculation | null> {
  const logPrefix = '🟡 [GAS_CALC_ITEM_ADMIN]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Starting gas calculation for job item (Admin SDK):`, {
    jobItemId: jobItem.id || jobItem.name,
    jobItemName: jobItem.name || 'Unnamed',
    jobStartDate: jobStartDate.toISOString(),
    currentJobId,
    jobItemLocation: jobItem.location || 'MISSING',
  })
  console.log(`${logPrefix} ========================================`)
  
  try {
    // Step 1: Load pricing configuration
    console.log(`${logPrefix} Step 1: Loading pricing configuration...`)
    const config = await getGasPricingConfig()
    console.log(`${logPrefix} ✅ Config loaded:`, {
      enabled: config.enabled,
      officeAddress: config.officeAddress,
      gasPricePerGallon: config.gasPricePerGallon,
      mpg: config.mpg,
      surgeEnabled: config.surge.enabled,
      surgeThreshold: config.surge.milesThreshold,
      surgeMultiplier: config.surge.multiplier,
      pricingMode: config.pricingMode,
    })
    
    if (!config.enabled) {
      console.warn(`${logPrefix} ⚠️ Gas pricing is disabled in config - returning null`)
      return null
    }
    
    // Step 2: Validate destination
    const destination = jobItem.location || ''
    if (!destination) {
      console.warn(`${logPrefix} ⚠️ Job item has no location/destination address - returning null`)
      return null
    }
    console.log(`${logPrefix} Step 2: Destination validated:`, { destination })
    
    // Step 3: Find prior job or use office (using Admin SDK)
    console.log(`${logPrefix} Step 3: Finding origin (prior job or office) using Admin SDK...`)
    console.log(`${logPrefix} Looking for jobs that ended 1-2 days before: ${jobStartDate.toISOString()}`)
    const priorJob = await findPriorJobAdmin(jobStartDate, currentJobId, adminDb)
    const originType: 'prior_job' | 'office' = priorJob ? 'prior_job' : 'office'
    const originAddress = priorJob ? priorJob.location : config.officeAddress
    
    console.log(`${logPrefix} ✅ Origin determined:`, {
      originType,
      originAddress,
      priorJobId: priorJob?.jobId || 'N/A',
      priorJobEndDate: priorJob?.endDate.toISOString() || 'N/A',
      reason: priorJob ? `Found prior job ending ${Math.round((jobStartDate.getTime() - priorJob.endDate.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10} days before` : 'No prior job found, using office',
    })
    
    // Step 4: Calculate distance
    console.log(`${logPrefix} Step 4: Calculating driving distance...`)
    console.log(`${logPrefix} Route: ${originAddress} → ${destination}`)
    const distanceMiles = await calculateDistanceMiles(originAddress, destination)
    
    // Validate distanceMiles is a valid number
    if (distanceMiles === undefined || distanceMiles === null || isNaN(distanceMiles)) {
      console.error(`${logPrefix} ❌ Invalid distance (${distanceMiles}) - returning null`)
      return null
    }
    
    console.log(`${logPrefix} ✅ Distance calculated:`, {
      distanceMiles: distanceMiles.toFixed(2),
      distanceMeters: (distanceMiles * 1609.34).toFixed(0),
    })
    
    if (distanceMiles <= 0) {
      console.warn(`${logPrefix} ⚠️ Invalid distance (${distanceMiles}) - returning null`)
      return null
    }
    
    // Step 5: Calculate base pricing
    console.log(`${logPrefix} Step 5: Calculating base pricing...`)
    
    // Validate config values
    if (config.gasPricePerGallon === undefined || config.gasPricePerGallon === null || isNaN(config.gasPricePerGallon)) {
      console.error(`${logPrefix} ❌ Invalid gasPricePerGallon: ${config.gasPricePerGallon}`)
      return null
    }
    if (config.mpg === undefined || config.mpg === null || isNaN(config.mpg) || config.mpg === 0) {
      console.error(`${logPrefix} ❌ Invalid mpg: ${config.mpg}`)
      return null
    }
    
    const basePerMile = config.gasPricePerGallon / config.mpg
    
    if (basePerMile === undefined || basePerMile === null || isNaN(basePerMile)) {
      console.error(`${logPrefix} ❌ Invalid basePerMile calculation: ${basePerMile}`)
      return null
    }
    
    console.log(`${logPrefix} Base per mile calculation:`, {
      formula: `${config.gasPricePerGallon} / ${config.mpg}`,
      basePerMile: basePerMile.toFixed(4),
      units: '$/mile',
    })
    
    // Step 6: Check if surge applies
    console.log(`${logPrefix} Step 6: Checking surge conditions...`)
    const surgeApplied = config.surge.enabled && distanceMiles > config.surge.milesThreshold
    
    if (config.surge.multiplier === undefined || config.surge.multiplier === null || isNaN(config.surge.multiplier)) {
      console.error(`${logPrefix} ❌ Invalid surge.multiplier: ${config.surge.multiplier}`)
      return null
    }
    
    const surgePerMile = basePerMile * config.surge.multiplier
    
    if (surgePerMile === undefined || surgePerMile === null || isNaN(surgePerMile)) {
      console.error(`${logPrefix} ❌ Invalid surgePerMile calculation: ${surgePerMile}`)
      return null
    }
    
    console.log(`${logPrefix} Surge check:`, {
      surgeEnabled: config.surge.enabled,
      distanceMiles: distanceMiles.toFixed(2),
      threshold: config.surge.milesThreshold,
      comparison: `${distanceMiles.toFixed(2)} > ${config.surge.milesThreshold}`,
      surgeApplied,
      surgeMultiplier: config.surge.multiplier,
      surgePerMile: surgePerMile.toFixed(4),
    })
    
    // Step 7: Calculate costs (SPEC: expenseCost always calculated, surcharge only on surge)
    console.log(`${logPrefix} Step 7: Calculating costs...`)
    const expenseCost = distanceMiles * basePerMile
    
    if (expenseCost === undefined || expenseCost === null || isNaN(expenseCost)) {
      console.error(`${logPrefix} ❌ Invalid expenseCost calculation: ${expenseCost}`)
      return null
    }
    
    console.log(`${logPrefix} Internal expense cost:`, {
      formula: `${distanceMiles.toFixed(2)} * ${basePerMile.toFixed(4)}`,
      expenseCost: expenseCost.toFixed(2),
      units: '$',
      note: 'Always calculated (internal cost)',
    })
    
    // Calculate customer surcharge based on pricing mode
    let customerSurcharge = 0
    if (surgeApplied) {
      if (config.pricingMode === 'FULL_SURGE') {
        // SPEC: Customer pays full surge rate
        customerSurcharge = distanceMiles * surgePerMile
        if (customerSurcharge === undefined || customerSurcharge === null || isNaN(customerSurcharge)) {
          console.error(`${logPrefix} ❌ Invalid customerSurcharge (FULL_SURGE) calculation: ${customerSurcharge}`)
          return null
        }
        console.log(`${logPrefix} Customer surcharge (FULL_SURGE):`, {
          formula: `${distanceMiles.toFixed(2)} * ${surgePerMile.toFixed(4)}`,
          customerSurcharge: customerSurcharge.toFixed(2),
          units: '$',
          note: 'Customer pays full surge rate',
        })
      } else {
        // SPEC: INCREMENT_ONLY - customer pays only the increment above base
        customerSurcharge = distanceMiles * (surgePerMile - basePerMile)
        if (customerSurcharge === undefined || customerSurcharge === null || isNaN(customerSurcharge)) {
          console.error(`${logPrefix} ❌ Invalid customerSurcharge (INCREMENT_ONLY) calculation: ${customerSurcharge}`)
          return null
        }
        console.log(`${logPrefix} Customer surcharge (INCREMENT_ONLY):`, {
          formula: `${distanceMiles.toFixed(2)} * (${surgePerMile.toFixed(4)} - ${basePerMile.toFixed(4)})`,
          increment: (surgePerMile - basePerMile).toFixed(4),
          customerSurcharge: customerSurcharge.toFixed(2),
          units: '$',
          note: 'Customer pays only increment above base',
        })
      }
    } else {
      console.log(`${logPrefix} No customer surcharge (surge not applied)`)
    }
    
    // Step 8: Build result object
    // Note: originJobId is optional - only set if priorJob exists
    const result: GasCalculation = {
      enabled: true,
      originType,
      ...(priorJob?.jobId && { originJobId: priorJob.jobId }), // Only include if defined
      originAddress,
      destinationAddress: destination,
      distanceMiles: Math.round(distanceMiles * 100) / 100, // Round to 2 decimals
      gasPricePerGallon: config.gasPricePerGallon,
      mpg: config.mpg,
      basePerMile: Math.round(basePerMile * 10000) / 10000, // Round to 4 decimals
      surgeApplied,
      surgeMilesThreshold: config.surge.milesThreshold,
      surgeMultiplier: config.surge.multiplier,
      surgePerMile: Math.round(surgePerMile * 10000) / 10000, // Round to 4 decimals
      expenseCost: Math.round(expenseCost * 100) / 100, // Round to 2 decimals
      customerSurcharge: Math.round(customerSurcharge * 100) / 100, // Round to 2 decimals
      lastCalculatedAt: new Date(),
    }
    
    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} ✅ Gas calculation complete:`, {
      expenseCost: `$${result.expenseCost.toFixed(2)}`,
      customerSurcharge: `$${result.customerSurcharge.toFixed(2)}`,
      distanceMiles: `${result.distanceMiles.toFixed(2)} miles`,
      surgeApplied: result.surgeApplied ? 'YES' : 'NO',
      originType: result.originType,
      originJobId: result.originJobId || 'N/A (using office)',
    })
    console.log(`${logPrefix} ========================================`)
    
    return result
  } catch (error: any) {
    console.error(`${logPrefix} ========================================`)
    console.error(`${logPrefix} ❌ Error calculating gas for job item (Admin):`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
      jobItemId: jobItem.id || jobItem.name,
    })
    console.error(`${logPrefix} ========================================`)
    return null
  }
}

/**
 * Calculate gas for all job items in a job and update the job document
 */
export async function calculateAndUpdateGasForJob(jobId: string): Promise<void> {
  console.log('🚀 [GAS PRICING] calculateAndUpdateGasForJob called for jobId:', jobId)
  
  try {
    // Get job document directly from Firestore
    const { doc, getDoc } = await import('firebase/firestore')
    const { db } = await import('./config')
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await getDoc(jobRef)
    
    if (!jobDoc.exists()) {
      console.error('❌ [GAS PRICING] Job not found:', jobId)
      throw new Error('Job not found')
    }
    
    const job = { id: jobDoc.id, ...jobDoc.data() } as any
    console.log('📄 [GAS PRICING] Job loaded:', {
      jobId: job.id,
      location: job.location,
      jobsCount: job.jobs?.length || 0,
      dateRange: job.dateRange,
    })
    
    const startDate = job.dateRange?.start 
      ? (typeof job.dateRange.start === 'string' ? new Date(job.dateRange.start) : (job.dateRange.start.toDate ? job.dateRange.start.toDate() : new Date(job.dateRange.start)))
      : new Date()
    
    console.log('📅 [GAS PRICING] Job start date:', startDate.toISOString())
    
    const gasCalculations: any[] = []
    let totalGasCost = 0
    let totalGasSurcharge = 0
    
    // Calculate gas for each job item
    const jobs = job.jobs || []
    console.log('🔄 [GAS PRICING] Processing', jobs.length, 'job items')
    
    for (let i = 0; i < jobs.length; i++) {
      const jobItem = jobs[i]
      // Use job location if job item doesn't have its own location
      const jobItemLocation = jobItem.location || job.location || ''
      const jobItemWithLocation = { ...jobItem, location: jobItemLocation }
      
      console.log(`📦 [GAS PRICING] Processing job item ${i + 1}/${jobs.length}:`, {
        name: jobItem.name || jobItem.id,
        location: jobItemLocation,
      })
      
      // Use Admin version of calculateGasForJobItem
      const gasCalc = await calculateGasForJobItemAdmin(jobItemWithLocation, startDate, jobId, db)
      
      if (gasCalc) {
        gasCalculations.push(gasCalc)
        totalGasCost += gasCalc.expenseCost
        totalGasSurcharge += gasCalc.customerSurcharge
        console.log(`✅ [GAS PRICING] Job item ${i + 1} gas calculated:`, {
          expenseCost: gasCalc.expenseCost,
          customerSurcharge: gasCalc.customerSurcharge,
          distanceMiles: gasCalc.distanceMiles,
        })
      } else {
        gasCalculations.push(null)
        console.warn(`⚠️ [GAS PRICING] Job item ${i + 1} gas calculation returned null`)
      }
    }
    
    console.log('📊 [GAS PRICING] Total gas calculations:', {
      totalGasCost,
      totalGasSurcharge,
      calculationsCount: gasCalculations.filter(g => g !== null).length,
    })
    
    // Update job items with gas calculations and adjust totalPrice
    const updatedJobs = jobs.map((jobItem: any, index: number) => {
      const gasCalc = gasCalculations[index]
      if (!gasCalc) {
        return jobItem
      }
      
      // Calculate base price (remove any previous gas surcharge if recalculating)
      const basePrice = jobItem.price || 0
      
      return {
        ...jobItem,
        gas: gasCalc,
        totalPrice: basePrice + gasCalc.customerSurcharge,
      }
    })
    
    // Calculate new total price for the job
    const newTotalPrice = updatedJobs.reduce((sum: number, jobItem: any) => {
      return sum + (jobItem.totalPrice || jobItem.price || 0)
    }, 0)
    
    // Update Cost object
    const existingCost = job.Cost || {}
    const newCost = {
      ...existingCost,
      gasCost: totalGasCost,
      totalCost: (existingCost.materialsCost || 0) + (existingCost.payrollCost || 0) + totalGasCost,
    }
    
    console.log('💾 [GAS PRICING] Preparing to save to Firestore:', {
      jobId,
      totalGasCost,
      newCost,
      newTotalPrice,
    })
    
    // Update job document - filter out undefined values
    const { updateJobData } = await import('./jobs')
    const updatePayload: any = {
      Cost: newCost,
    }
    
    // Only include fields that are defined
    if (updatedJobs !== undefined) {
      updatePayload.jobs = updatedJobs
    }
    if (newTotalPrice !== undefined) {
      updatePayload.totalPrice = newTotalPrice
    }
    if (totalGasCost !== undefined) {
      updatePayload.gasCost = totalGasCost
    }
    
    console.log('💾 [GAS PRICING] Update payload (filtered):', updatePayload)
    
    await updateJobData(jobId, updatePayload)
    
    console.log('✅ [GAS PRICING] Gas calculation and update completed successfully for job:', jobId)
  } catch (error: any) {
    console.error('❌ [GAS PRICING] Error calculating and updating gas for job:', error)
    throw new Error(`Failed to calculate gas: ${error.message}`)
  }
}

/**
 * Server-side version using Firebase Admin SDK
 * This bypasses Firestore security rules and works in API routes
 * SPEC: Updates jobs[i].totalPrice = jobs[i].price + gas.customerSurcharge (only if surge applies)
 *       Updates Cost.gasCost = sum of all jobs[i].gas.expenseCost
 *       Updates Cost.totalCost = materialsCost + payrollCost + gasCost
 */
export async function calculateAndUpdateGasForJobAdmin(jobId: string): Promise<void> {
  const logPrefix = '🚀 [GAS_CALC_JOB_ADMIN]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Starting gas calculation for job: ${jobId}`)
  console.log(`${logPrefix} ========================================`)
  
  try {
    // Step 1: Initialize Admin SDK
    console.log(`${logPrefix} Step 1: Initializing Firebase Admin SDK...`)
    const { getFirebaseAdminApp, isFirebaseAdminConfigured, admin } = await import('./firebaseAdmin')
    
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin SDK is not configured')
    }
    
    const adminApp = getFirebaseAdminApp()
    const db = adminApp.firestore()
    console.log(`${logPrefix} ✅ Admin SDK initialized`)
    
    // Step 2: Load job document
    console.log(`${logPrefix} Step 2: Loading job document...`)
    const jobRef = db.collection('jobs').doc(jobId)
    const jobDoc = await jobRef.get()
    
    if (!jobDoc.exists) {
      console.error(`${logPrefix} ❌ Job not found: ${jobId}`)
      throw new Error('Job not found')
    }
    
    const jobData = jobDoc.data()!
    const job = { id: jobDoc.id, ...jobData } as any
    
    console.log(`${logPrefix} ✅ Job loaded:`, {
      jobId: job.id,
      location: job.location || 'N/A',
      jobsCount: job.jobs?.length || 0,
      dateRange: job.dateRange ? {
        start: job.dateRange.start,
        end: job.dateRange.end,
      } : 'N/A',
      currentTotalPrice: job.totalPrice || 0,
      currentGasCost: job.Cost?.gasCost || 0,
    })
    
    // Step 3: Parse start date
    console.log(`${logPrefix} Step 3: Parsing job start date...`)
    const startDate = job.dateRange?.start 
      ? (typeof job.dateRange.start === 'string' 
          ? new Date(job.dateRange.start) 
          : (job.dateRange.start.toDate ? job.dateRange.start.toDate() : new Date(job.dateRange.start)))
      : new Date()
    
    console.log(`${logPrefix} ✅ Start date parsed:`, {
      startDate: startDate.toISOString(),
      source: job.dateRange?.start ? 'dateRange.start' : 'default (now)',
    })
    
    // Step 4: Calculate gas for each job item
    console.log(`${logPrefix} Step 4: Calculating gas for each job item...`)
    const gasCalculations: any[] = []
    let totalGasCost = 0
    let totalGasSurcharge = 0
    
    const jobs = job.jobs || []
    console.log(`${logPrefix} Processing ${jobs.length} job item(s)`)
    
    for (let i = 0; i < jobs.length; i++) {
      const jobItem = jobs[i]
      // Use job location if job item doesn't have its own location
      const jobItemLocation = jobItem.location || job.location || ''
      const jobItemWithLocation = { ...jobItem, location: jobItemLocation }
      
      console.log(`${logPrefix} ────────────────────────────────────────`)
      console.log(`${logPrefix} Job Item ${i + 1}/${jobs.length}:`, {
        name: jobItem.name || jobItem.id || 'Unnamed',
        location: jobItemLocation || 'MISSING',
        currentPrice: jobItem.price || 0,
        currentTotalPrice: jobItem.totalPrice || jobItem.price || 0,
      })
      
      // Use Admin version of calculateGasForJobItem
      const gasCalc = await calculateGasForJobItemAdmin(jobItemWithLocation, startDate, jobId, db)
      
      if (gasCalc) {
        gasCalculations.push(gasCalc)
        totalGasCost += gasCalc.expenseCost
        totalGasSurcharge += gasCalc.customerSurcharge
        console.log(`${logPrefix} ✅ Job item ${i + 1} gas calculated:`, {
          expenseCost: `$${gasCalc.expenseCost.toFixed(2)}`,
          customerSurcharge: `$${gasCalc.customerSurcharge.toFixed(2)}`,
          distanceMiles: `${gasCalc.distanceMiles.toFixed(2)} miles`,
          surgeApplied: gasCalc.surgeApplied ? 'YES' : 'NO',
          note: 'Gas cost will be included in Cost.gasCost',
        })
      } else {
        gasCalculations.push(null)
        console.warn(`${logPrefix} ⚠️ Job item ${i + 1} gas calculation returned null - possible reasons:`, {
          missingLocation: !jobItemLocation,
          gasPricingDisabled: 'Check config.enabled',
          invalidDistance: 'Distance may be 0 or invalid',
          note: 'Gas cost will be 0 for this job item',
        })
      }
      console.log(`${logPrefix} ────────────────────────────────────────`)
    }
    
    console.log(`${logPrefix} Step 4 complete - Summary:`, {
      totalGasCost: `$${totalGasCost.toFixed(2)}`,
      totalGasSurcharge: `$${totalGasSurcharge.toFixed(2)}`,
      calculationsCount: gasCalculations.filter(g => g !== null).length,
      failedCount: gasCalculations.filter(g => g === null).length,
      note: totalGasCost > 0 
        ? 'Gas cost will be saved to Cost.gasCost' 
        : 'Gas cost is 0 (will still be saved for expense tracking)',
    })
    
    // Step 5: Update job items with gas calculations and adjust totalPrice
    console.log(`${logPrefix} Step 5: Updating job items with gas data and recalculating totalPrice...`)
    const updatedJobs = jobs.map((jobItem: any, index: number) => {
      const gasCalc = gasCalculations[index]
      const basePrice = jobItem.price || 0
      
      if (!gasCalc) {
        // No gas calculation - keep existing totalPrice or use base price
        console.log(`${logPrefix} Job item ${index + 1}: No gas calc, keeping existing totalPrice`)
        return {
          ...jobItem,
          // Keep existing gas data if present, or set to null
          gas: jobItem.gas || null,
        }
      }
      
      // SPEC: totalPrice = basePrice + customerSurcharge (only if surge applies)
      // If no surge, customerSurcharge is 0, so totalPrice = basePrice (unchanged)
      const newTotalPrice = basePrice + gasCalc.customerSurcharge
      
      console.log(`${logPrefix} Job item ${index + 1} totalPrice calculation:`, {
        basePrice: `$${basePrice.toFixed(2)}`,
        customerSurcharge: `$${gasCalc.customerSurcharge.toFixed(2)}`,
        newTotalPrice: `$${newTotalPrice.toFixed(2)}`,
        previousTotalPrice: `$${(jobItem.totalPrice || basePrice).toFixed(2)}`,
        change: `$${(newTotalPrice - (jobItem.totalPrice || basePrice)).toFixed(2)}`,
      })
      
      return {
        ...jobItem,
        gas: gasCalc,
        totalPrice: newTotalPrice,
      }
    })
    
    // Step 6: Calculate new total price for the entire job
    console.log(`${logPrefix} Step 6: Calculating total job price...`)
    const newTotalPrice = updatedJobs.reduce((sum: number, jobItem: any) => {
      return sum + (jobItem.totalPrice || jobItem.price || 0)
    }, 0)
    
    console.log(`${logPrefix} ✅ Total job price:`, {
      newTotalPrice: `$${newTotalPrice.toFixed(2)}`,
      previousTotalPrice: `$${(job.totalPrice || 0).toFixed(2)}`,
      change: `$${(newTotalPrice - (job.totalPrice || 0)).toFixed(2)}`,
    })
    
    // Step 7: Update Cost object
    console.log(`${logPrefix} Step 7: Updating Cost summary...`)
    const existingCost = job.Cost || {}
    // Always save gas cost, even if 0 (it's an internal expense that should be tracked)
    const roundedGasCost = Math.round(totalGasCost * 100) / 100
    const newCost = {
      ...existingCost,
      gasCost: roundedGasCost, // Always include, even if 0
      totalCost: Math.round(((existingCost.materialsCost || 0) + (existingCost.payrollCost || 0) + roundedGasCost + (existingCost.mileagePayrollCost || 0)) * 100) / 100,
    }
    
    console.log(`${logPrefix} Gas cost to save:`, {
      totalGasCost,
      roundedGasCost,
      note: 'Always saved, even if 0 (internal expense tracking)',
    })
    
    console.log(`${logPrefix} ✅ Cost summary:`, {
      materialsCost: `$${(existingCost.materialsCost || 0).toFixed(2)}`,
      payrollCost: `$${(existingCost.payrollCost || 0).toFixed(2)}`,
      gasCost: `$${newCost.gasCost.toFixed(2)}`,
      mileagePayrollCost: `$${newCost.mileagePayrollCost.toFixed(2)}`,
      totalCost: `$${newCost.totalCost.toFixed(2)}`,
      previousTotalCost: `$${(existingCost.totalCost || 0).toFixed(2)}`,
    })
    
    // Step 9: Prepare update payload
    console.log(`${logPrefix} Step 9: Preparing Firestore update...`)
    const updatePayload: any = {
      Cost: newCost,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    
    // Only include fields that are defined
    if (updatedJobs !== undefined) {
      updatePayload.jobs = updatedJobs
    }
    if (newTotalPrice !== undefined) {
      updatePayload.totalPrice = Math.round(newTotalPrice * 100) / 100
    }
    // Always include gasCost in update, even if 0 (for expense tracking)
    updatePayload.gasCost = Math.round(totalGasCost * 100) / 100
    
    // Filter out undefined values recursively (Firestore doesn't allow undefined)
    const cleanedPayload = removeUndefinedValues(updatePayload)
    
    console.log(`${logPrefix} Update payload (cleaned):`, JSON.stringify(cleanedPayload, null, 2))
    
    // Step 9: Save to Firestore
    console.log(`${logPrefix} Step 9: Saving to Firestore...`)
    await jobRef.update(cleanedPayload)
    
    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} ✅ Gas calculation completed successfully!`)
    console.log(`${logPrefix} Job ID: ${jobId}`)
    console.log(`${logPrefix} Total gas cost: $${totalGasCost.toFixed(2)}`)
    console.log(`${logPrefix} Total customer surcharge: $${totalGasSurcharge.toFixed(2)}`)
    console.log(`${logPrefix} New total price: $${newTotalPrice.toFixed(2)}`)
    console.log(`${logPrefix} ========================================`)
  } catch (error: any) {
    console.error(`${logPrefix} ========================================`)
    console.error(`${logPrefix} ❌ Error calculating and updating gas for job:`, error)
    console.error(`${logPrefix} Error details:`, {
      message: error.message,
      stack: error.stack,
      jobId,
    })
    console.error(`${logPrefix} ========================================`)
    throw new Error(`Failed to calculate gas: ${error.message}`)
  }
}

/**
 * Find jobs that might be affected by a newly scheduled job
 * SPEC: When a job is scheduled, find jobs that:
 *       1. Start 1-2 days after the new job's end date (they might use this job as prior job)
 * Returns array of job IDs that need recalculation
 */
export async function findAffectedJobsForRecalculation(
  newJobId: string,
  newJobStartDate: Date,
  newJobEndDate: Date,
  adminDb?: any
): Promise<string[]> {
  const logPrefix = '🔍 [FIND_AFFECTED_JOBS]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Finding jobs affected by new job:`, {
    newJobId,
    newJobStartDate: newJobStartDate.toISOString(),
    newJobEndDate: newJobEndDate.toISOString(),
  })
  console.log(`${logPrefix} ========================================`)
  
  try {
    if (!adminDb) {
      const { getFirebaseAdminApp } = await import('./firebaseAdmin')
      const adminApp = getFirebaseAdminApp()
      adminDb = adminApp.firestore()
    }
    
    const affectedJobIds: string[] = []
    
    // Case 1: Jobs that start 1-2 days after this job's end date
    // These jobs might use this new job as their prior job
    const windowStart1 = new Date(newJobEndDate)
    windowStart1.setDate(windowStart1.getDate() + 1)
    windowStart1.setHours(0, 0, 0, 0)
    
    const windowEnd1 = new Date(newJobEndDate)
    windowEnd1.setDate(windowEnd1.getDate() + 2)
    windowEnd1.setHours(23, 59, 59, 999)
    
    console.log(`${logPrefix} Case 1: Finding jobs that start 1-2 days after new job's end date...`)
    console.log(`${logPrefix} Window: ${windowStart1.toISOString()} to ${windowEnd1.toISOString()}`)
    
    const jobsAfterQuery = await adminDb.collection('jobs')
      .where('status', 'in', ['pending', 'approved', 'outstanding', 'in_progress', 'scheduled'])
      .get()
    
    jobsAfterQuery.forEach((doc: any) => {
      if (doc.id === newJobId) return
      
      const data = doc.data()
      if (!data.dateRange?.start) return
      
      const jobStartDate = typeof data.dateRange.start === 'string'
        ? new Date(data.dateRange.start)
        : (data.dateRange.start.toDate ? data.dateRange.start.toDate() : new Date(data.dateRange.start))
      
      if (jobStartDate >= windowStart1 && jobStartDate <= windowEnd1) {
        console.log(`${logPrefix} ✅ Found affected job (case 1): ${doc.id} (starts ${jobStartDate.toISOString()})`)
        if (!affectedJobIds.includes(doc.id)) {
          affectedJobIds.push(doc.id)
        }
      }
    })
    
    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} ✅ Found ${affectedJobIds.length} affected job(s):`, affectedJobIds)
    console.log(`${logPrefix} ========================================`)
    
    return affectedJobIds
  } catch (error: any) {
    console.error(`${logPrefix} ❌ Error finding affected jobs:`, error)
    return []
  }
}

