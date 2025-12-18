'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, CheckCircle2, XCircle, DollarSign, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { getCustomerPendingEstimates, PendingEstimate } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'

const statusConfig = {
  pending: {
    label: 'Pending Approval',
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
  denied: {
    label: 'Denied',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-400/20',
    borderColor: 'border-red-400/50',
  },
}

export default function CustomerJobsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<PendingEstimate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadJobs()
    }
  }, [user])

  const loadJobs = async () => {
    if (!user) {
      showToast('User not authenticated', 'error')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const allJobs = await getCustomerPendingEstimates(user.id)
      
      if (!Array.isArray(allJobs)) {
        throw new Error('Invalid data format received from server')
      }
      
      setJobs(allJobs)
    } catch (error: any) {
      console.error('Error loading jobs:', error)
      const errorMessage = error.message || 'Failed to load jobs. Please refresh the page or contact support if the problem persists.'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      setJobs([]) // Clear jobs on error
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDownloadInvoice = async (job: PendingEstimate) => {
    if (!user) {
      showToast('Please sign in to download invoices', 'error')
      return
    }

    try {
      // Show loading state
      showToast('Generating invoice PDF...', 'info')

      // Call API to generate PDF
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimateId: job.id,
          customerId: user.id,
        }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error('Server returned an invalid response. Please check the console for details.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate invoice')
      }

      // Handle both signed URL and base64 PDF responses
      if (data.signedUrl) {
        // Download the PDF from the signed URL
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = `invoice-${data.invoiceNumber || job.id?.slice(0, 8) || 'invoice'}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (data.pdfBase64) {
        // Download the PDF from base64 data
        const byteCharacters = atob(data.pdfBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${data.invoiceNumber || job.id?.slice(0, 8) || 'invoice'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        throw new Error('No PDF data received from server')
      }

      showToast('Invoice downloaded successfully!', 'success')
    } catch (error: any) {
      console.error('Error downloading invoice:', error)
      showToast(error.message || 'Failed to generate invoice. Please try again.', 'error')
    }
  }

  const filteredJobs = filterStatus === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === filterStatus)

  const totalOutstanding = jobs
    .filter(job => job.status === 'outstanding')
    .reduce((sum, job) => sum + job.totalPrice, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground/70">Loading jobs...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-base border border-red-500/50 rounded-lg p-6">
        <p className="text-red-400 font-semibold mb-2">Authentication Error</p>
        <p className="text-foreground/70">Please sign in to view your jobs.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Jobs</h1>
        <p className="text-foreground/70">View and manage all your jobs and estimates</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 font-semibold mb-1">Error Loading Jobs</p>
          <p className="text-foreground/70 text-sm">{error}</p>
          <button
            onClick={loadJobs}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-base border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground/70 mb-1">Total Jobs</p>
          <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
        </div>
        <div className="bg-base border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground/70 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-foreground">
            {jobs.filter(j => j.status === 'pending').length}
          </p>
        </div>
        <div className="bg-base border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground/70 mb-1">Approved</p>
          <p className="text-2xl font-bold text-foreground">
            {jobs.filter(j => j.status === 'approved').length}
          </p>
        </div>
        <div className="bg-base border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground/70 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-foreground">
            {jobs.filter(j => j.status === 'outstanding').length}
          </p>
        </div>
        <div className="bg-base border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground/70 mb-1">Denied</p>
          <p className="text-2xl font-bold text-foreground">
            {jobs.filter(j => j.status === 'denied').length}
          </p>
        </div>
        <div className="bg-base border border-accent/20 rounded-lg p-4">
          <p className="text-sm text-foreground/70 mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold text-accent">${totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'all'
              ? 'bg-accent text-base'
              : 'bg-base border border-accent/20 text-foreground hover:bg-accent/10'
          )}
        >
          All Jobs
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filterStatus === status
                ? config.bgColor + ' ' + config.color + ' border-2 ' + config.borderColor
                : 'bg-base border border-accent/20 text-foreground hover:bg-accent/10'
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <p className="text-foreground/70 mb-4">
            {filterStatus === 'all' ? 'No jobs found.' : `No jobs with status "${statusConfig[filterStatus as keyof typeof statusConfig]?.label || filterStatus}".`}
          </p>
          <p className="text-sm text-foreground/50">
            Submit a quote request to see your jobs here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job) => {
            // Normalize status to handle any casing or whitespace issues
            const rawStatus = job.status || 'pending'
            const jobStatus = String(rawStatus).toLowerCase().trim()
            const status = statusConfig[jobStatus as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = status.icon
            
            // Check if invoice download should be available (use normalized status)
            const invoiceableStatuses = ['approved', 'outstanding', 'in_progress', 'paid']
            const canDownloadInvoice = invoiceableStatuses.includes(jobStatus)
            
            // Debug logging - always log to help diagnose issues
            console.log('Job Invoice Debug:', {
              jobId: job.id,
              rawStatus: rawStatus,
              normalizedStatus: jobStatus,
              canDownloadInvoice: canDownloadInvoice,
              invoiceableStatuses: invoiceableStatuses,
            })

            return (
              <div
                key={job.id}
                className={cn(
                  'bg-base border rounded-lg p-6',
                  status.borderColor
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-foreground">
                        Job #{job.id?.slice(0, 8) || 'N/A'}
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
                        {formatDate(job.dateRange.start)} - {formatDate(job.dateRange.end)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">
                      ${job.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-foreground/50 mt-1">Total Price</p>
                  </div>
                </div>

                {/* Jobs Details */}
                <div className="border-t border-accent/20 pt-4 mt-4 mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Job Details:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {job.jobs.map((jobItem) => (
                      <div
                        key={jobItem.id}
                        className="bg-foreground/5 border border-accent/10 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{jobItem.name}</p>
                            <p className="text-xs text-foreground/70 mt-1">{jobItem.description}</p>
                          </div>
                          <p className="text-sm font-bold text-accent ml-2">
                            ${jobItem.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Invoice Button - Show for approved, outstanding, in_progress, and paid */}
                {canDownloadInvoice ? (
                  <div className="flex justify-end pt-4 border-t border-accent/20">
                    <Button
                      onClick={() => handleDownloadInvoice(job)}
                      variant="primary"
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-end pt-4 border-t border-accent/20">
                    <p className="text-xs text-foreground/50 italic">
                      Invoice available for: Approved, Outstanding, In Progress, or Paid (Current: {status.label})
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}