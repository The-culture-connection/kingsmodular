'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, CheckCircle2, XCircle, DollarSign, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { getCustomerPendingEstimates, PendingEstimate } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    borderColor: 'border-yellow-400/50',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
    borderColor: 'border-green-400/50',
  },
  denied: {
    label: 'Denied',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/20',
    borderColor: 'border-red-400/50',
  },
  outstanding: {
    label: 'Outstanding',
    icon: DollarSign,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    borderColor: 'border-orange-400/50',
  },
  in_progress: {
    label: 'In Progress',
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    borderColor: 'border-blue-400/50',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
  },
}

export default function CustomerEstimatesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [estimates, setEstimates] = useState<PendingEstimate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadEstimates()
    }
  }, [user])

  const loadEstimates = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // Get all estimates and filter for pending ones
      const allEstimates = await getCustomerPendingEstimates(user.id)
      const pendingEstimates = allEstimates.filter(est => est.status === 'pending')
      setEstimates(pendingEstimates)
    } catch (error: any) {
      showToast(error.message || 'Failed to load estimates', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground/70">Loading estimates...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Pending Estimates</h1>
        <p className="text-foreground/70">View the status of your quote requests</p>
      </div>

      {estimates.length === 0 ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <p className="text-foreground/70 mb-4">No estimates found.</p>
          <p className="text-sm text-foreground/50">
            Submit a quote request to see your estimates here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {estimates.map((estimate) => {
            const status = statusConfig[estimate.status] || statusConfig.pending
            const StatusIcon = status.icon

            return (
              <div
                key={estimate.id}
                className={cn(
                  'bg-base border rounded-lg p-6',
                  status.borderColor
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-foreground">
                        Estimate #{estimate.id?.slice(0, 8) || 'N/A'}
                      </h2>
                      <div
                        className={cn(
                          'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                          status.bgColor,
                          status.color
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(estimate.dateRange.start)} - {formatDate(estimate.dateRange.end)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {estimate.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">
                      ${estimate.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-foreground/50 mt-1">Total Price</p>
                  </div>
                </div>

                <div className="border-t border-accent/20 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Selected Jobs:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {estimate.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-foreground/5 border border-accent/10 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{job.name}</p>
                            <p className="text-xs text-foreground/70 mt-1">{job.description}</p>
                          </div>
                          <p className="text-sm font-bold text-accent ml-2">
                            ${job.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}