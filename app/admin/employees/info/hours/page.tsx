'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, ArrowLeft, CheckCircle2, XCircle, User, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast-context'
import { useAuth } from '@/lib/auth-context'
import { getTimeEntries, approveTimeEntry, TimeEntry } from '@/lib/firebase/timeTracking'
import { getAllEmployees, Employee } from '@/lib/firebase/employees'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'

export default function EmployeeHoursPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  useEffect(() => {
    loadEmployees()
    loadTimeEntries()
  }, [filter, selectedEmployee, startDate, endDate])

  const loadEmployees = async () => {
    try {
      const employeesData = await getAllEmployees()
      setEmployees(employeesData)
    } catch (error: any) {
      console.error('Error loading employees:', error)
    }
  }

  const loadTimeEntries = async () => {
    try {
      setIsLoading(true)
      let allEntries: TimeEntry[] = []

      if (selectedEmployee === 'all') {
        // Get entries for all employees
        for (const employee of employees) {
          const entries = await getTimeEntriesForEmployee(employee.uid)
          allEntries.push(...entries)
        }
      } else {
        allEntries = await getTimeEntriesForEmployee(selectedEmployee)
      }

      // Filter by status
      if (filter !== 'all') {
        allEntries = allEntries.filter(entry => entry.status === filter)
      }

      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        allEntries = allEntries.filter(entry => {
          const entryTime = entry.clockIn instanceof Date 
            ? entry.clockIn.getTime() 
            : new Date(entry.clockIn).getTime()
          return entryTime >= start && entryTime <= end
        })
      }

      // Sort by clockIn date descending
      allEntries.sort((a, b) => {
        const aTime = a.clockIn instanceof Date ? a.clockIn.getTime() : new Date(a.clockIn).getTime()
        const bTime = b.clockIn instanceof Date ? b.clockIn.getTime() : new Date(b.clockIn).getTime()
        return bTime - aTime
      })

      setTimeEntries(allEntries)
    } catch (error: any) {
      console.error('Error loading time entries:', error)
      showToast('Failed to load time entries', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeEntriesForEmployee = async (employeeId: string): Promise<TimeEntry[]> => {
    try {
      // Get entries from last 90 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)
      
      return await getTimeEntries(employeeId, startDate, endDate)
    } catch (error: any) {
      console.error(`Error getting entries for employee ${employeeId}:`, error)
      return []
    }
  }

  const handleApproveEntry = async (entryId: string, approved: boolean, notes?: string) => {
    if (!user?.id) {
      showToast('User not authenticated', 'error')
      return
    }

    setReviewingId(entryId)
    try {
      await approveTimeEntry(entryId, approved, user.id, notes)
      showToast(`Time entry ${approved ? 'approved' : 'rejected'} successfully`, 'success')
      await loadTimeEntries()
    } catch (error: any) {
      console.error('Error approving time entry:', error)
      showToast(error.message || 'Failed to approve entry', 'error')
    } finally {
      setReviewingId(null)
    }
  }

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp.uid === employeeId)
    return employee?.name || employeeId
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/20'
      case 'rejected': return 'text-red-400 bg-red-500/20'
      case 'pending_approval': return 'text-yellow-400 bg-yellow-500/20'
      case 'active': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-foreground/70 bg-foreground/10'
    }
  }

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const pendingCount = timeEntries.filter(e => e.status === 'pending_approval').length

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/suites/employee" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employee Suite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Clock className="h-8 w-8 text-accent" />
          Employee Hours
        </h1>
        <p className="text-foreground/70">Review and approve employee time entries</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2 border-b border-accent/20">
            <button
              onClick={() => setFilter('pending')}
              className={cn(
                "px-4 py-2 font-medium text-sm transition-colors",
                filter === 'pending'
                  ? "text-accent border-b-2 border-accent"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={cn(
                "px-4 py-2 font-medium text-sm transition-colors",
                filter === 'approved'
                  ? "text-accent border-b-2 border-accent"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              Approved
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
              All
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-foreground/70 mb-2 block">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-2 bg-base border border-accent/20 rounded text-foreground"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.uid} value={emp.uid}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-foreground/70 mb-2 block">Start Date</label>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-foreground/70 mb-2 block">End Date</label>
            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
            />
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      {isLoading ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <Clock className="h-8 w-8 text-accent/50 mx-auto mb-4 animate-spin" />
          <p className="text-foreground/70">Loading time entries...</p>
        </div>
      ) : timeEntries.length === 0 ? (
        <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
          <Clock className="h-12 w-12 text-accent/50 mx-auto mb-4" />
          <p className="text-foreground/70">No time entries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {timeEntries.map((entry) => {
            const clockInTime = entry.clockIn instanceof Date 
              ? entry.clockIn 
              : new Date(entry.clockIn)
            const clockOutTime = entry.clockOut 
              ? (entry.clockOut instanceof Date ? entry.clockOut : new Date(entry.clockOut))
              : null
            const isPending = entry.status === 'pending_approval'
            const isActive = entry.status === 'active'

            return (
              <div
                key={entry.id}
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
                        {getEmployeeName(entry.employeeId)}
                      </h3>
                      <p className="text-sm text-foreground/70">
                        {clockInTime.toLocaleDateString()} {clockInTime.toLocaleTimeString()}
                        {clockOutTime && ` - ${clockOutTime.toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                  <span className={cn("px-3 py-1 rounded text-xs font-semibold capitalize", getStatusColor(entry.status))}>
                    {entry.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-foreground/70 mb-1">Clock In</p>
                    <p className="text-sm font-medium text-foreground">
                      {clockInTime.toLocaleTimeString()}
                    </p>
                  </div>
                  {clockOutTime ? (
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Clock Out</p>
                      <p className="text-sm font-medium text-foreground">
                        {clockOutTime.toLocaleTimeString()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Status</p>
                      <p className="text-sm font-medium text-blue-400">Currently Clocked In</p>
                    </div>
                  )}
                  {entry.totalHours !== undefined && (
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Total Hours</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatDuration(entry.totalHours)}
                      </p>
                    </div>
                  )}
                  {entry.breakDuration !== undefined && entry.breakDuration > 0 && (
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Break</p>
                      <p className="text-sm font-medium text-foreground">
                        {entry.breakDuration} min
                      </p>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <div className="mb-4 p-3 bg-foreground/5 rounded-lg">
                    <p className="text-xs text-foreground/70 mb-1">Notes</p>
                    <p className="text-sm text-foreground/70">{entry.notes}</p>
                  </div>
                )}

                {entry.jobName && (
                  <div className="mb-4">
                    <p className="text-xs text-foreground/70 mb-1">Job</p>
                    <p className="text-sm text-foreground">{entry.jobName}</p>
                  </div>
                )}

                {isPending && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => handleApproveEntry(entry.id!, true)}
                      disabled={reviewingId === entry.id}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const notes = prompt('Enter rejection reason (optional):')
                        handleApproveEntry(entry.id!, false, notes || undefined)
                      }}
                      disabled={reviewingId === entry.id}
                      className="flex items-center gap-2 text-red-400 border-red-400/20 hover:bg-red-400/10"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {entry.approvedBy && (
                  <div className="mt-4 pt-4 border-t border-accent/10">
                    <p className="text-xs text-foreground/70">
                      {entry.status === 'approved' ? 'Approved' : 'Rejected'} by {getEmployeeName(entry.approvedBy)} on{' '}
                      {entry.approvedAt instanceof Date
                        ? entry.approvedAt.toLocaleDateString()
                        : new Date(entry.approvedAt).toLocaleDateString()}
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

