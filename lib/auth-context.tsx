'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase/config'
import { getUserProfile, UserProfile } from './firebase/firestore'
import { User, UserRole, ApprovalStatus } from './types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isLoading: boolean // Alias for loading
  login: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const profile = await getUserProfile(firebaseUser.uid)
      if (profile) {
        // Auto-approve admin users
        if (profile.role === 'admin' && !profile.approvalStatus) {
          profile.approvalStatus = 'approved' as ApprovalStatus
        }
        
        const userData: User = {
          id: profile.uid,
          email: profile.email || firebaseUser.email || '',
          role: (profile.role === 'admin' ? 'office_admin' : profile.role) as UserRole,
          approvalStatus: profile.approvalStatus as ApprovalStatus,
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName,
          companyName: profile.companyName,
          companyType: profile.companyType,
          createdAt: profile.createdAt?.toDate?.() || profile.createdAt,
          updatedAt: profile.updatedAt?.toDate?.() || profile.updatedAt,
        }
        
        // Store original role for admin checks
        ;(userData as any).originalRole = profile.role
        
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      if (firebaseUser) {
        await loadUserProfile(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setFirebaseUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false
    
    const userRole = user.role
    const originalRole = (user as any).originalRole || userRole
    
    // Check if user has admin role (either 'admin' or 'office_admin')
    // If allowedRoles includes either 'admin' or 'office_admin', check if user is admin
    if (roles.includes('office_admin') || roles.includes('admin')) {
      if (userRole === 'admin' || userRole === 'office_admin' || originalRole === 'admin') {
        return true
      }
    }
    
    // Check if user's role matches any allowed role
    return roles.includes(userRole) || roles.includes(originalRole as UserRole)
  }

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // The onAuthStateChanged listener will handle loading the user profile
    } catch (error: any) {
      console.error('Error signing in:', error)
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  const refreshUser = async () => {
    if (firebaseUser) {
      await loadUserProfile(firebaseUser)
    }
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isLoading: loading, login, signOut, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

