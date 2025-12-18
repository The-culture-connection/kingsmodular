'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, MapPin, CheckCircle2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { getCustomerApprovedEstimates, PendingEstimate } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'

export default function CustomerInvoicesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [approvedEstimates, setApprovedEstimates] = useState<PendingEstimate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadApprovedEstimates()
    }
  }, [user])

  const loadApprovedEstimates = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const estimates = await getCustomerApprovedEstimates(user.id)
      setApprovedEstimates(estimates)
    } catch (error: any) {
      showToast(error.message || 'Failed to load invoices', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const totalOutstanding = approvedEstimates.reduce((sum, estimate) => sum + estimate.totalPrice, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDownloadInvoice = (estimate: PendingEstimate) => {
    // TODO: Implement actual invoice generation and download
    // For now, create a simple text invoice
    const invoiceContent = `
INVOICE
${estimate.id?.slice(0, 8).toUpperCase() || 'N/A'}

Customer: ${estimate.customerCompanyName || estimate.customerEmail}
Date: ${formatDate(estimate.dateRange.start)} - ${formatDate(estimate.dateRange.end)}
Location: ${estimate.location}

JOBS:
${estimate.jobs.map((job, index) => `${index + 1}. ${job.name} - $${job.price.toLocaleString()}`).join('\n')}

TOTAL: $${estimate.totalPrice.toLocaleString()}

Status: ${estimate.status.toUpperCase()}
    `.trim()

    const blob = new Blob([invoiceContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${estimate.id?.slice(0, 8) || 'invoice'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('Invoice downloaded', 'success')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground/70">Loading invoices...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Outstanding Balance</h1>
        <p className="text-foreground/70">View approved estimates and download invoices</p>
      </div>

      {/* Total Outstanding Balance */}
      <div className="bg-base border border-accent/20 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Total Outstanding Balance</h2>
            <p className="text-3xl font-bold text-accent">${totalOutstanding.toLocaleString()}</p>
          </div>
          <DollarSign className="h-16 w-16 text-accent/20" />
        </div>
      </div>

      {/* Approved Estimates/Invoices */}
      {approvedEstimates.length === 0 ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <p className="text-foreground/70 mb-4">No outstanding invoices.</p>
          <p className="text-sm text-foreground/50">
            Approved estimates will appear here as invoices.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Approved Estimates</h2>
          <div className="grid grid-cols-1 gap-6">
            {approvedEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="bg-base border border-accent/20 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        Estimate #{estimate.id?.slice(0, 8) || 'N/A'}
                      </h3>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-400/20 text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Approved
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70 mb-4">
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
                    <p className="text-xs text-foreground/50 mt-1">Total Amount</p>
                  </div>
                </div>

                {/* Jobs Details */}
                <div className="border-t border-accent/20 pt-4 mt-4 mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Job Details:</h4>
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

                {/* Download Invoice Button */}
                <div className="flex justify-end pt-4 border-t border-accent/20">
                  <Button
                    onClick={() => handleDownloadInvoice(estimate)}
                    variant="primary"
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}