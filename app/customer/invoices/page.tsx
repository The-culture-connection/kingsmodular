import { EmptyState } from '@/components/ui/empty-state'
import { Receipt } from 'lucide-react'

export default function CustomerInvoicesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Invoices & Payments</h1>
        <p className="text-gray-600">View invoices and manage payments</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={Receipt}
          title="No invoices"
          description="Invoices and payment information will appear here when available."
        />
      </div>
    </div>
  )
}
