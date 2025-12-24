import { UserRole } from './types'

export const ROLE_LABELS: Record<UserRole, string> = {
  office_admin: 'Office Admin',
  project_manager: 'Project Manager',
  bookkeeper: 'Bookkeeper',
  field_staff: 'Field Staff',
  employee: 'Employee',
  customer: 'Customer',
  admin: 'Admin',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  office_admin: 'Full access to all administrative functions and user management',
  project_manager: 'Manage jobs, schedules, and project updates',
  bookkeeper: 'Access to financial records and accounting functions',
  field_staff: 'Submit time entries, mileage, and job notes',
  employee: 'Submit time entries, mileage, and job notes',
  customer: 'Access your projects, estimates, invoices, and communicate with the team',
  admin: 'Full system access with all administrative privileges',
}

