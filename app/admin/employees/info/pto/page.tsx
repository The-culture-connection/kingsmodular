'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, ArrowLeft, CheckCircle2, XCircle, Clock, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast-context'
import { getPendingPTORequests, getPTORequests, reviewPTORequest, PTORequest } from '@/lib/firebase/ptoRequests'
import { getAllEmployees, Employee } from '@/lib/firebase/employees'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export default function EmployeePTOPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [pendingRequests, setPendingRequests] = useState<PTORequest[]>([])
  const [allRequests, setAllRequests] = useState<PTORequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [pendingData, allData, employeesData] = await Promise.all([
        getPendingPTORequests(),
        getPTORequests(),
        getAllEmployees(),
      ])
      
      setPendingRequests(pendingData)
      setAllRequests(allData)
      setEmployees(employeesData)
    } catch (error: any) {
      console.error('Error loading PTO requests:', error)
      showToast('Failed to load PTO requests', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewRequest = async (requestId: string, approved: boolean, notes?: string) => {
    if (!user?.id) {
      showToast('User not authenticated', 'error')
      return
    }

    setReviewingId(requestId)
    try {
      await reviewPTORequest(requestId, approved, user.id, notes)
      showToast(`PTO request ${approved ? 'approved' : 'denied'} successfully`, 'success')
      await loadData()
    } catch (error: any) {
      console.error('Error reviewing PTO request:', error)
      showToast(error.message || 'Failed to review request', 'error')
    } finally {
      setReviewingId(null)
    }
  }

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.uid === employeeId)
    return employee?.name || employeeId
  }

  const getPTOTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-500/20 text-blue-400'
      case 'sick': return 'bg-red-500/20 text-red-400'
      case 'personal': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400'
      case 'denied': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-foreground/70'
    }
  }

  const calculateDays = (startDate: Date, endDate: Date): number => {
    let count = 0
    const current = new Date(startDate)
    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    return count
  }

  const requestsToShow = filter === 'pending' ? pendingRequests : allRequests

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/suites/employee" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employee Suite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-accent" />
          PTO Requests
        </h1>
        <p className="text-foreground/70">Review and manage employee time off requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-accent/20">
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            "px-4 py-2 font-medium text-sm transition-colors",
            filter === 'pending'
              ? "text-accent border-b-2 border-accent"
              : "text-foreground/70 hover:text-foreground"
          )}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 font-medium text-sm transition-colors",
            filter === 'all'
              ? "text-accent border-b-2 border-accent"
              : "text-foreground/70 hover:text-foreground"
          )}
        >
          All Requests
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <Clock className="h-8 w-8 text-accent/50 mx-auto mb-4 animate-spin" />
          <p className="text-foreground/70">Loading PTO requests...</p>
        </div>
      ) : requestsToShow.length === 0 ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <Calendar className="h-12 w-12 text-accent/50 mx-auto mb-4" />
          <p className="text-foreground/70">No {filter === 'pending' ? 'pending' : ''} PTO requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requestsToShow.map((request) => {
            const startDate = request.startDate instanceof Date 
              ? request.startDate 
              : new Date(request.startDate)
            const endDate = request.endDate instanceof Date 
              ? request.endDate 
              : new Date(request.endDate)
            const days = calculateDays(startDate, endDate)
            const isPending = request.status === 'pending'

            return (
              <div
                key={request.id}
                className={cn(
                  "bg-base border rounded-lg p-6",
                  isPending ? "border-accent/20" : "border-accent/10"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {getEmployeeName(request.employeeId)}
                      </h3>
                      <p className="text-sm text-foreground/70">
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium capitalize", getPTOTypeColor(request.type))}>
                      {request.type}
                    </span>
                    <span className={cn("px-2 py-1 rounded text-xs font-semibold capitalize", getStatusColor(request.status))}>
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-foreground/70" />
                    <span className="text-sm text-foreground/70">
                      {days} business day{days !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {request.reason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-foreground/70">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    </div>
                  )}
                </div>

                {request.reviewedBy && (
                  <div className="mb-4 p-3 bg-foreground/5 rounded-lg">
                    <p className="text-xs text-foreground/70 mb-1">
                      Reviewed by {getEmployeeName(request.reviewedBy)} on{' '}
                      {request.reviewedAt instanceof Date
                        ? request.reviewedAt.toLocaleDateString()
                        : new Date(request.reviewedAt).toLocaleDateString()}
                    </p>
                    {request.reviewNotes && (
                      <p className="text-sm text-foreground/70">{request.reviewNotes}</p>
                    )}
                  </div>
                )}

                {isPending && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => handleReviewRequest(request.id!, true)}
                      disabled={reviewingId === request.id}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const notes = prompt('Enter denial reason (optional):')
                        handleReviewRequest(request.id!, false, notes || undefined)
                      }}
                      disabled={reviewingId === request.id}
                      className="flex items-center gap-2 text-red-400 border-red-400/20 hover:bg-red-400/10"
                    >
                      <XCircle className="h-4 w-4" />
                      Deny
                    </Button>
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

