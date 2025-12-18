'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, DollarSign, Briefcase, ArrowRight, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { getCustomerPendingEstimates, PendingEstimate } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'

export default function CustomerDashboardPage() {
  const { user } = useAuth()
  const [outstandingBalance, setOutstandingBalance] = useState(0)
  const [recentJobs, setRecentJobs] = useState<PendingEstimate[]>([])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    try {
      const allJobs = await getCustomerPendingEstimates(user.id)
      
      if (!Array.isArray(allJobs)) {
        console.error('Invalid jobs data:', allJobs)
        setOutstandingBalance(0)
        setRecentJobs([])
        return
      }
      
      // Calculate outstanding balance (approved, in_progress/ongoing, and outstanding statuses)
      const outstanding = allJobs
        .filter(job => {
          const status = String(job.status).toLowerCase().trim()
          return status === 'approved' || status === 'in_progress' || status === 'outstanding' || status === 'ongoing'
        })
        .reduce((sum, job) => sum + job.totalPrice, 0)
      setOutstandingBalance(outstanding)

      // Get recent or upcoming jobs (sort by date, show most recent or upcoming)
      const sortedJobs = [...allJobs].sort((a, b) => {
        const aDate = new Date(a.dateRange.start)
        const bDate = new Date(b.dateRange.start)
        return bDate.getTime() - aDate.getTime()
      })
      setRecentJobs(sortedJobs.slice(0, 3)) // Show top 3
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-400 bg-yellow-400/20',
      approved: 'text-green-400 bg-green-400/20',
      outstanding: 'text-orange-400 bg-orange-400/20',
      in_progress: 'text-blue-400 bg-blue-400/20',
      paid: 'text-green-500 bg-green-500/20',
      denied: 'text-red-400 bg-red-400/20',
    }
    return colors[status] || 'text-foreground/70 bg-foreground/10'
  }

  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-foreground/70">Overview of your projects and account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Get a Quote Widget - Top Left */}
        <div className="bg-base border border-accent rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-2">Get a Quote</h2>
              <p className="text-sm text-foreground/70 mb-4">Request a quote for your next project</p>
              <Link href="/customer/quote">
                <Button variant="primary" size="md" className="bg-accent hover:bg-accent/90">
                  Request Quote
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <FileText className="h-16 w-16 text-accent/20 flex-shrink-0 ml-4" />
          </div>
        </div>

        {/* Outstanding Balance Widget - Top Right */}
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground">Outstanding Balance</h2>
            <Link href="/customer/jobs" className="text-accent hover:underline text-xs">
              View All
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">${outstandingBalance.toLocaleString()}</p>
              <p className="text-xs text-foreground/70 mt-1">Total due</p>
            </div>
            <DollarSign className="h-10 w-10 text-accent/20" />
          </div>
        </div>

        {/* My Jobs Widget - Bottom Full Width */}
        <div className="lg:col-span-2 bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">My Jobs</h2>
            <Link href="/customer/jobs" className="text-accent hover:underline text-sm">
              View All Jobs
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-accent/20 mx-auto mb-3" />
              <p className="text-foreground/70">No jobs yet</p>
              <p className="text-sm text-foreground/50 mt-1">Submit a quote to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href="/customer/jobs"
                  className="block bg-foreground/5 border border-accent/10 rounded-lg p-4 hover:bg-foreground/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">Job #{job.id?.slice(0, 8) || 'N/A'}</h3>
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(job.status))}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.dateRange.start)} - {formatDate(job.dateRange.end)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location.split(',')[0]}
                        </div>
                        <span className="text-accent font-semibold">
                          ${job.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-foreground/30 flex-shrink-0 ml-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}