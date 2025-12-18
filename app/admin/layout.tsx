'use client'

import { AdminLayout } from '@/components/layouts/admin-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/lib/types'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['office_admin']}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}
