// Employees Firestore functions
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore'
import { db } from './config'

export interface Employee {
  id: string
  uid: string // Firebase Auth UID
  email: string
  name: string
  hourlyRate: number
  dateOfBirth?: string
  hireDate?: string
  startDate?: string
  role: 'employee' | 'admin'
  createdAt?: Date | any
  updatedAt?: Date | any
  [key: string]: any // For custom fields
}

/**
 * Get all employees from Firestore
 */
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, 'Employees')
    const q = query(employeesRef, orderBy('name'))
    const snapshot = await getDocs(q)
    
    const employees: Employee[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      employees.push({
        id: doc.id,
        uid: data.uid || '',
        email: data.email || '',
        name: data.name || '',
        hourlyRate: data.hourlyRate || data.hourly_rate || 0,
        dateOfBirth: data.dateOfBirth || data.date_of_birth,
        hireDate: data.hireDate || data.hire_date,
        startDate: data.startDate || data.start_date,
        role: data.role || 'employee',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        ...data, // Include all other fields (custom fields)
      })
    })
    
    return employees
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    throw new Error(`Failed to fetch employees: ${error.message}`)
  }
}

/**
 * Get employee by UID
 */
export async function getEmployeeByUid(uid: string): Promise<Employee | null> {
  try {
    const employeesRef = collection(db, 'Employees')
    const q = query(employeesRef, where('uid', '==', uid))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    
    return {
      id: doc.id,
      uid: data.uid || '',
      email: data.email || '',
      name: data.name || '',
      hourlyRate: data.hourlyRate || data.hourly_rate || 0,
      dateOfBirth: data.dateOfBirth || data.date_of_birth,
      hireDate: data.hireDate || data.hire_date,
      startDate: data.startDate || data.start_date,
      role: data.role || 'employee',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      ...data,
    }
  } catch (error: any) {
    console.error('Error fetching employee:', error)
    throw new Error(`Failed to fetch employee: ${error.message}`)
  }
}
