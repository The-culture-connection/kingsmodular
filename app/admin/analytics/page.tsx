'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  Calendar,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { getRevenueAnalytics, computeAnalyticsSummary, JobAnalyticsRow, AnalyticsFilters } from '@/lib/firebase/analytics'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { StatusSelect } from '@/components/ui/status-select'
import { cn } from '@/lib/utils'
import { getStatusDisplayLabel } from '@/lib/utils/status'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { useRouter } from 'next/navigation'

// Financial Snapshot Card Component
interface StatCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

function StatCard({ title, value, trend, icon, onClick, variant = 'default' }: StatCardProps) {
  const trendColor = trend && trend.value >= 0 ? 'text-green-400' : 'text-red-400'
  const TrendIcon = trend && trend.value >= 0 ? ArrowUpRight : ArrowDownRight
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-foreground/5 border border-accent/20 rounded-lg p-4 cursor-pointer transition-all hover:bg-foreground/10 hover:border-accent/40",
        onClick && "hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-accent">{icon}</div>}
          <span className="text-sm text-foreground/70">{title}</span>
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">
        {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
      </div>
      {trend && (
        <div className="text-xs text-foreground/50 mt-1">{trend.label}</div>
      )}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [analyticsRows, setAnalyticsRows] = useState<JobAnalyticsRow[]>([])
  const [allAnalyticsRows, setAllAnalyticsRows] = useState<JobAnalyticsRow[]>([]) // For trend calculations
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
  }, [])

  // Reload when filters change
  useEffect(() => {
    loadAnalytics()
  }, [dateRange, customStartDate, customEndDate, statusFilter])

  const loadAnalytics = async () => {
    const logPrefix = '🟢 [ANALYTICS_PAGE]'
    try {
      console.log(`${logPrefix} ========================================`)
      console.log(`${logPrefix} Starting loadAnalytics`)
      console.log(`${logPrefix} Current filters:`, {
        dateRange,
        customStartDate,
        customEndDate,
        statusFilter,
      })
      
      setIsLoading(true)
      
      // Build filters
      const { start, end } = getDateRange()
      console.log(`${logPrefix} Date range calculated:`, {
        start: start?.toISOString() || 'undefined (no filter)',
        end: end?.toISOString() || 'undefined (no filter)',
        dateRange,
      })
      
      const filters: AnalyticsFilters = {
        dateRangeStart: start,
        dateRangeEnd: end,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
      }
      
      console.log(`${logPrefix} Fetching current period data with filters:`, filters)
      
      // Fetch current period data
      const currentRows = await getRevenueAnalytics(filters)
      console.log(`${logPrefix} ✅ Current period data received:`, {
        rowCount: currentRows.length,
        sampleRows: currentRows.slice(0, 3).map(r => ({
          jobName: r.jobName,
          revenue: r.revenue,
          profit: r.profit,
        })),
      })
      setAnalyticsRows(currentRows)
      
      console.log(`${logPrefix} Fetching all data for trend calculations...`)
      // Fetch all data for trend calculations (previous period comparison)
      const allRows = await getRevenueAnalytics({})
      console.log(`${logPrefix} ✅ All data received:`, {
        rowCount: allRows.length,
      })
      setAllAnalyticsRows(allRows)
      
      console.log(`${logPrefix} ✅ loadAnalytics complete`)
      console.log(`${logPrefix} ========================================`)
    } catch (error: any) {
      console.error(`${logPrefix} ========================================`)
      console.error(`${logPrefix} ❌ ERROR in loadAnalytics`)
      console.error(`${logPrefix} Error:`, error)
      console.error(`${logPrefix} Error message:`, error?.message)
      console.error(`${logPrefix} Error stack:`, error?.stack)
      console.error(`${logPrefix} ========================================`)
      setError(error?.message || 'Failed to load analytics data')
    } finally {
      setIsLoading(false)
      console.log(`${logPrefix} isLoading set to false`)
    }
  }

  // Calculate date range based on filter
  const getDateRange = (): { start?: Date, end?: Date } => {
    // If 'all' is selected and no custom dates, return undefined (no date filtering)
    if (dateRange === 'all' && !customStartDate && !customEndDate) {
      return { start: undefined, end: undefined }
    }

    const now = new Date()
    let start: Date
    let end: Date = new Date(now)
    end.setHours(23, 59, 59, 999) // End of day

    switch (dateRange) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'all':
        // For 'all', use a very wide range if custom dates aren't set
        start = new Date(0) // Beginning of time
        end = new Date(8640000000000000) // Far future (max safe date)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
    }

    // Override with custom dates if set
    if (customStartDate) {
      start = new Date(customStartDate)
      start.setHours(0, 0, 0, 0)
    }
    if (customEndDate) {
      end = new Date(customEndDate)
      end.setHours(23, 59, 59, 999)
    }

    return { start, end }
  }

  // Use analyticsRows directly (already filtered by getRevenueAnalytics)
  const filteredRows = analyticsRows

  // Calculate financial snapshot using analytics summary
  const financialSnapshot = useMemo(() => {
    const currentSummary = computeAnalyticsSummary(filteredRows)
    const { start: currentStart } = getDateRange()
    
    // If no date range (showing all), don't calculate trends
    if (!currentStart) {
      return {
        totalRevenue: currentSummary.totalRevenue,
        totalCost: currentSummary.totalCost,
        grossProfit: currentSummary.totalProfit,
        profitMargin: currentSummary.profitMargin,
        outstandingInvoices: currentSummary.outstandingInvoices,
        totalOutstanding: currentSummary.totalOutstanding,
        trends: {
          revenue: { value: 0, label: 'N/A' },
          cost: { value: 0, label: 'N/A' },
          profit: { value: 0, label: 'N/A' },
          margin: { value: 0, label: 'N/A' },
        },
      }
    }
    
    // Calculate previous period for comparison
    const previousStart = new Date(currentStart)
    const periodLength = currentStart.getTime() - (() => {
      switch (dateRange) {
        case 'month':
          return new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1).getTime()
        case 'quarter':
          return new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1).getTime()
        case 'year':
          return new Date(currentStart.getFullYear() - 1, 0, 1).getTime()
        default:
          return currentStart.getTime()
      }
    })()
    
    const previousEnd = new Date(currentStart.getTime() - 1)
    const previousStartDate = new Date(previousEnd.getTime() - periodLength)
    
    // Filter previous period from all rows
    const previousPeriod = allAnalyticsRows.filter(row => {
      if (!row.startDateTs) return false
      return row.startDateTs >= previousStartDate && row.startDateTs <= previousEnd
    })
    
    const previousSummary = computeAnalyticsSummary(previousPeriod)

    // Calculate trends
    const revenueTrend = previousSummary.totalRevenue > 0 
      ? ((currentSummary.totalRevenue - previousSummary.totalRevenue) / previousSummary.totalRevenue) * 100 
      : 0
    const costTrend = previousSummary.totalCost > 0 
      ? ((currentSummary.totalCost - previousSummary.totalCost) / previousSummary.totalCost) * 100 
      : 0
    const profitTrend = previousSummary.totalProfit !== 0 
      ? ((currentSummary.totalProfit - previousSummary.totalProfit) / Math.abs(previousSummary.totalProfit)) * 100 
      : 0
    const marginTrend = previousSummary.profitMargin !== 0 
      ? ((currentSummary.profitMargin - previousSummary.profitMargin) / Math.abs(previousSummary.profitMargin)) * 100 
      : 0

    return {
      totalRevenue: currentSummary.totalRevenue,
      totalCost: currentSummary.totalCost,
      grossProfit: currentSummary.totalProfit,
      profitMargin: currentSummary.profitMargin,
      outstandingInvoices: currentSummary.outstandingInvoices,
      totalOutstanding: currentSummary.totalOutstanding,
      trends: {
        revenue: { value: revenueTrend, label: 'vs last period' },
        cost: { value: costTrend, label: 'vs last period' },
        profit: { value: profitTrend, label: 'vs last period' },
        margin: { value: marginTrend, label: 'vs last period' },
      }
    }
  }, [filteredRows, allAnalyticsRows, dateRange])

  // Prepare chart data (group by monthKey)
  const chartData = useMemo(() => {
    const grouped: { [key: string]: { revenue: number; cost: number; profit: number; date: string } } = {}
    
    filteredRows.forEach(row => {
      // Use monthKey if available, otherwise generate from startDate
      const key = row.monthKey || (() => {
        if (row.startDateTs) {
          const date = row.startDateTs
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }
        return 'unknown'
      })()
      
      if (!grouped[key]) {
        grouped[key] = { revenue: 0, cost: 0, profit: 0, date: key }
      }
      
      grouped[key].revenue += row.revenue
      grouped[key].cost += row.costAllocatedTotal
      grouped[key].profit += row.profit
    })
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredRows])

  // Handle job row click - navigate to job suite (use parentId to open the job document)
  const handleJobClick = (parentId: string) => {
    router.push(`/admin/suites/job?jobId=${parentId}`)
  }

  // Debug: Log current state
  useEffect(() => {
    console.log('🟢 [ANALYTICS_PAGE] Component state:', {
      isLoading,
      analyticsRowsCount: analyticsRows.length,
      allAnalyticsRowsCount: allAnalyticsRows.length,
      filteredRowsCount: filteredRows.length,
      dateRange,
      statusFilter,
    })
    
    if (analyticsRows.length > 0) {
      console.log('🟢 [ANALYTICS_PAGE] Sample analytics rows:', analyticsRows.slice(0, 3))
    }
  }, [isLoading, analyticsRows, allAnalyticsRows, filteredRows, dateRange, statusFilter])

  if (isLoading) {
    console.log('🟢 [ANALYTICS_PAGE] Rendering loading state')
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground/70">Loading analytics...</div>
      </div>
    )
  }
  
  console.log('🟢 [ANALYTICS_PAGE] Rendering main content', {
    filteredRowsCount: filteredRows.length,
    financialSnapshot: financialSnapshot ? {
      totalRevenue: financialSnapshot.totalRevenue,
      totalCost: financialSnapshot.totalCost,
      grossProfit: financialSnapshot.grossProfit,
    } : null,
    chartDataCount: chartData.length,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Revenue Analytics</h1>
        <p className="text-foreground/70">Track revenue, costs, and profitability across your business</p>
      </div>

      {/* 1️⃣ Financial Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={financialSnapshot.totalRevenue}
          trend={financialSnapshot.trends.revenue}
          icon={<DollarSign className="h-5 w-5" />}
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          title="Total Costs"
          value={financialSnapshot.totalCost}
          trend={financialSnapshot.trends.cost}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Gross Profit"
          value={financialSnapshot.grossProfit}
          trend={financialSnapshot.trends.profit}
          icon={<TrendingUp className="h-5 w-5" />}
          variant={financialSnapshot.grossProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Profit Margin"
          value={`${financialSnapshot.profitMargin.toFixed(1)}%`}
          trend={financialSnapshot.trends.margin}
          icon={<BarChart3 className="h-5 w-5" />}
          variant={financialSnapshot.profitMargin >= 20 ? 'success' : financialSnapshot.profitMargin >= 10 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Outstanding Invoices"
          value={financialSnapshot.totalOutstanding}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* 2️⃣ Filters & Context Bar */}
      <div className="bg-foreground/5 border border-accent/20 rounded-lg p-4 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-medium text-foreground/70">Filters:</span>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/70">Date Range:</span>
            <div className="flex gap-2">
              {(['month', 'quarter', 'year', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'primary' : 'outline'}
                  onClick={() => setDateRange(range)}
                  className="text-xs"
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {(dateRange === 'all' || customStartDate) && (
            <div className="flex items-center gap-2">
              <DatePicker
                label="Start Date"
                date={customStartDate}
                onDateChange={setCustomStartDate}
              />
              <DatePicker
                label="End Date"
                date={customEndDate}
                onDateChange={setCustomEndDate}
              />
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-foreground/70">Status:</span>
            <StatusSelect
              value={statusFilter}
              onChange={setStatusFilter}
              excludeAll={false}
            />
          </div>
        </div>
      </div>

      {/* 3️⃣ Main Analytics Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT (65%) - Revenue vs Profit Chart */}
        <div className="lg:col-span-2 bg-foreground/5 border border-accent/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue vs Profit Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
                formatter={(value: number | undefined) => value ? `$${value.toLocaleString()}` : '$0'}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#fbbf24" 
                strokeWidth={2}
                name="Revenue"
                dot={{ fill: '#fbbf24', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Profit"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT (35%) - Top Jobs by Profit */}
        <div className="bg-foreground/5 border border-accent/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Jobs by Profit</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredRows
              .sort((a, b) => b.profit - a.profit)
              .slice(0, 10)
              .map((row) => {
                const marginColor = row.marginPct >= 20 ? 'text-green-400' : row.marginPct >= 10 ? 'text-yellow-400' : 'text-red-400'
                
                return (
                  <div 
                    key={`${row.parentId}-${row.jobIndex}`}
                    className="p-3 bg-base border border-accent/10 rounded-lg hover:border-accent/30 cursor-pointer transition-colors"
                    onClick={() => handleJobClick(row.parentId)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate flex-1">
                        {row.location || row.jobName || 'Unnamed Job'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/70">Profit: ${row.profit.toLocaleString()}</span>
                      <span className={cn("font-semibold", marginColor)}>
                        {row.marginPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            {filteredRows.length === 0 && (
              <div className="text-sm text-foreground/50 text-center py-8">
                No jobs found for selected filters
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4️⃣ Drill-Down Section - Revenue Table */}
      <div className="bg-foreground/5 border border-accent/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Job-Level Financial Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-accent/20">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/70">Location</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/70">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground/70">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground/70">Cost</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground/70">Profit</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground/70">Margin %</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground/70">Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const marginColor = row.marginPct >= 20 ? 'text-green-400' : row.marginPct >= 10 ? 'text-yellow-400' : 'text-red-400'
                const profitColor = row.profit >= 0 ? 'text-green-400' : 'text-red-400'
                
                return (
                  <tr 
                    key={`${row.parentId}-${row.jobIndex}`}
                    className="border-b border-accent/10 hover:bg-foreground/5 cursor-pointer transition-colors"
                    onClick={() => handleJobClick(row.parentId)}
                  >
                    <td className="py-3 px-4 text-sm text-foreground">
                      {row.location || row.jobName || 'Unnamed Job'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        row.status === 'completed' && "bg-gray-500/20 text-gray-400",
                        row.status === 'approved' && "bg-green-500/20 text-green-400",
                        row.status === 'pending' && "bg-yellow-500/20 text-yellow-400",
                        row.status === 'draft' && "bg-gray-500/20 text-gray-400",
                        row.status === 'paid' && "bg-purple-500/20 text-purple-400"
                      )}>
                        {getStatusDisplayLabel(row.status || 'pending')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground text-right">
                      ${row.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground/70 text-right">
                      ${row.costAllocatedTotal.toLocaleString()}
                    </td>
                    <td className={cn("py-3 px-4 text-sm font-semibold text-right", profitColor)}>
                      ${row.profit.toLocaleString()}
                    </td>
                    <td className={cn("py-3 px-4 text-sm font-semibold text-right", marginColor)}>
                      {row.marginPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground/70">
                      {row.status === 'paid' ? (
                        <span className="text-green-400">Paid</span>
                      ) : row.status === 'completed' ? (
                        <span className="text-yellow-400">Outstanding</span>
                      ) : (
                        <span className="text-foreground/50">N/A</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-foreground/50">
                    No jobs found for selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
