import { FieldLayout } from '@/components/layouts/field-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/lib/types'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['field_staff', 'employee']}>
      <FieldLayout>{children}</FieldLayout>
    </ProtectedRoute>
  )
}
