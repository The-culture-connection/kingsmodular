'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Settings, 
  Briefcase, 
  UserPlus, 
  Clock, 
  FileText, 
  Receipt, 
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  CreditCard,
  MapPin,
  Camera,
  Calculator,
  ArrowRight,
  Tag,
  Zap,
  PieChart,
  Package,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    console.log('[AdminDashboard] Checking access for user:', user)
    
    if (!user) {
      console.log('[AdminDashboard] No user, setting access to false')
      setHasAccess(false)
      return
    }
    
    // Get original role from Firestore if available
    const originalRole = (user as any).originalRole || user.role
    const userRole = user.role
    const userId = user.id
    
    // Check if user has admin role or is the specific admin user
    // Accept both "admin" (from Firestore) and "office_admin" roles
    const isAdmin = 
      userRole === 'office_admin' || 
      userRole === 'admin' ||
      originalRole === 'admin' ||
      userId === 'xisMRRNSvEPUomzEWRMrGy11J2h2'
    
    console.log('[AdminDashboard] Access check:', {
      hasUser: !!user,
      userRole: userRole,
      originalRole: originalRole,
      userId: userId,
      isAdmin: isAdmin,
      checks: {
        roleIsOfficeAdmin: userRole === 'office_admin',
        roleIsAdmin: userRole === 'admin',
        originalIsAdmin: originalRole === 'admin',
        userIdMatch: userId === 'xisMRRNSvEPUomzEWRMrGy11J2h2'
      }
    })
    
    setHasAccess(!!isAdmin)
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-base border border-accent/20 rounded-lg p-6 max-w-md">
          <p className="text-foreground/70">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-base border border-red-500/50 rounded-lg p-6 max-w-md">
          <p className="text-red-400 font-semibold mb-2">Access Denied</p>
          <p className="text-foreground/70">You need admin privileges (office_admin role) to access this portal.</p>
          <p className="text-foreground/50 text-sm mt-2">Your current role: {user.role}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
        <p className="text-foreground/70">Manage your operations across all suites</p>
      </div>

      {/* Employee Suite */}
      <div className="mb-8">
        <Link 
          href="/admin/suites/employee"
          className="block bg-base border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Employee Suite</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-accent group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-foreground/70">Manage employee onboarding, information, and payroll</p>
        </Link>
      </div>

      {/* Admin Suite */}
      <div className="mb-8">
        <Link 
          href="/admin/suites/admin"
          className="block bg-base border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Admin Suite</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-accent group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-foreground/70">Configure pricing, employee pay, and revenue analytics</p>
        </Link>
      </div>

      {/* Revenue Analytics Suite */}
      <div className="mb-8">
        <Link 
          href="/admin/analytics"
          className="block bg-base border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Revenue Analytics</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-accent group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-foreground/70">View invoices, generate revenue charts, and compare job costs</p>
        </Link>
      </div>

      {/* Job Suite */}
      <div className="mb-8">
        <Link 
          href="/admin/suites/job"
          className="block bg-base border border-accent/20 rounded-lg p-6 hover:border-accent/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Job Suite</h2>
            </div>
            <ChevronRight className="h-5 w-5 text-accent group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-foreground/70">Manage job estimates, schedules, and close out jobs</p>
        </Link>
      </div>
    </div>
  )
}
