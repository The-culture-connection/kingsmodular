export type UserRole = 
  | 'office_admin' 
  | 'project_manager' 
  | 'bookkeeper' 
  | 'field_staff' 
  | 'employee'
  | 'customer'

export type ApprovalStatus = 'pending' | 'approved' | 'denied'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  companyId?: string
  companyName?: string
  approvalStatus: ApprovalStatus
  createdAt: Date
}

export interface Company {
  id: string
  name: string
  type: 'internal' | 'customer'
  createdAt: Date
}
