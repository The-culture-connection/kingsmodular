// Analytics data fetching and computation functions
import { collection, query, getDocs, where, Timestamp, QueryConstraint } from 'firebase/firestore'
import { db } from './config'

export interface JobAnalyticsRow {
  // Parent document info
  parentId: string
  parentCustomerId: string
  parentCustomerName?: string
  parentDateRange: {
    start: string
    end: string
  }
  
  // Job line item info
  jobId: string
  jobName: string
  jobIndex: number
  
  // Dates
  startDate: string
  endDate: string
  startDateTs?: Date
  endDateTs?: Date
  monthKey?: string // "2026-04"
  weekKey?: string // "2026-W16"
  
  // Status
  status: string // Current status from parent or job
  jobLifecycle?: string
  invoiceStatus?: string
  
  // Financials
  revenue: number // jobs[i].totalPrice ?? jobs[i].price
  costAllocatedTotal: number // Allocated from parent Cost.totalCost
  costGasAllocated: number // Allocated from parent Cost.gasCost
  costMaterialsAllocated: number // Allocated from parent Cost.materialsCost
  costPayrollAllocated: number // Allocated from parent Cost.payrollCost
  costMileagePayrollAllocated: number // Allocated from parent Cost.mileagePayrollCost
  profit: number // revenue - costAllocatedTotal
  marginPct: number // (profit / revenue) * 100
  
  // Parent totals (for reference)
  parentRevenueTotal: number
  parentCostTotal: number
  parentProfitTotal: number
  
  // Additional fields
  location?: string
  paid?: boolean
  updatedAt?: Date
}

/**
 * Parse date string to Date object and generate month/week keys
 */
