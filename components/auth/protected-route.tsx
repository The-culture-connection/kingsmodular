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

  // Skip approval check for customers (they are auto-approved)
  // Also skip approval check for admin users (they are auto-approved)
  const originalRole = (user as any).originalRole || user.role
  const isAdmin = originalRole === 'admin' || user.role === 'admin' || user.role === 'office_admin'
  const needsApproval = requireApproval && 
    user.role !== 'customer' && 
    !isAdmin && // Skip approval for admins
    user.approvalStatus !== 'approved'
  
  console.log('[ProtectedRoute] Approval check:', {
    role: user.role,
    originalRole: originalRole,
    isAdmin: isAdmin,
    approvalStatus: user.approvalStatus,
    needsApproval: needsApproval
  })
  
  if (needsApproval) {
    if (user.approvalStatus === 'pending') {
      router.push('/auth/pending-approval')
      return null
    }
    return (
      <PermissionsDenied message="Your account has been denied. Please contact support." />
    )
  }

  // Check role access - also allow specific admin user ID and "admin" role
  if (allowedRoles) {
    const userRole = user.role
    const originalRole = (user as any).originalRole || userRole
    const userId = user.id
    
    console.log('[ProtectedRoute] Checking access:', {
      userRole,
      originalRole,
      userId,
      allowedRoles,
      hasRoleResult: hasRole(allowedRoles)
    })
    
    // Check if user has one of the allowed roles
    // Handle both "admin" (from Firestore) and "office_admin" roles
    const isAdminRole = originalRole === 'admin' || userRole === 'admin' || userRole === 'office_admin'
    const isOfficeAdminAllowed = allowedRoles.includes('office_admin')
    
    const hasRoleAccess = hasRole(allowedRoles) || 
      // Also allow "admin" role if "office_admin" is in allowedRoles
      (isOfficeAdminAllowed && isAdminRole) ||
      // Allow specific admin user ID
      userId === 'xisMRRNSvEPUomzEWRMrGy11J2h2'
    
    console.log('[ProtectedRoute] Access check result:', {
      hasRoleAccess,
      isAdminRole,
      isOfficeAdminAllowed,
      userIdMatch: userId === 'xisMRRNSvEPUomzEWRMrGy11J2h2'
    })
    
    if (!hasRoleAccess) {
      console.log('[ProtectedRoute] Access denied for user:', { 
        role: userRole, 
        originalRole: originalRole,
        id: userId,
        allowedRoles: allowedRoles
      })
      return <PermissionsDenied />
    }
    
    console.log('[ProtectedRoute] Access granted')
  }

  return <>{children}</>
}
