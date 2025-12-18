import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableFilters } from '@/components/admin/table-filters'
import { Plus } from 'lucide-react'

export default function AdminEstimatesInvoicesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Estimates & Invoices</h1>
          <p className="text-gray-600">Create and manage estimates and invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <TableFilters
        searchPlaceholder="Search estimates and invoices..."
        onExport={() => console.log('Export')}
        filters={[
          {
            id: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'all', label: 'All' },
              { value: 'estimate', label: 'Estimates' },
              { value: 'invoice', label: 'Invoices' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        <Table dense>
          <TableHeader>
            <TableRow>
              <TableHead>Document #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                No estimates or invoices found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
