'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Clock, Calendar, FileText, TrendingUp, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast-context'
import { clockIn, clockOut, getActiveTimeEntry, getTimeEntries } from '@/lib/firebase/timeTracking'
import { getPTORequests, createPTORequest } from '@/lib/firebase/ptoRequests'
import { getPaystubs } from '@/lib/firebase/paystubs'
import { PTORequest } from '@/lib/firebase/ptoRequests'
import { Paystub } from '@/lib/firebase/paystubs'
import { TimeEntry } from '@/lib/firebase/timeTracking'
import Link from 'next/link'
import { DatePicker } from '@/components/ui/date-picker'

export default function EmployeeDashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null)
  const [currentHours, setCurrentHours] = useState(0)
  const [ptoRequests, setPtoRequests] = useState<PTORequest[]>([])
  const [recentPaystubs, setRecentPaystubs] = useState<Paystub[]>([])
  const [showPTOForm, setShowPTOForm] = useState(false)
  const [ptoStartDate, setPtoStartDate] = useState('')
  const [ptoEndDate, setPtoEndDate] = useState('')
  const [ptoType, setPtoType] = useState<'vacation' | 'sick' | 'personal' | 'other'>('vacation')
  const [ptoReason, setPtoReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
      checkClockStatus()
      
      // Update current hours every minute if clocked in
      const interval = setInterval(() => {
        if (isClockedIn && activeTimeEntry) {
          updateCurrentHours()
        }
      }, 60000) // Every minute
      
      return () => clearInterval(interval)
    }
  }, [user, isClockedIn, activeTimeEntry])

  const loadDashboardData = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      const [ptoData, paystubsData] = await Promise.all([
        getPTORequests(user.id),
        getPaystubs(user.id),
      ])
      
      setPtoRequests(ptoData)
      setRecentPaystubs(paystubsData.slice(0, 3)) // Most recent 3
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      showToast('Failed to load dashboard data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const checkClockStatus = async () => {
    if (!user?.id) return
    
    try {
      const active = await getActiveTimeEntry(user.id)
      if (active) {
        setIsClockedIn(true)
        setActiveTimeEntry(active)
        updateCurrentHours()
      } else {
        setIsClockedIn(false)
        setActiveTimeEntry(null)
      }
    } catch (error: any) {
      console.error('Error checking clock status:', error)
    }
  }

  const updateCurrentHours = () => {
    if (!activeTimeEntry) return
    
    const clockInTime = activeTimeEntry.clockIn instanceof Date 
      ? activeTimeEntry.clockIn 
      : new Date(activeTimeEntry.clockIn)
    const now = new Date()
    const diffMs = now.getTime() - clockInTime.getTime()
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
    setCurrentHours(hours)
  }

  const handleClockIn = async () => {
    if (!user?.id) return
    
    try {
      const timeEntryId = await clockIn(user.id)
      showToast('Clocked in successfully', 'success')
      
      // Immediately update state with the new time entry
      const now = new Date()
      const newTimeEntry: TimeEntry = {
        id: timeEntryId,
        employeeId: user.id,
        clockIn: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
      
      setIsClockedIn(true)
      setActiveTimeEntry(newTimeEntry)
      setCurrentHours(0)
      
      // Also check status after a brief delay to ensure sync
      setTimeout(async () => {
        await checkClockStatus()
      }, 1000)
    } catch (error: any) {
      showToast(error.message || 'Failed to clock in', 'error')
    }
  }

  const handleClockOut = async () => {
    if (!activeTimeEntry?.id) return
    
    try {
      await clockOut(activeTimeEntry.id)
      showToast('Clocked out successfully', 'success')
      setIsClockedIn(false)
      setActiveTimeEntry(null)
      setCurrentHours(0)
    } catch (error: any) {
      showToast(error.message || 'Failed to clock out', 'error')
    }
  }

  const handleSubmitPTO = async () => {
    if (!user?.id || !ptoStartDate || !ptoEndDate) {
      showToast('Please select start and end dates', 'error')
      return
    }
    
    try {
      await createPTORequest(
        user.id,
        new Date(ptoStartDate),
        new Date(ptoEndDate),
        ptoType,
        ptoReason || undefined
      )
      showToast('PTO request submitted successfully', 'success')
      setShowPTOForm(false)
      setPtoStartDate('')
      setPtoEndDate('')
      setPtoReason('')
      await loadDashboardData()
    } catch (error: any) {
      showToast(error.message || 'Failed to submit PTO request', 'error')
    }
  }

  const getPTOStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400'
      case 'denied': return 'text-red-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-foreground/70'
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.name || 'Employee'}
        </h1>
        <p className="text-foreground/70">Manage your time, PTO, and view paystubs</p>
      </div>

      {/* Clock In/Out Section */}
      <div className="bg-base border border-accent/20 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Time Tracking</h2>
          </div>
          {isClockedIn && (
            <div className="text-sm text-foreground/70">
              <span className="text-green-400 font-semibold">●</span> Clocked In
            </div>
          )}
        </div>
        
        {isClockedIn ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Current Session</p>
                <p className="text-2xl font-bold text-foreground">{currentHours.toFixed(2)} hours</p>
              </div>
              <Button
                variant="primary"
                onClick={handleClockOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Clock Out
              </Button>
            </div>
            {activeTimeEntry && (
              <p className="text-xs text-foreground/50">
                Clocked in at {activeTimeEntry.clockIn instanceof Date 
                  ? activeTimeEntry.clockIn.toLocaleTimeString()
                  : new Date(activeTimeEntry.clockIn).toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70 mb-1">Ready to start your day?</p>
              <p className="text-lg font-semibold text-foreground">Click below to clock in</p>
            </div>
            <Button
              variant="primary"
              onClick={handleClockIn}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Clock In
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PTO Requests Section */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">PTO Requests</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPTOForm(!showPTOForm)}
            >
              {showPTOForm ? 'Cancel' : 'Request PTO'}
            </Button>
          </div>

          {showPTOForm && (
            <div className="mb-4 p-4 bg-foreground/5 rounded-lg space-y-3">
              <div>
                <label className="text-sm text-foreground/70 mb-1 block">Start Date</label>
                <DatePicker
                  date={ptoStartDate}
                  onDateChange={setPtoStartDate}
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70 mb-1 block">End Date</label>
                <DatePicker
                  date={ptoEndDate}
                  onDateChange={setPtoEndDate}
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70 mb-1 block">Type</label>
                <select
                  value={ptoType}
                  onChange={(e) => setPtoType(e.target.value as any)}
                  className="w-full p-2 bg-base border border-accent/20 rounded text-foreground"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-foreground/70 mb-1 block">Reason (Optional)</label>
                <textarea
                  value={ptoReason}
                  onChange={(e) => setPtoReason(e.target.value)}
                  className="w-full p-2 bg-base border border-accent/20 rounded text-foreground"
                  rows={2}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSubmitPTO}
                className="w-full"
              >
                Submit Request
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {ptoRequests.length > 0 ? (
              ptoRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-foreground/5 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {request.startDate instanceof Date
                        ? request.startDate.toLocaleDateString()
                        : new Date(request.startDate).toLocaleDateString()}{' '}
                      -{' '}
                      {request.endDate instanceof Date
                        ? request.endDate.toLocaleDateString()
                        : new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-foreground/70 capitalize">{request.type}</p>
                  </div>
                  <span className={`text-sm font-semibold capitalize ${getPTOStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/70 text-center py-4">No PTO requests</p>
            )}
          </div>
        </div>

        {/* Paystubs Section */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Recent Paystubs</h2>
            </div>
          </div>

          <div className="space-y-2">
            {recentPaystubs.length > 0 ? (
              recentPaystubs.map((paystub) => (
                <Link
                  key={paystub.id}
                  href={`/employee/paystubs/${paystub.id}`}
                  className="block p-3 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {paystub.payPeriodStart instanceof Date
                          ? paystub.payPeriodStart.toLocaleDateString()
                          : new Date(paystub.payPeriodStart).toLocaleDateString()}{' '}
                        -{' '}
                        {paystub.payPeriodEnd instanceof Date
                          ? paystub.payPeriodEnd.toLocaleDateString()
                          : new Date(paystub.payPeriodEnd).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-foreground/70 capitalize">{paystub.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${paystub.netPay.toLocaleString()}
                      </p>
                      <p className="text-xs text-foreground/70">Net Pay</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-foreground/70 text-center py-4">No paystubs available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

