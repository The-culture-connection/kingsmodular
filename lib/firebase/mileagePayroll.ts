// Client-side mileage payroll calculation (no firebase-admin dependency)
import { doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import { getMileagePayrollConfig } from './pricingConfig'

export interface MileagePayrollEntry {
  employeeId: string
  employeeName: string
  miles: number
  ratePerMile: number
  totalCost: number
}

/**
 * Calculate mileage payroll for assigned employees
 * This is the client-side version (no firebase-admin dependency)
 */
export async function calculateMileagePayroll(
  assignedEmployees: string[],
  distanceMiles: number
): Promise<MileagePayrollEntry[]> {
  const logPrefix = '🚗 [MILEAGE_PAYROLL]'
  console.log(`${logPrefix} ========================================`)
  console.log(`${logPrefix} Calculating mileage payroll (client-side)`)
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

    for (const employeeId of assignedEmployees) {
      try {
        // Try to get employee name from employees collection
        const employeeRef = doc(db, 'employees', employeeId)
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
    console.log(`${logPrefix} ✅ Mileage payroll calculation complete`)
    console.log(`${logPrefix} Total cost: $${totalMileagePayrollCost.toFixed(2)}`)
    console.log(`${logPrefix} ========================================`)

    return mileagePayroll
  } catch (error: any) {
    console.error(`${logPrefix} ❌ Error calculating mileage payroll:`, error)
    return []
  }
}

