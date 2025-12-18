import { CustomerLayout } from '@/components/layouts/customer-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/lib/types'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <CustomerLayout>{children}</CustomerLayout>
    </ProtectedRoute>
  )
}
