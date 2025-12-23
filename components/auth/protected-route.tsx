'use client'

import { useAuth } from '@/lib/auth-context'
import { UserRole } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user has required role
      if (!hasRole(allowedRoles)) {
        router.push('/auth/pending-approval')
        return
      }

      // Skip approval check for admin and customer users
      const isAdmin = user.role === 'admin' || user.role === 'office_admin' || (user as any).originalRole === 'admin'
      const isCustomer = user.role === 'customer'
      
      if (!isAdmin && !isCustomer && user.approvalStatus === 'pending') {
        router.push('/auth/pending-approval')
        return
      }

      if (user.approvalStatus === 'denied') {
        router.push('/auth/pending-approval')
        return
      }
    }
  }, [user, loading, allowedRoles, hasRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-foreground/70">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (user.approvalStatus === 'pending' && user.role !== 'customer' && user.role !== 'admin' && user.role !== 'office_admin') {
    return null // Will redirect
  }

  return <>{children}</>
}

