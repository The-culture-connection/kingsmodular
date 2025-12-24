// Paystub and payroll generation data models and functions
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './config'
import { getTimeEntries, calculateWeeklyHours } from './timeTracking'
import { calculateMileagePayroll } from './mileagePayroll'

export interface Paystub {
  id?: string
  employeeId: string
  employeeName: string
  payPeriodStart: Date | Timestamp
  payPeriodEnd: Date | Timestamp
  regularHours: number
  overtimeHours: number
  regularRate: number
  overtimeRate: number // Usually 1.5x regular rate
  regularPay: number
  overtimePay: number
  mileagePay: number
  bonus: number
  grossPay: number
  deductions: {
    taxes?: number
    insurance?: number
    other?: number
  }
  netPay: number
  mileageBreakdown: {
    jobId?: string
    jobName?: string
    miles: number
    rate: number
    amount: number
  }[]
  status: 'draft' | 'finalized' | 'paid'
  generatedAt: Date | Timestamp
  generatedBy?: string
  paidAt?: Date | Timestamp
  notes?: string
}

export interface PayrollPeriod {
  startDate: Date
  endDate: Date
  employees: string[]
  totalGrossPay: number
  totalNetPay: number
  status: 'draft' | 'finalized' | 'paid'
  generatedAt: Date | Timestamp
}

/**
 * Generate paystub for an employee for a pay period
 */
export async function generatePaystub(
  employeeId: string,
  employeeName: string,
  hourlyRate: number,
  payPeriodStart: Date,
  payPeriodEnd: Date,
  bonus: number = 0,
  overtimeMultiplier: number = 1.5
): Promise<Paystub> {
  try {
    // Get time entries for the pay period
    const timeEntries = await getTimeEntries(employeeId, payPeriodStart, payPeriodEnd)
    const approvedEntries = timeEntries.filter(e => e.status === 'approved')
    
    // Calculate weekly hours to determine overtime
    const weeklyHours = calculateWeeklyHours(approvedEntries)
    
    let totalRegularHours = 0
    let totalOvertimeHours = 0
    
    weeklyHours.forEach(week => {
      totalRegularHours += week.regularHours
      totalOvertimeHours += week.overtimeHours
    })
    
    // Calculate pay
    const regularPay = totalRegularHours * hourlyRate
    const overtimeRate = hourlyRate * overtimeMultiplier
    const overtimePay = totalOvertimeHours * overtimeRate
    
    // Get mileage payroll for the pay period
    // This requires checking jobs the employee was assigned to during this period
    const mileagePay = await calculateMileagePayrollForPeriod(employeeId, payPeriodStart, payPeriodEnd)
    
    const grossPay = regularPay + overtimePay + mileagePay.totalAmount + bonus
    
    // Calculate deductions (placeholder - should be calculated from tax info)
    const deductions = {
      taxes: grossPay * 0.15, // 15% placeholder
      insurance: 0,
      other: 0,
    }
    
    const netPay = grossPay - (deductions.taxes + deductions.insurance + deductions.other)
    
    const paystub: Omit<Paystub, 'id'> = {
      employeeId,
      employeeName,
      payPeriodStart: Timestamp.fromDate(payPeriodStart),
      payPeriodEnd: Timestamp.fromDate(payPeriodEnd),
      regularHours: totalRegularHours,
      overtimeHours: totalOvertimeHours,
      regularRate: hourlyRate,
      overtimeRate,
      regularPay,
      overtimePay,
      mileagePay: mileagePay.totalAmount,
      bonus,
      grossPay,
      deductions,
      netPay,
      mileageBreakdown: mileagePay.breakdown,
      status: 'draft',
      generatedAt: serverTimestamp() as any,
    }
    
    // Save to Firestore
    const paystubRef = doc(collection(db, 'paystubs'))
    await setDoc(paystubRef, paystub)
    
    return {
      id: paystubRef.id,
      ...paystub,
      payPeriodStart: payPeriodStart,
      payPeriodEnd: payPeriodEnd,
      generatedAt: new Date(),
    } as Paystub
  } catch (error: any) {
    console.error('Error generating paystub:', error)
    throw new Error(`Failed to generate paystub: ${error.message}`)
  }
}

