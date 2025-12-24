// Time tracking data models and functions
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from './config'

export interface TimeEntry {
  id?: string
  employeeId: string
  employeeName?: string
  clockIn: Date | Timestamp
  clockOut?: Date | Timestamp
  breakDuration?: number // minutes
  totalHours?: number // calculated hours worked
  jobId?: string // Optional: if clocked in for a specific job
  jobName?: string
  status: 'active' | 'completed' | 'pending_approval' | 'approved' | 'rejected'
  notes?: string
  approvedBy?: string
  approvedAt?: Date | Timestamp
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface WeeklyHours {
  employeeId: string
  weekStart: Date // Monday of the week
  weekEnd: Date // Sunday of the week
  regularHours: number
  overtimeHours: number // Hours over 40
  totalHours: number
  entries: TimeEntry[]
}

/**
 * Clock in for an employee
 */
export async function clockIn(employeeId: string, jobId?: string, jobName?: string): Promise<string> {
  try {
    const timeEntryRef = doc(collection(db, 'timeEntries'))
    const timeEntry: any = {
      employeeId,
      clockIn: serverTimestamp(),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    // Only include jobId and jobName if they're provided (not undefined)
    if (jobId) {
      timeEntry.jobId = jobId
    }
    if (jobName) {
      timeEntry.jobName = jobName
    }
    
    await setDoc(timeEntryRef, timeEntry)
    return timeEntryRef.id
  } catch (error: any) {
    console.error('Error clocking in:', error)
    throw new Error(`Failed to clock in: ${error.message}`)
  }
}

/**
 * Clock out for an employee
 */
export async function clockOut(timeEntryId: string, breakDuration?: number, notes?: string): Promise<void> {
  try {
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId)
    const timeEntryDoc = await getDoc(timeEntryRef)
    
    if (!timeEntryDoc.exists()) {
      throw new Error('Time entry not found')
    }
    
    const data = timeEntryDoc.data()
    const clockInTime = data.clockIn?.toDate ? data.clockIn.toDate() : new Date(data.clockIn)
    const clockOutTime = new Date()
    
    // Calculate total hours
    const totalMs = clockOutTime.getTime() - clockInTime.getTime()
    const totalMinutes = Math.floor(totalMs / 60000) - (breakDuration || 0)
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100
    
    const updateData: any = {
      clockOut: serverTimestamp(),
      breakDuration: breakDuration || 0,
      totalHours,
      status: 'pending_approval',
      updatedAt: serverTimestamp(),
    }
    
    // Only include notes if provided
    if (notes) {
      updateData.notes = notes
    }
    
    await setDoc(timeEntryRef, updateData, { merge: true })
  } catch (error: any) {
    console.error('Error clocking out:', error)
    throw new Error(`Failed to clock out: ${error.message}`)
  }
}

/**
 * Get active time entry for an employee (if clocked in)
 */
export async function getActiveTimeEntry(employeeId: string): Promise<TimeEntry | null> {
  try {
    // Query without orderBy to avoid index requirement, filter and sort client-side
    const q = query(
      collection(db, 'timeEntries'),
      where('employeeId', '==', employeeId),
      where('status', '==', 'active')
    )
    
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    
    // Find entries without clockOut and sort by clockIn descending
    const activeEntries = snapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          clockIn: data.clockIn?.toDate ? data.clockIn.toDate() : new Date(data.clockIn),
          clockOut: data.clockOut?.toDate ? data.clockOut.toDate() : undefined,
        } as TimeEntry
      })
      .filter(entry => !entry.clockOut) // Filter for entries without clockOut
      .sort((a, b) => {
        const aDate = a.clockIn instanceof Date 
          ? a.clockIn 
          : (a.clockIn?.toDate ? a.clockIn.toDate() : new Date(a.clockIn as any))
        const bDate = b.clockIn instanceof Date 
          ? b.clockIn 
          : (b.clockIn?.toDate ? b.clockIn.toDate() : new Date(b.clockIn as any))
        return bDate.getTime() - aDate.getTime() // Most recent first
      })
    
    return activeEntries.length > 0 ? activeEntries[0] : null
  } catch (error: any) {
    console.error('Error getting active time entry:', error)
    return null
  }
}

