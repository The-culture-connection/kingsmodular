export type UserRole = 'office_admin' | 'project_manager' | 'bookkeeper' | 'field_staff' | 'employee' | 'customer' | 'admin'

export type ApprovalStatus = 'pending' | 'approved' | 'denied'

export interface User {
  id: string
  email: string
  role: UserRole
  approvalStatus: ApprovalStatus
  firstName?: string
  lastName?: string
  displayName?: string
  companyName?: string
  companyType?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Company {
  name: string
  type: string
  address?: string
  phone?: string
  email?: string
}

