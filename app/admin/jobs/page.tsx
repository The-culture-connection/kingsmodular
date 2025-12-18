'use client'

export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableFilters } from '@/components/admin/table-filters'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default function AdminJobsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Jobs</h1>
          <p className="text-gray-600">Manage all construction jobs and projects</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      <TableFilters
        searchPlaceholder="Search jobs..."
        onExport={() => console.log('Export jobs')}
        filters={[
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        <Table dense>
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No jobs found. Create your first job to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
