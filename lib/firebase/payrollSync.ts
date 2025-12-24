// Dynamic payroll expense synchronization
// Syncs job payroll costs with actual hours worked from time entries
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'
import { getTimeEntries, calculateWeeklyHours } from './timeTracking'
import { getAllEmployees, Employee } from './employees'

export interface ActualPayrollData {
  employeeId: string
  employeeName: string
  regularHours: number
  overtimeHours: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  totalPay: number
}

export interface JobPayrollSync {
  jobId: string
  estimatedPayrollCost: number
  actualPayrollCost: number
  difference: number
  employees: ActualPayrollData[]
  hasTimeEntries: boolean
}

/**
 * Calculate actual payroll for a job based on time entries
 */
export async function calculateActualPayrollForJob(jobId: string): Promise<JobPayrollSync> {
  try {
    // Get job data
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await jobRef.get()
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found')
    }
    
    const jobData = jobDoc.data()
    const assignedEmployees = jobData.assignedEmployees || []
    const estimatedPayrollCost = jobData.Cost?.payrollCost || jobData.payrollCost || 0
    
    if (assignedEmployees.length === 0) {
      return {
        jobId,
        estimatedPayrollCost,
        actualPayrollCost: 0,
        difference: -estimatedPayrollCost,
        employees: [],
        hasTimeEntries: false,
      }
    }
    
    // Get job date range
    const jobStartDate = jobData.dateRange?.start
      ? (typeof jobData.dateRange.start === 'string' 
          ? new Date(jobData.dateRange.start) 
          : jobData.dateRange.start.toDate())
      : null
    const jobEndDate = jobData.dateRange?.end
      ? (typeof jobData.dateRange.end === 'string'
          ? new Date(jobData.dateRange.end)
          : jobData.dateRange.end.toDate())
      : null
    
    if (!jobStartDate || !jobEndDate) {
      return {
        jobId,
        estimatedPayrollCost,
        actualPayrollCost: 0,
        difference: -estimatedPayrollCost,
        employees: [],
        hasTimeEntries: false,
      }
    }
    
    // Get all employees
    const employees = await getAllEmployees()
    const employeeMap = new Map(employees.map(emp => [emp.uid, emp]))
    
    // Calculate actual payroll for each employee
    const actualPayrollData: ActualPayrollData[] = []
    let totalActualPayroll = 0
    
    for (const employeeId of assignedEmployees) {
      const employee = employeeMap.get(employeeId)
      if (!employee) continue
      
      // Get time entries for this employee during job period
      const timeEntries = await getTimeEntries(employeeId, jobStartDate, jobEndDate)
      
      // Filter entries that are for this job (if jobId is stored in time entry)
      const jobTimeEntries = timeEntries.filter(entry => 
        entry.jobId === jobId || !entry.jobId // Include entries without jobId if they fall in the period
      )
      
      if (jobTimeEntries.length === 0) continue
      
      // Only count approved entries
      const approvedEntries = jobTimeEntries.filter(e => e.status === 'approved')
      
      if (approvedEntries.length === 0) continue
      
      // Calculate weekly hours for overtime
      const weeklyHours = calculateWeeklyHours(approvedEntries)
      
      let regularHours = 0
      let overtimeHours = 0
      
      weeklyHours.forEach(week => {
        regularHours += week.regularHours
        overtimeHours += week.overtimeHours
      })
      
      const hourlyRate = employee.hourlyRate || 0
      const overtimeRate = hourlyRate * 1.5
      const regularPay = regularHours * hourlyRate
      const overtimePay = overtimeHours * overtimeRate
      const totalPay = regularPay + overtimePay
      
      actualPayrollData.push({
        employeeId,
        employeeName: employee.name,
        regularHours,
        overtimeHours,
        hourlyRate,
        regularPay,
        overtimePay,
        totalPay,
      })
      
      totalActualPayroll += totalPay
    }
    
    return {
      jobId,
      estimatedPayrollCost,
      actualPayrollCost: Math.round(totalActualPayroll * 100) / 100,
      difference: Math.round((totalActualPayroll - estimatedPayrollCost) * 100) / 100,
      employees: actualPayrollData,
      hasTimeEntries: actualPayrollData.length > 0,
    }
  } catch (error: any) {
    console.error('Error calculating actual payroll:', error)
    throw new Error(`Failed to calculate actual payroll: ${error.message}`)
  }
}

/**
 * Sync payroll cost for a job (update Cost.payrollCost with actual hours)
 */
export async function syncPayrollCostForJob(jobId: string): Promise<void> {
  try {
    const payrollData = await calculateActualPayrollForJob(jobId)
    
    const jobRef = doc(db, 'jobs', jobId)
    const jobDoc = await jobRef.get()
    
    if (!jobDoc.exists()) {
      throw new Error('Job not found')
    }
    
    const jobData = jobDoc.data()
    const existingCost = jobData.Cost || {}
    
    // Update payroll cost and recalculate total cost
    const newCost = {
      ...existingCost,
      payrollCost: payrollData.actualPayrollCost,
      totalCost: Math.round((
        (existingCost.materialsCost || 0) +
        payrollData.actualPayrollCost +
        (existingCost.gasCost || 0) +
        (existingCost.mileagePayrollCost || 0)
      ) * 100) / 100,
    }
    
    // Update payroll breakdown with actual data
    const payrollBreakdown = payrollData.employees.map(emp => ({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      hourlyRate: emp.hourlyRate,
      hours: emp.regularHours + emp.overtimeHours,
      regularHours: emp.regularHours,
      overtimeHours: emp.overtimeHours,
      totalCost: emp.totalPay,
    }))
    
    await updateDoc(jobRef, {
      Cost: newCost,
      payrollCost: payrollData.actualPayrollCost,
      payroll: payrollBreakdown,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error('Error syncing payroll cost:', error)
    throw new Error(`Failed to sync payroll cost: ${error.message}`)
  }
}

