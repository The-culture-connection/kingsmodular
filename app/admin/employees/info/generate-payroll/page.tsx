'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calculator, ArrowLeft, DollarSign, Users, Clock, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/lib/toast-context'
import { getAllEmployees, Employee } from '@/lib/firebase/employees'
import { generatePaystub, getPaystubs, Paystub } from '@/lib/firebase/paystubs'
import { getTimeEntries } from '@/lib/firebase/timeTracking'
import { cn } from '@/lib/utils'

interface EmployeePayrollPreview {
  employee: Employee
  regularHours: number
  overtimeHours: number
  mileagePay: number
  bonus: number
  grossPay: number
  netPay: number
  hasTimeEntries: boolean
}

export default function GeneratePayrollPage() {
  const { showToast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [payPeriodStart, setPayPeriodStart] = useState('')
  const [payPeriodEnd, setPayPeriodEnd] = useState('')
  const [employeeBonuses, setEmployeeBonuses] = useState<Record<string, number>>({})
  const [previewData, setPreviewData] = useState<EmployeePayrollPreview[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const employeesData = await getAllEmployees()
      setEmployees(employeesData)
      setSelectedEmployees(employeesData.map(emp => emp.uid))
    } catch (error: any) {
      console.error('Error loading employees:', error)
      showToast('Failed to load employees', 'error')
    }
  }

  const handlePreviewPayroll = async () => {
    if (!payPeriodStart || !payPeriodEnd) {
      showToast('Please select pay period dates', 'error')
      return
    }

    setIsLoadingPreview(true)
    try {
      const startDate = new Date(payPeriodStart)
      const endDate = new Date(payPeriodEnd)
      endDate.setHours(23, 59, 59, 999)

      const preview: EmployeePayrollPreview[] = []

      for (const employeeId of selectedEmployees) {
        const employee = employees.find(emp => emp.uid === employeeId)
        if (!employee) continue

        // Get time entries for the period
        const timeEntries = await getTimeEntries(employeeId, startDate, endDate)
        console.log(`📊 [PAYROLL_PREVIEW] Employee ${employee.name} (${employeeId}):`, {
          totalEntries: timeEntries.length,
          entries: timeEntries.map(e => ({
            id: e.id,
            status: e.status,
            totalHours: e.totalHours,
            clockIn: e.clockIn,
            clockOut: e.clockOut,
          })),
        })
        
        const approvedEntries = timeEntries.filter(e => e.status === 'approved')
        const pendingEntries = timeEntries.filter(e => e.status === 'pending_approval')
        console.log(`📊 [PAYROLL_PREVIEW] Approved entries:`, approvedEntries.length)
        console.log(`📊 [PAYROLL_PREVIEW] Pending entries:`, pendingEntries.length)

        if (approvedEntries.length === 0) {
          if (pendingEntries.length > 0) {
            console.log(`📊 [PAYROLL_PREVIEW] ⚠️ ${pendingEntries.length} pending entries need approval for ${employee.name}`)
          } else {
            console.log(`📊 [PAYROLL_PREVIEW] No time entries for ${employee.name}`)
          }
          preview.push({
            employee,
            regularHours: 0,
            overtimeHours: 0,
            mileagePay: 0,
            bonus: employeeBonuses[employeeId] || 0,
            grossPay: employeeBonuses[employeeId] || 0,
            netPay: employeeBonuses[employeeId] || 0,
            hasTimeEntries: false,
          })
          continue
        }

        // Calculate weekly hours for overtime
        const weeklyHours = calculateWeeklyHours(approvedEntries)
        let totalRegularHours = 0
        let totalOvertimeHours = 0

        weeklyHours.forEach(week => {
          totalRegularHours += week.regularHours
          totalOvertimeHours += week.overtimeHours
        })

        // Calculate mileage (simplified - would need to check jobs)
        const mileagePay = 0 // TODO: Calculate from job mileage payroll

        const hourlyRate = employee.hourlyRate || 0
        const overtimeRate = hourlyRate * 1.5
        const regularPay = totalRegularHours * hourlyRate
        const overtimePay = totalOvertimeHours * overtimeRate
        const bonus = employeeBonuses[employeeId] || 0
        const grossPay = regularPay + overtimePay + mileagePay + bonus
        const netPay = grossPay * 0.85 // 15% tax placeholder

        preview.push({
          employee,
          regularHours: totalRegularHours,
          overtimeHours: totalOvertimeHours,
          mileagePay,
          bonus,
          grossPay,
          netPay,
          hasTimeEntries: true,
        })
      }

      setPreviewData(preview)
      setShowPreview(true)
    } catch (error: any) {
      console.error('Error previewing payroll:', error)
      showToast('Failed to preview payroll', 'error')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const calculateWeeklyHours = (entries: any[]) => {
    const weeklyMap = new Map<string, { regularHours: number; overtimeHours: number; totalHours: number }>()
    
    entries.forEach(entry => {
      if (!entry.totalHours) return
      
      const date = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn)
      const weekStart = getWeekStart(date)
      const weekKey = weekStart.toISOString()
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { regularHours: 0, overtimeHours: 0, totalHours: 0 })
      }
      
      const week = weeklyMap.get(weekKey)!
      week.totalHours += entry.totalHours
      
      if (week.totalHours > 40) {
        week.regularHours = 40
        week.overtimeHours = week.totalHours - 40
      } else {
        week.regularHours = week.totalHours
        week.overtimeHours = 0
      }
    })
    
    return Array.from(weeklyMap.values())
  }

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const handleGeneratePayroll = async () => {
    if (!payPeriodStart || !payPeriodEnd) {
      showToast('Please select pay period dates', 'error')
      return
    }

    if (selectedEmployees.length === 0) {
      showToast('Please select at least one employee', 'error')
      return
    }

    setIsGenerating(true)
    try {
      const startDate = new Date(payPeriodStart)
      const endDate = new Date(payPeriodEnd)
      endDate.setHours(23, 59, 59, 999)

      const generatedPaystubs: Paystub[] = []

      for (const employeeId of selectedEmployees) {
        const employee = employees.find(emp => emp.uid === employeeId)
        if (!employee) continue

        const bonus = employeeBonuses[employeeId] || 0
        const paystub = await generatePaystub(
          employeeId,
          employee.name,
          employee.hourlyRate || 0,
          startDate,
          endDate,
          bonus
        )
        generatedPaystubs.push(paystub)
      }

      showToast(`Successfully generated ${generatedPaystubs.length} paystubs`, 'success')
      setShowPreview(false)
      // Reset form
      setPayPeriodStart('')
      setPayPeriodEnd('')
      setEmployeeBonuses({})
    } catch (error: any) {
      console.error('Error generating payroll:', error)
      showToast(error.message || 'Failed to generate payroll', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const totalGrossPay = previewData.reduce((sum, emp) => sum + emp.grossPay, 0)
  const totalNetPay = previewData.reduce((sum, emp) => sum + emp.netPay, 0)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/suites/employee" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employee Suite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-accent" />
          Generate Payroll
        </h1>
        <p className="text-foreground/70">Generate payroll for employees based on hours, mileage, and bonuses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-base border border-accent/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Payroll Period</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">Start Date</label>
                <DatePicker
                  date={payPeriodStart}
                  onDateChange={setPayPeriodStart}
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70 mb-2 block">End Date</label>
                <DatePicker
                  date={payPeriodEnd}
                  onDateChange={setPayPeriodEnd}
                />
              </div>
            </div>
          </div>

          <div className="bg-base border border-accent/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Select Employees</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {employees.map(employee => (
                <label
                  key={employee.uid}
                  className="flex items-center gap-3 p-2 rounded hover:bg-foreground/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.uid)}
                    onChange={() => toggleEmployee(employee.uid)}
                    className="rounded border-accent/30 bg-base text-accent"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{employee.name}</p>
                    <p className="text-xs text-foreground/70">${employee.hourlyRate || 0}/hr</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePreviewPayroll}
              disabled={isLoadingPreview || !payPeriodStart || !payPeriodEnd}
              className="flex-1"
            >
              {isLoadingPreview ? 'Loading...' : 'Preview'}
            </Button>
            <Button
              variant="primary"
              onClick={handleGeneratePayroll}
              disabled={isGenerating || !showPreview}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Preview/Results Panel */}
        <div className="lg:col-span-2">
          {showPreview ? (
            <div className="bg-base border border-accent/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Payroll Preview</h2>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-foreground/70">Total Gross</p>
                    <p className="text-lg font-bold text-foreground">${totalGrossPay.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground/70">Total Net</p>
                    <p className="text-lg font-bold text-accent">${totalNetPay.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {previewData.map((preview) => (
                  <div
                    key={preview.employee.uid}
                    className={cn(
                      "border rounded-lg p-4",
                      preview.hasTimeEntries ? "border-accent/20" : "border-amber-500/20 bg-amber-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{preview.employee.name}</h3>
                        <p className="text-sm text-foreground/70">${preview.employee.hourlyRate || 0}/hr</p>
                      </div>
                      {!preview.hasTimeEntries && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-400" />
                          <Link href="/admin/employees/info/hours">
                            <Button variant="outline" size="sm" className="text-xs">
                              Approve Hours
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-foreground/70 mb-1">Regular Hours</p>
                        <p className="font-semibold text-foreground">{preview.regularHours.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70 mb-1">Overtime Hours</p>
                        <p className="font-semibold text-foreground">{preview.overtimeHours.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70 mb-1">Mileage</p>
                        <p className="font-semibold text-foreground">${preview.mileagePay.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-foreground/70 mb-1">Bonus</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={employeeBonuses[preview.employee.uid] || 0}
                            onChange={(e) => setEmployeeBonuses(prev => ({
                              ...prev,
                              [preview.employee.uid]: parseFloat(e.target.value) || 0
                            }))}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-foreground/70">Gross Pay</p>
                        <p className="text-lg font-bold text-foreground">${preview.grossPay.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-foreground/70">Net Pay</p>
                        <p className="text-lg font-bold text-accent">${preview.netPay.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-base border border-accent/20 rounded-lg p-12 text-center">
              <Calculator className="h-12 w-12 text-accent/50 mx-auto mb-4" />
              <p className="text-foreground/70">Configure payroll period and click Preview to see payroll breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

