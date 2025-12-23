'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  UserPlus, 
  Clock, 
  FileText, 
  Receipt, 
  Calendar,
  ArrowRight,
  Banknote,
  FileBadge,
  Hourglass,
  Calculator,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  Plus,
  Eye,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAllEmployees, Employee } from '@/lib/firebase/employees'
import { cn } from '@/lib/utils'

// Placeholder interfaces for future data structures
interface EmployeeStats {
  activeEmployees: number
  hoursPendingApproval: number
  missingTaxForms: number
  ptoRequestsPending: number
}

interface RecentActivity {
  id: string
  type: 'pto' | 'hours' | 'tax' | 'payroll'
  message: string
  timestamp: Date
  employeeName: string
}

export default function EmployeeSuitePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Placeholder stats - will be calculated from real data later
  const [stats, setStats] = useState<EmployeeStats>({
    activeEmployees: 0,
    hoursPendingApproval: 0,
    missingTaxForms: 0,
    ptoRequestsPending: 0,
  })

  // Placeholder recent activity - will be fetched from real data later
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    loadEmployees()
    // TODO: Load stats and recent activity from Firestore
    loadStats()
    loadRecentActivity()
  }, [])

  const loadEmployees = async () => {
    try {
      const employeesData = await getAllEmployees()
      setEmployees(employeesData)
      // Calculate active employees
      setStats(prev => ({ ...prev, activeEmployees: employeesData.length }))
    } catch (error: any) {
      console.error('Error loading employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    // TODO: Fetch from Firestore
    // For now, use placeholder data
    setStats({
      activeEmployees: employees.length,
      hoursPendingApproval: 3, // TODO: Count from hours collection
      missingTaxForms: 1, // TODO: Count employees without tax forms
      ptoRequestsPending: 2, // TODO: Count pending PTO requests
    })
  }

  const loadRecentActivity = async () => {
    // TODO: Fetch from Firestore activity log
    // For now, use placeholder data
    setRecentActivity([
      {
        id: '1',
        type: 'pto',
        message: 'submitted PTO request',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        employeeName: 'John Smith',
      },
      {
        id: '2',
        type: 'payroll',
        message: 'Payroll generated for last period',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        employeeName: 'System',
      },
      {
        id: '3',
        type: 'tax',
        message: 'W-4 uploaded',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        employeeName: 'Sarah Johnson',
      },
    ])
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pto': return <Hourglass className="h-4 w-4 text-amber-400" />
      case 'hours': return <Clock className="h-4 w-4 text-blue-400" />
      case 'tax': return <FileBadge className="h-4 w-4 text-green-400" />
      case 'payroll': return <Calculator className="h-4 w-4 text-accent" />
      default: return <Activity className="h-4 w-4 text-foreground/70" />
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-accent" />
          Employee Suite
        </h1>
        <p className="text-foreground/70">Manage employee onboarding, information, and payroll</p>
      </div>

      {/* Status Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-base border border-accent/20 rounded-lg p-4 hover:shadow-lg hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/70">Active Employees</span>
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.activeEmployees}</div>
        </div>
        
        <div className="bg-base border border-amber-500/20 rounded-lg p-4 hover:shadow-lg hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/70">Hours Pending</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.hoursPendingApproval}</div>
        </div>
        
        <div className="bg-base border border-red-500/20 rounded-lg p-4 hover:shadow-lg hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/70">Missing Tax Forms</span>
            <FileBadge className="h-5 w-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.missingTaxForms}</div>
        </div>
        
        <div className="bg-base border border-amber-500/20 rounded-lg p-4 hover:shadow-lg hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/70">PTO Requests</span>
            <Hourglass className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.ptoRequestsPending}</div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Employee Onboarding Card */}
          <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <UserPlus className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Employee Onboarding</h3>
                  <p className="text-sm text-foreground/70">Complete the onboarding process</p>
                </div>
              </div>
            </div>
            
            {/* Step Indicator */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-accent/20 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-1/3 transition-all"></div>
              </div>
              <span className="text-xs text-foreground/70">Step 1 of 3</span>
            </div>

            <div className="space-y-2">
              <Link href="/admin/employees/onboarding/create-profile">
                <Button variant="primary" className="w-full justify-between group">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Employee Profile
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="text-xs text-foreground/60 mt-2">
                Next: Tax Info → Payroll Setup
              </div>
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hours Card */}
            <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Hours</h3>
                    {stats.hoursPendingApproval > 0 && (
                      <p className="text-sm text-amber-400 font-medium">
                        {stats.hoursPendingApproval} entries need approval
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-foreground/70 mb-1">Last pay period</div>
                <div className="text-lg font-semibold text-foreground">240 hours total</div>
              </div>
              <Link href="/admin/employees/info/hours">
                <Button variant="outline" className="w-full justify-between group">
                  <span>Review Hours</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Paystubs Card */}
            <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Banknote className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Paystubs</h3>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-foreground/70 mb-1">Last payroll run</div>
                <div className="text-lg font-semibold text-foreground">Dec 15, 2025</div>
                <div className="text-sm text-foreground/60">$12,450.00</div>
              </div>
              <Link href="/admin/employees/info/paystubs">
                <Button variant="outline" className="w-full justify-between group">
                  <span>View Paystubs</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Tax Info Card */}
            <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <FileBadge className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Tax Info</h3>
                    {stats.missingTaxForms > 0 && (
                      <p className="text-sm text-red-400 font-medium">
                        {stats.missingTaxForms} missing forms
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-foreground/70 mb-1">Forms on file</div>
                <div className="text-lg font-semibold text-foreground">{stats.activeEmployees - stats.missingTaxForms} / {stats.activeEmployees}</div>
              </div>
              <Link href="/admin/employees/info/tax-info">
                <Button variant="outline" className="w-full justify-between group">
                  <span>Manage Tax Info</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* PTO Requests Card */}
            <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Hourglass className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">PTO Requests</h3>
                    {stats.ptoRequestsPending > 0 && (
                      <p className="text-sm text-amber-400 font-medium">
                        {stats.ptoRequestsPending} pending
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-foreground/70 mb-1">Next approved</div>
                <div className="text-lg font-semibold text-foreground">Jan 5, 2026</div>
                <div className="text-sm text-foreground/60">Sarah Johnson</div>
              </div>
              <Link href="/admin/employees/info/pto">
                <Button variant="outline" className="w-full justify-between group">
                  <span>Review Requests</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Generate Payroll Card */}
            <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Calculator className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Generate Payroll</h3>
                    <p className="text-sm text-foreground/70">Calculate and process employee payroll</p>
                  </div>
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-foreground/70 mb-1">Period</div>
                  <div className="text-lg font-semibold text-foreground">Dec 1-15, 2025</div>
                </div>
                <div>
                  <div className="text-sm text-foreground/70 mb-1">Estimated Total</div>
                  <div className="text-lg font-semibold text-foreground">$12,450.00</div>
                </div>
              </div>
              <Link href="/admin/employees/info/generate-payroll">
                <Button variant="primary" className="w-full justify-between group">
                  <span>Run Payroll</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Actions & Recent Activity */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Quick Actions */}
          <div className="bg-base border border-accent/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/admin/employees/onboarding/create-profile">
                <Button variant="outline" className="w-full justify-start group">
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  Create Employee
                </Button>
              </Link>
              {stats.hoursPendingApproval > 0 && (
                <Link href="/admin/employees/info/hours">
                  <Button variant="outline" className="w-full justify-start group">
                    <Clock className="h-4 w-4 mr-2 text-amber-400" />
                    Approve Hours ({stats.hoursPendingApproval})
                  </Button>
                </Link>
              )}
              {stats.missingTaxForms > 0 && (
                <Link href="/admin/employees/info/tax-info">
                  <Button variant="outline" className="w-full justify-start group">
                    <Upload className="h-4 w-4 mr-2 text-red-400" />
                    Upload Tax Form ({stats.missingTaxForms})
                  </Button>
                </Link>
              )}
              <Link href="/admin/employees/info/generate-payroll">
                <Button variant="outline" className="w-full justify-start group">
                  <Calculator className="h-4 w-4 mr-2 text-accent" />
                  Run Payroll
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-base border border-accent/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground">
                        <span className="font-medium">{activity.employeeName}</span>{' '}
                        <span className="text-foreground/70">{activity.message}</span>
                      </div>
                      <div className="text-xs text-foreground/50 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-foreground/70 text-center py-4">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
