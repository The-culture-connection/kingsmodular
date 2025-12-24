'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function DashboardRedirectPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role
      const originalRole = (user as any).originalRole || role
      const userId = user.id
      
      console.log('[DashboardRedirect] Redirecting user:', {
        role,
        originalRole,
        userId,
        approvalStatus: user.approvalStatus
      })
      
      // Check if admin (office_admin or admin role, or specific admin user ID)
      if (role === 'office_admin' || originalRole === 'admin' || role === 'admin' || userId === 'xisMRRNSvEPUomzEWRMrGy11J2h2') {
        console.log('[DashboardRedirect] Redirecting to admin dashboard')
        router.push('/admin/dashboard')
      } else if (role === 'customer') {
        console.log('[DashboardRedirect] Redirecting to customer dashboard')
        router.push('/customer/dashboard')
      } else if (role === 'employee') {
        console.log('[DashboardRedirect] Redirecting to employee dashboard')
        router.push('/employee/dashboard')
      } else if (role === 'field_staff') {
        console.log('[DashboardRedirect] Redirecting to field dashboard')
        router.push('/field/dashboard')
      } else if (user.approvalStatus === 'pending') {
        console.log('[DashboardRedirect] Redirecting to pending approval')
        router.push('/auth/pending-approval')
      } else {
        console.log('[DashboardRedirect] Default redirect to customer dashboard')
        router.push('/customer/dashboard')
      }
    } else if (!isLoading && !user) {
      console.log('[DashboardRedirect] No user, redirecting to login')
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSkeleton className="w-64 h-64" />
    </div>
  )
}
