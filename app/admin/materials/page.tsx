'use client'

export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableFilters } from '@/components/admin/table-filters'
import { Plus, Upload } from 'lucide-react'

export default function AdminMaterialsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Materials & Receipts</h1>
          <p className="text-gray-600">Track materials purchases and receipts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      <TableFilters
        searchPlaceholder="Search materials..."
        onExport={() => console.log('Export materials')}
        filters={[
          {
            id: 'job',
            label: 'Job',
            type: 'select',
            options: [
              { value: 'all', label: 'All Jobs' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        <Table dense>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No materials recorded yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