/**
 * Get time entries for an employee in a date range
 */
export async function getTimeEntries(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeEntry[]> {
  try {
    // Query without orderBy to avoid index requirement, filter and sort client-side
    const q = query(
      collection(db, 'timeEntries'),
      where('employeeId', '==', employeeId)
    )
    
    const snapshot = await getDocs(q)
    const entries = snapshot.docs.map(doc => {
      const data = doc.data()
      const clockInDate = data.clockIn?.toDate ? data.clockIn.toDate() : new Date(data.clockIn)
      return {
        id: doc.id,
        ...data,
        clockIn: clockInDate,
        clockOut: data.clockOut?.toDate ? data.clockOut.toDate() : undefined,
      } as TimeEntry
    })
    
    // Filter by date range and sort client-side
    const startTimestamp = startDate.getTime()
    const endTimestamp = endDate.getTime()
    
    return entries
      .filter(entry => {
        const entryTime = entry.clockIn instanceof Date 
          ? entry.clockIn.getTime() 
          : (entry.clockIn?.toDate ? entry.clockIn.toDate().getTime() : new Date(entry.clockIn as any).getTime())
        return entryTime >= startTimestamp && entryTime <= endTimestamp
      })
      .sort((a, b) => {
        const aTime = a.clockIn instanceof Date 
          ? a.clockIn.getTime() 
          : (a.clockIn?.toDate ? a.clockIn.toDate().getTime() : new Date(a.clockIn as any).getTime())
        const bTime = b.clockIn instanceof Date 
          ? b.clockIn.getTime() 
          : (b.clockIn?.toDate ? b.clockIn.toDate().getTime() : new Date(b.clockIn as any).getTime())
        return bTime - aTime // Most recent first
      })
  } catch (error: any) {
    console.error('Error getting time entries:', error)
    return []
  }
}

/**
 * Calculate weekly hours for an employee
 */
export function calculateWeeklyHours(entries: TimeEntry[]): WeeklyHours[] {
  const weeklyMap = new Map<string, WeeklyHours>()
  
  entries.forEach(entry => {
    if (!entry.totalHours || entry.status !== 'approved') return
    
    const date = entry.clockIn instanceof Date 
      ? entry.clockIn 
      : (entry.clockIn?.toDate ? entry.clockIn.toDate() : new Date(entry.clockIn as any))
    const weekStart = getWeekStart(date)
    const weekKey = weekStart.toISOString()
    
    if (!weeklyMap.has(weekKey)) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      weeklyMap.set(weekKey, {
        employeeId: entry.employeeId,
        weekStart,
        weekEnd,
        regularHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        entries: [],
      })
    }
    
    const week = weeklyMap.get(weekKey)!
    week.totalHours += entry.totalHours
    week.entries.push(entry)
    
    // Calculate overtime (hours over 40)
    if (week.totalHours > 40) {
      week.regularHours = 40
      week.overtimeHours = week.totalHours - 40
    } else {
      week.regularHours = week.totalHours
      week.overtimeHours = 0
    }
  })
  
  return Array.from(weeklyMap.values())
}

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Approve or reject a time entry
 */
export async function approveTimeEntry(
  timeEntryId: string,
  approved: boolean,
  approvedBy: string,
  notes?: string
): Promise<void> {
  try {
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId)
    await setDoc(timeEntryRef, {
      status: approved ? 'approved' : 'rejected',
      approvedBy,
      approvedAt: serverTimestamp(),
      notes,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error: any) {
    console.error('Error approving time entry:', error)
    throw new Error(`Failed to ${approved ? 'approve' : 'reject'} time entry: ${error.message}`)
  }
}

