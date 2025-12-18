import { UserRole } from './types'

export type { UserRole }

export const ROLE_LABELS: Record<UserRole, string> = {
  office_admin: 'Office Admin',
  admin: 'Admin', // Alias for office_admin
  project_manager: 'Project Manager',
  bookkeeper: 'Bookkeeper',
  field_staff: 'Field Staff',
  employee: 'Employee',
  customer: 'Customer',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  office_admin: 'Full access to all features and settings',
  admin: 'Full access to all features and settings', // Alias for office_admin
  project_manager: 'Manage jobs, schedule, and project updates',
  bookkeeper: 'Access to financials and accounting features',
  field_staff: 'Time tracking, mileage, and note uploads',
  employee: 'Time tracking, mileage, and note uploads',
  customer: 'View your projects, estimates, invoices, and communicate with the team',
}
