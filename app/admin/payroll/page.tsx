'use client'

export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableFilters } from '@/components/admin/table-filters'
import { Download, Upload } from 'lucide-react'

export default function AdminPayrollPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payroll & Mileage</h1>
          <p className="text-gray-600">Manage employee payroll and mileage reimbursements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Timesheets
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Payroll
          </Button>
        </div>
      </div>

      <TableFilters
        searchPlaceholder="Search employees..."
        onExport={() => console.log('Export payroll')}
        filters={[
          {
            id: 'period',
            label: 'Pay Period',
            type: 'select',
            options: [
              { value: 'current', label: 'Current Period' },
              { value: 'last', label: 'Last Period' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        <Table dense>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                No payroll records found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
