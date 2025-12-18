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
      if (profile) {
        const userData: User = {
          id: profile.uid,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role as UserRole,
          companyId: undefined, // Can be added later
          companyName: profile.companyName,
          approvalStatus: profile.approvalStatus,
          createdAt: profile.createdAt instanceof Date ? profile.createdAt : new Date(profile.createdAt),
        }
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
    if (!user) return false
    return roles.includes(user.role)
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