'use client'

import * as React from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth } from './firebase/config'
import { getUserProfile } from './firebase/firestore'
import { User, UserRole } from './types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = React.useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadUserProfile = React.useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const profile = await getUserProfile(firebaseUser.uid)
      console.log('[AuthContext] Loaded profile from Firestore:', profile)
      
      if (profile) {
        // Keep the original role from Firestore - don't normalize it
        // We'll handle "admin" and "office_admin" as equivalent in the checks
        const originalRole = profile.role
        let userRole: UserRole
        
        // Map "admin" to "office_admin" for type safety, but preserve the check logic
        if (originalRole === 'admin' || originalRole === 'office_admin') {
          userRole = 'office_admin' // Use office_admin for type, but we'll check for both
        } else {
          userRole = originalRole as UserRole
        }
        
        console.log('[AuthContext] Loaded profile:', {
          uid: profile.uid,
          originalRole: originalRole,
          mappedRole: userRole,
          email: profile.email
        })
        
        // Auto-approve admin users
        let approvalStatus = profile.approvalStatus
        if ((originalRole === 'admin' || userRole === 'office_admin') && !approvalStatus) {
          approvalStatus = 'approved'
          console.log('[AuthContext] Auto-approving admin user')
        }
        
        const userData: User = {
          id: profile.uid,
          email: profile.email || firebaseUser.email || '', // Use Firebase auth email as fallback
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: userRole,
          companyId: undefined, // Can be added later
          companyName: profile.companyName,
          approvalStatus: approvalStatus || 'pending',
          createdAt: profile.createdAt instanceof Date ? profile.createdAt : new Date(profile.createdAt),
        }
        
        // Store original role in a way we can check it
        ;(userData as any).originalRole = originalRole
        
        console.log('[AuthContext] Setting user data:', { 
          id: userData.id, 
          role: userData.role, 
          originalRole: originalRole,
          email: userData.email 
        })
        setUser(userData)
        setFirebaseUser(firebaseUser)
      } else {
        // Profile doesn't exist yet, set basic user info
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'customer' as UserRole,
          approvalStatus: 'pending',
          createdAt: new Date(),
        })
        setFirebaseUser(firebaseUser)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null)
      setFirebaseUser(null)
    }
  }, [])

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser)
      } else {
        setUser(null)
        setFirebaseUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [loadUserProfile])

  const login = async (email: string, password: string) => {
    const { loginUser } = await import('./firebase/auth')
    await loginUser(email, password)
    // onAuthStateChanged will update the user state
  }

  const logout = async () => {
    const { logoutUser } = await import('./firebase/auth')
    await logoutUser()
    setUser(null)
    setFirebaseUser(null)
  }

  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser)
    }
  }

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) {
      console.log('[hasRole] No user, returning false')
      return false
    }
    
    // Get original role from Firestore if available
    const originalRole = (user as any).originalRole || user.role
    const userRole = user.role
    
    console.log('[hasRole] Checking role access:', {
      userRole,
      originalRole,
      allowedRoles: roles,
      userId: user.id
    })
    
    // Check if user's role is in allowed roles
    // Also treat 'admin' (from Firestore) as equivalent to 'office_admin'
    const isAdmin = originalRole === 'admin' || userRole === 'admin' || userRole === 'office_admin'
    const isOfficeAdminAllowed = roles.includes('office_admin')
    
    if (isAdmin && isOfficeAdminAllowed) {
      console.log('[hasRole] User is admin and office_admin is allowed, returning true')
      return true
    }
    
    const hasAccess = roles.includes(userRole)
    console.log('[hasRole] Role check result:', hasAccess)
    return hasAccess
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    // TODO: Implement permission checking logic based on role
    return true
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser,
      isLoading, 
      login, 
      logout, 
      hasRole, 
      hasPermission,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}