/**
 * Calculate mileage payroll for an employee during a pay period
 */
async function calculateMileagePayrollForPeriod(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<{ totalAmount: number; breakdown: Paystub['mileageBreakdown'] }> {
  try {
    // Get all jobs where employee is assigned and job dates overlap with pay period
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('assignedEmployees', 'array-contains', employeeId)
    )
    
    const jobsSnapshot = await getDocs(jobsQuery)
    const breakdown: Paystub['mileageBreakdown'] = []
    let totalAmount = 0
    
    for (const jobDoc of jobsSnapshot.docs) {
      const jobData = jobDoc.data()
      const jobStartDate = jobData.dateRange?.start 
        ? (typeof jobData.dateRange.start === 'string' ? new Date(jobData.dateRange.start) : jobData.dateRange.start.toDate())
        : null
      const jobEndDate = jobData.dateRange?.end
        ? (typeof jobData.dateRange.end === 'string' ? new Date(jobData.dateRange.end) : jobData.dateRange.end.toDate())
        : null
      
      // Check if job overlaps with pay period
      if (!jobStartDate || !jobEndDate) continue
      if (jobEndDate < startDate || jobStartDate > endDate) continue
      
      // Get mileage payroll from job items
      const jobs = jobData.jobs || []
      for (const jobItem of jobs) {
        if (jobItem.mileagePayroll && Array.isArray(jobItem.mileagePayroll)) {
          const employeeMileage = jobItem.mileagePayroll.find((entry: any) => entry.employeeId === employeeId)
          if (employeeMileage) {
            breakdown.push({
              jobId: jobDoc.id,
              jobName: jobItem.name || jobData.location || 'Unnamed Job',
              miles: employeeMileage.miles,
              rate: employeeMileage.ratePerMile,
              amount: employeeMileage.totalCost,
            })
            totalAmount += employeeMileage.totalCost
          }
        }
      }
    }
    
    return { totalAmount, breakdown }
  } catch (error: any) {
    console.error('Error calculating mileage payroll for period:', error)
    return { totalAmount: 0, breakdown: [] }
  }
}

/**
 * Get paystubs for an employee
 */
export async function getPaystubs(employeeId?: string): Promise<Paystub[]> {
  try {
    let q
    if (employeeId) {
      // Query without orderBy to avoid index requirement, sort client-side
      q = query(
        collection(db, 'paystubs'),
        where('employeeId', '==', employeeId)
      )
    } else {
      // For all paystubs, just get the collection
      q = query(collection(db, 'paystubs'))
    }
    
    const snapshot = await getDocs(q)
    const paystubs = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        payPeriodStart: data.payPeriodStart?.toDate ? data.payPeriodStart.toDate() : new Date(data.payPeriodStart),
        payPeriodEnd: data.payPeriodEnd?.toDate ? data.payPeriodEnd.toDate() : new Date(data.payPeriodEnd),
        generatedAt: data.generatedAt?.toDate ? data.generatedAt.toDate() : new Date(data.generatedAt),
        paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : undefined,
      } as Paystub
    })
    
    // Sort client-side by payPeriodStart descending
    return paystubs.sort((a, b) => {
      const aDate = a.payPeriodStart instanceof Date ? a.payPeriodStart : new Date(a.payPeriodStart)
      const bDate = b.payPeriodStart instanceof Date ? b.payPeriodStart : new Date(b.payPeriodStart)
      return bDate.getTime() - aDate.getTime()
    })
  } catch (error: any) {
    console.error('Error getting paystubs:', error)
    return []
  }
}

/**
 * Finalize a paystub (mark as finalized)
 */
export async function finalizePaystub(paystubId: string): Promise<void> {
  try {
    const paystubRef = doc(db, 'paystubs', paystubId)
    await setDoc(paystubRef, {
      status: 'finalized',
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error: any) {
    console.error('Error finalizing paystub:', error)
    throw new Error(`Failed to finalize paystub: ${error.message}`)
  }
}

