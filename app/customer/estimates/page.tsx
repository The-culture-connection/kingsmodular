import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'

export default function CustomerEstimatesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Estimates</h1>
        <p className="text-gray-600">View and manage project estimates</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={FileText}
          title="No estimates"
          description="Project estimates will appear here when they're shared with you."
        />
      </div>
    </div>
  )
}
