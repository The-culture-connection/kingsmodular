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
      // Redirect based on role - customers always go to customer dashboard
      if (user.role === 'customer') {
        router.push('/customer/dashboard')
      } else if (user.role === 'field_staff' || user.role === 'employee') {
        router.push('/field/dashboard')
      } else if (user.approvalStatus === 'approved') {
        router.push('/admin/dashboard')
      } else if (user.approvalStatus === 'pending') {
        router.push('/auth/pending-approval')
      } else {
        router.push('/auth/login')
      }
    } else if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSkeleton className="w-64 h-64" />
    </div>
  )
}
