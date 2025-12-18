'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { UserRole } from '@/lib/types'
import { PermissionsDenied } from '@/components/ui/permissions-denied'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireApproval?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = true,
}: ProtectedRouteProps) {
  const { user, isLoading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton className="w-64 h-64" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireApproval && user.approvalStatus !== 'approved') {
    if (user.approvalStatus === 'pending') {
      router.push('/auth/pending-approval')
      return null
    }
    return (
      <PermissionsDenied message="Your account has been denied. Please contact support." />
    )
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <PermissionsDenied />
  }

  return <>{children}</>
}