function parseDateAndGenerateKeys(dateStr: string | undefined): {
  date: Date | null
  monthKey: string | null
  weekKey: string | null
} {
  if (!dateStr) {
    return { date: null, monthKey: null, weekKey: null }
  }
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { date: null, monthKey: null, weekKey: null }
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const monthKey = `${year}-${month}`
  
  // Calculate week number (ISO week)
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`
  
  return { date, monthKey, weekKey }
}

/**
 * Allocate parent costs proportionally by revenue share
 */
function allocateCosts(
  jobRevenue: number,
  totalRevenue: number,
  parentCosts: {
    totalCost: number
    gasCost: number
    materialsCost: number
    payrollCost: number
    mileagePayrollCost: number
  }
): {
  costAllocatedTotal: number
  costGasAllocated: number
  costMaterialsAllocated: number
  costPayrollAllocated: number
  costMileagePayrollAllocated: number
} {
  if (totalRevenue === 0) {
    // If no revenue, allocate equally (or return 0)
    return {
      costAllocatedTotal: 0,
      costGasAllocated: 0,
      costMaterialsAllocated: 0,
      costPayrollAllocated: 0,
      costMileagePayrollAllocated: 0,
    }
  }

  const revenueShare = jobRevenue / totalRevenue

  return {
    costAllocatedTotal: parentCosts.totalCost * revenueShare,
    costGasAllocated: parentCosts.gasCost * revenueShare,
    costMaterialsAllocated: parentCosts.materialsCost * revenueShare,
    costPayrollAllocated: parentCosts.payrollCost * revenueShare,
    costMileagePayrollAllocated: parentCosts.mileagePayrollCost * revenueShare,
  }
}

/**
 * Flatten a job document into analytics rows (one per job in jobs[] array)
 */
function flattenJobDocument(docId: string, docData: any): JobAnalyticsRow[] {
  const logPrefix = '📋 [FLATTEN_DOC]'
  const rows: JobAnalyticsRow[] = []
  
  console.log(`${logPrefix} Flattening document: ${docId}`)
  
  // Extract parent-level data
  const parentCustomerId = docData.customerId || ''
  const parentCustomerName = docData.customerCompanyName || docData.customerName || ''
  const parentDateRange = docData.dateRange || { start: '', end: '' }
  const parentStatus = docData.status || 'pending'
  
  console.log(`${logPrefix}   Parent data:`, {
    customerId: parentCustomerId,
    customerName: parentCustomerName,
    status: parentStatus,
    dateRange: parentDateRange,
  })
  
  // Extract Cost object
  const costData = docData.Cost || {}
  const parentCostTotal = costData.totalCost || 0
  const parentGasCost = costData.gasCost || 0
  const parentMaterialsCost = costData.materialsCost || 0
  const parentPayrollCost = costData.payrollCost || 0
  const parentMileagePayrollCost = costData.mileagePayrollCost || 0
  
  console.log(`${logPrefix}   Cost data:`, {
    totalCost: parentCostTotal,
    gasCost: parentGasCost,
    materialsCost: parentMaterialsCost,
    payrollCost: parentPayrollCost,
    mileagePayrollCost: parentMileagePayrollCost,
  })
  
  // Extract jobs array
  const jobs = docData.jobs || []
  console.log(`${logPrefix}   Jobs array length: ${jobs.length}`)
  
  if (jobs.length === 0) {
    console.warn(`${logPrefix}   ⚠️ No jobs array found, will create single row from parent`)
  }
  
  // Calculate total revenue from all jobs
  const parentRevenueTotal = jobs.reduce((sum: number, job: any, idx: number) => {
    const revenue = job.totalPrice ?? job.price ?? 0
    console.log(`${logPrefix}     Job ${idx + 1}: revenue = ${revenue} (totalPrice: ${job.totalPrice}, price: ${job.price})`)
    return sum + revenue
  }, 0)
  
  console.log(`${logPrefix}   Parent revenue total: ${parentRevenueTotal}`)
  
  const parentProfitTotal = parentRevenueTotal - parentCostTotal
  console.log(`${logPrefix}   Parent profit total: ${parentProfitTotal}`)
  
  // Process each job in the array
  jobs.forEach((job: any, index: number) => {
    console.log(`${logPrefix}   Processing job ${index + 1}/${jobs.length}:`, {
      id: job.id,
      name: job.name,
      totalPrice: job.totalPrice,
      price: job.price,
    })
    
    // Extract revenue (canonical: totalPrice ?? price)
    const revenue = job.totalPrice ?? job.price ?? 0
    console.log(`${logPrefix}     Revenue: ${revenue}`)
    
            // Allocate costs proportionally
            const allocated = allocateCosts(
              revenue,
              parentRevenueTotal,
              {
                totalCost: parentCostTotal,
                gasCost: parentGasCost,
                materialsCost: parentMaterialsCost,
                payrollCost: parentPayrollCost,
                mileagePayrollCost: parentMileagePayrollCost,
              }
            )
    
            console.log(`${logPrefix}     Allocated costs:`, {
              total: allocated.costAllocatedTotal,
              gas: allocated.costGasAllocated,
              materials: allocated.costMaterialsAllocated,
              payroll: allocated.costPayrollAllocated,
              mileagePayroll: allocated.costMileagePayrollAllocated,
            })
    
    // Calculate profit and margin
    const profit = revenue - allocated.costAllocatedTotal
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0
    
    console.log(`${logPrefix}     Profit: ${profit}, Margin: ${marginPct.toFixed(2)}%`)
    
    // Parse dates (handle Firestore timestamps)
    console.log(`${logPrefix}     Parsing dates for job ${index + 1}:`, {
      parentDateRange,
      parentStartType: typeof parentDateRange.start,
      parentStartValue: parentDateRange.start,
      parentStartHasToDate: !!(parentDateRange.start?.toDate),
      jobStartDate: job.startDate,
      jobEndDate: job.endDate,
    })
    
    const parentStartDateStr = parentDateRange.start?.toDate 
      ? parentDateRange.start.toDate().toISOString() 
      : (typeof parentDateRange.start === 'string' ? parentDateRange.start : '')
    const parentEndDateStr = parentDateRange.end?.toDate 
      ? parentDateRange.end.toDate().toISOString() 
      : (typeof parentDateRange.end === 'string' ? parentDateRange.end : '')
    
    console.log(`${logPrefix}     Extracted date strings:`, {
      parentStart: parentStartDateStr,
      parentEnd: parentEndDateStr,
    })
    
    const startDateInfo = parseDateAndGenerateKeys(parentStartDateStr)
    const endDateInfo = parseDateAndGenerateKeys(parentEndDateStr)
    
    console.log(`${logPrefix}     Parent date parsing results:`, {
      startParsed: startDateInfo.date?.toISOString() || 'FAILED',
      startMonthKey: startDateInfo.monthKey,
      endParsed: endDateInfo.date?.toISOString() || 'FAILED',
    })
    
    // Use job-specific dates if available, otherwise use parent dates
    const jobStartDate = job.startDate || parentStartDateStr
    const jobEndDate = job.endDate || parentEndDateStr
    const jobStartInfo = parseDateAndGenerateKeys(jobStartDate)
    const jobEndInfo = parseDateAndGenerateKeys(jobEndDate)
    
    console.log(`${logPrefix}     Job date parsing results:`, {
      jobStartDate,
      jobStartParsed: jobStartInfo.date?.toISOString() || 'FAILED',
      jobStartMonthKey: jobStartInfo.monthKey,
    })
    
    // Determine status (job-level status takes precedence)
    const jobStatus = job.status || parentStatus
    
    // Create analytics row
    const row: JobAnalyticsRow = {
      parentId: docId,
      parentCustomerId,
      parentCustomerName,
      parentDateRange,
      
      jobId: job.id || `job-${index}`,
      jobName: job.name || 'Unnamed Job',
      jobIndex: index,
      
      startDate: jobStartDate || parentStartDateStr,
      endDate: jobEndDate || parentEndDateStr,
      startDateTs: jobStartInfo.date || undefined,
      endDateTs: jobEndInfo.date || undefined,
      monthKey: jobStartInfo.monthKey || null,
      weekKey: jobStartInfo.weekKey || null,
      
      status: jobStatus,
      jobLifecycle: jobStatus, // For now, use status as lifecycle
      invoiceStatus: docData.invoiceStatus || (docData.paid ? 'paid' : 'not_invoiced'),
      
      revenue,
      costAllocatedTotal: allocated.costAllocatedTotal,
      costGasAllocated: allocated.costGasAllocated,
      costMaterialsAllocated: allocated.costMaterialsAllocated,
      costPayrollAllocated: allocated.costPayrollAllocated,
      costMileagePayrollAllocated: allocated.costMileagePayrollAllocated,
      profit,
      marginPct,
      
      parentRevenueTotal,
      parentCostTotal,
      parentProfitTotal,
      
      location: docData.location || job.location || '',
      paid: docData.paid || false,
      updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : undefined,
    }
    
    rows.push(row)
  })
  
  // If no jobs array, create a single row from parent document
  if (rows.length === 0) {
    const parentStartDateStr = parentDateRange.start?.toDate 
      ? parentDateRange.start.toDate().toISOString() 
      : (typeof parentDateRange.start === 'string' ? parentDateRange.start : '')
    const parentEndDateStr = parentDateRange.end?.toDate 
      ? parentDateRange.end.toDate().toISOString() 
      : (typeof parentDateRange.end === 'string' ? parentDateRange.end : '')
    
    const startDateInfo = parseDateAndGenerateKeys(parentStartDateStr)
    const endDateInfo = parseDateAndGenerateKeys(parentEndDateStr)
    
    const revenue = docData.totalPrice ?? docData.revenue ?? 0
    const allocated = allocateCosts(
      revenue,
      revenue, // Only one "job", so 100% allocation
      {
        totalCost: parentCostTotal,
        gasCost: parentGasCost,
        materialsCost: parentMaterialsCost,
        payrollCost: parentPayrollCost,
      }
    )
    
    const profit = revenue - allocated.costAllocatedTotal
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0
    
    rows.push({
      parentId: docId,
      parentCustomerId,
      parentCustomerName,
      parentDateRange,
      
      jobId: docId,
      jobName: docData.name || docData.location || 'Unnamed Job',
      jobIndex: 0,
      
      startDate: parentStartDateStr,
      endDate: parentEndDateStr,
      startDateTs: startDateInfo.date || undefined,
      endDateTs: endDateInfo.date || undefined,
      monthKey: startDateInfo.monthKey || null,
      weekKey: startDateInfo.weekKey || null,
      
      status: parentStatus,
      jobLifecycle: parentStatus,
      invoiceStatus: docData.invoiceStatus || (docData.paid ? 'paid' : 'not_invoiced'),
      
      revenue,
      costAllocatedTotal: allocated.costAllocatedTotal,
      costGasAllocated: allocated.costGasAllocated,
      costMaterialsAllocated: allocated.costMaterialsAllocated,
      costPayrollAllocated: allocated.costPayrollAllocated,
      costMileagePayrollAllocated: allocated.costMileagePayrollAllocated,
      profit,
      marginPct,
      
      parentRevenueTotal: revenue,
      parentCostTotal,
      parentProfitTotal: profit,
      
      location: docData.location || '',
      paid: docData.paid || false,
      updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate() : undefined,
    })
  }
  
  return rows
}

/**
 * Fetch analytics data with optional filters
 */
export interface AnalyticsFilters {
  dateRangeStart?: Date
  dateRangeEnd?: Date
  status?: string[] // Job lifecycle statuses
  invoiceStatus?: string[]
  customerId?: string
  jobNameSearch?: string
}

export async function getRevenueAnalytics(filters: AnalyticsFilters = {}): Promise<JobAnalyticsRow[]> {
  const logPrefix = '📊 [ANALYTICS]'
  try {
    console.log(`${logPrefix} ========================================`)
    console.log(`${logPrefix} Fetching revenue analytics`)
    console.log(`${logPrefix} Filters:`, JSON.stringify(filters, null, 2))
    console.log(`${logPrefix} ========================================`)
    
    // Build Firestore query
    console.log(`${logPrefix} Step 1: Building Firestore query...`)
    const jobsRef = collection(db, 'jobs')
    const constraints: QueryConstraint[] = []
    
    // Note: Date range filtering is done client-side after flattening
    // because Firestore stores dates as strings in dateRange.start/end
    // and we need to parse them properly
    
    // Status filter (if provided)
    if (filters.status && filters.status.length > 0 && !filters.status.includes('all')) {
      console.log(`${logPrefix}   Adding status filter:`, filters.status)
      constraints.push(where('status', 'in', filters.status))
    }
    
    // Customer filter (if provided)
    if (filters.customerId) {
      console.log(`${logPrefix}   Adding customer filter:`, filters.customerId)
      constraints.push(where('customerId', '==', filters.customerId))
    }
    
    console.log(`${logPrefix} Step 2: Executing Firestore query...`)
    console.log(`${logPrefix}   Constraints count:`, constraints.length)
    
    // Execute query
    const q = constraints.length > 0 ? query(jobsRef, ...constraints) : jobsRef
    const snapshot = await getDocs(q)
    
    console.log(`${logPrefix} ✅ Query complete`)
    console.log(`${logPrefix}   Found ${snapshot.size} job document(s)`)
    
    if (snapshot.empty) {
      console.warn(`${logPrefix} ⚠️ No documents found in 'jobs' collection`)
      console.log(`${logPrefix} ========================================`)
      return []
    }
    
    // Flatten all documents into analytics rows
    console.log(`${logPrefix} Step 3: Flattening documents into analytics rows...`)
    const allRows: JobAnalyticsRow[] = []
    
    snapshot.forEach((doc, index) => {
      console.log(`${logPrefix}   Processing document ${index + 1}/${snapshot.size}:`, doc.id)
      const docData = doc.data()
      console.log(`${logPrefix}     Document data keys:`, Object.keys(docData))
      console.log(`${logPrefix}     Has jobs array:`, !!docData.jobs)
      console.log(`${logPrefix}     Jobs array length:`, docData.jobs?.length || 0)
      console.log(`${logPrefix}     Has Cost object:`, !!docData.Cost)
      console.log(`${logPrefix}     Status:`, docData.status)
      console.log(`${logPrefix}     DateRange:`, docData.dateRange)
      
      try {
        const rows = flattenJobDocument(doc.id, docData)
        console.log(`${logPrefix}     ✅ Flattened to ${rows.length} row(s)`)
        allRows.push(...rows)
      } catch (error: any) {
        console.error(`${logPrefix}     ❌ Error flattening document ${doc.id}:`, error)
        console.error(`${logPrefix}     Error details:`, {
          message: error.message,
          stack: error.stack,
        })
      }
    })
    
    console.log(`${logPrefix} ✅ Flattening complete`)
    console.log(`${logPrefix}   Total analytics rows: ${allRows.length}`)
    
    // Apply client-side filters that can't be done in Firestore
    console.log(`${logPrefix} Step 4: Applying client-side filters...`)
    let filteredRows = allRows
    const initialCount = filteredRows.length
    
    // Invoice status filter
    if (filters.invoiceStatus && filters.invoiceStatus.length > 0 && !filters.invoiceStatus.includes('all')) {
      console.log(`${logPrefix}   Filtering by invoice status:`, filters.invoiceStatus)
      const beforeCount = filteredRows.length
      filteredRows = filteredRows.filter(row => 
        row.invoiceStatus && filters.invoiceStatus!.includes(row.invoiceStatus)
      )
      console.log(`${logPrefix}     ${beforeCount} -> ${filteredRows.length} rows`)
    }
    
    // Job name search
    if (filters.jobNameSearch) {
      console.log(`${logPrefix}   Filtering by job name search:`, filters.jobNameSearch)
      const beforeCount = filteredRows.length
      const searchLower = filters.jobNameSearch.toLowerCase()
      filteredRows = filteredRows.filter(row =>
        row.jobName.toLowerCase().includes(searchLower) ||
        row.location?.toLowerCase().includes(searchLower)
      )
      console.log(`${logPrefix}     ${beforeCount} -> ${filteredRows.length} rows`)
    }
    
     // Additional date filtering (more precise than Firestore string comparison)
     // Only apply date filtering if at least one date is provided
     if (filters.dateRangeStart !== undefined || filters.dateRangeEnd !== undefined) {
       console.log(`${logPrefix}   Filtering by date range:`, {
         start: filters.dateRangeStart?.toISOString() || 'undefined',
         end: filters.dateRangeEnd?.toISOString() || 'undefined',
       })
       const beforeCount = filteredRows.length
       
       // Log sample rows before filtering to debug date issues
       console.log(`${logPrefix}   Sample rows before date filtering (first 3):`)
       filteredRows.slice(0, 3).forEach((row, idx) => {
         console.log(`${logPrefix}     Row ${idx + 1} (${row.jobName}):`, {
           startDate: row.startDate,
           startDateTs: row.startDateTs?.toISOString() || 'MISSING',
           monthKey: row.monthKey,
         })
       })
       
       filteredRows = filteredRows.filter(row => {
         // If no startDateTs, try to parse from startDate string
         if (!row.startDateTs && row.startDate) {
           console.log(`${logPrefix}     Row "${row.jobName}" has startDate but no startDateTs, attempting to parse:`, row.startDate)
           const parsed = parseDateAndGenerateKeys(row.startDate)
           if (parsed.date) {
             row.startDateTs = parsed.date
             row.monthKey = parsed.monthKey || undefined
             console.log(`${logPrefix}       ✅ Parsed successfully: ${parsed.date.toISOString()}`)
           } else {
             console.log(`${logPrefix}       ❌ Failed to parse date: "${row.startDate}"`)
             // If date parsing fails, include the row anyway (don't exclude due to bad date format)
             return true
           }
         }
         
         if (!row.startDateTs) {
           console.log(`${logPrefix}     Row "${row.jobName}" has no startDateTs and no startDate, including anyway`)
           // Include rows without dates rather than excluding them
           return true
         }
         
         const isBeforeStart = filters.dateRangeStart !== undefined && row.startDateTs < filters.dateRangeStart
         const isAfterEnd = filters.dateRangeEnd !== undefined && row.startDateTs > filters.dateRangeEnd
         
         if (isBeforeStart) {
           console.log(`${logPrefix}     Row "${row.jobName}" date ${row.startDateTs.toISOString()} is before start ${filters.dateRangeStart?.toISOString()}, excluding`)
           return false
         }
         if (isAfterEnd) {
           console.log(`${logPrefix}     Row "${row.jobName}" date ${row.startDateTs.toISOString()} is after end ${filters.dateRangeEnd?.toISOString()}, excluding`)
           return false
         }
         
         console.log(`${logPrefix}     Row "${row.jobName}" date ${row.startDateTs.toISOString()} is within range, including`)
         return true
       })
       console.log(`${logPrefix}     ${beforeCount} -> ${filteredRows.length} rows`)
     }
    
    console.log(`${logPrefix} ✅ Client-side filtering complete`)
    console.log(`${logPrefix}   Final row count: ${filteredRows.length} (from ${initialCount} initial rows)`)
    
    // Log sample rows for debugging
    if (filteredRows.length > 0) {
      console.log(`${logPrefix} Sample rows (first 3):`)
      filteredRows.slice(0, 3).forEach((row, idx) => {
        console.log(`${logPrefix}   Row ${idx + 1}:`, {
          jobName: row.jobName,
          revenue: row.revenue,
          costAllocatedTotal: row.costAllocatedTotal,
          profit: row.profit,
          marginPct: row.marginPct,
          monthKey: row.monthKey,
        })
      })
    } else {
      console.warn(`${logPrefix} ⚠️ No rows after filtering!`)
    }
    
    console.log(`${logPrefix} ========================================`)
    return filteredRows
  } catch (error: any) {
    console.error(`${logPrefix} ========================================`)
    console.error(`${logPrefix} ❌ ERROR fetching revenue analytics`)
    console.error(`${logPrefix} Error message:`, error.message)
    console.error(`${logPrefix} Error stack:`, error.stack)
    console.error(`${logPrefix} Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      filters,
    })
    console.error(`${logPrefix} ========================================`)
    throw new Error(`Failed to fetch revenue analytics: ${error.message}`)
  }
}

/**
 * Get summary totals from analytics rows
 */
export interface AnalyticsSummary {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  outstandingInvoices: number
  totalOutstanding: number
  rowCount: number
}

export function computeAnalyticsSummary(rows: JobAnalyticsRow[]): AnalyticsSummary {
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0)
  const totalCost = rows.reduce((sum, row) => sum + row.costAllocatedTotal, 0)
  const totalProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  
  // Outstanding invoices are jobs with status 'completed' (not yet paid)
  const outstandingRows = rows.filter(row => 
    row.status === 'completed' && row.revenue > 0
  )
  const outstandingInvoices = outstandingRows.length
  const totalOutstanding = outstandingRows.reduce((sum, row) => sum + row.revenue, 0)
  
  return {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin,
    outstandingInvoices,
    totalOutstanding,
    rowCount: rows.length,
  }
}

