import { DollarSign } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function AdminJobCostingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Job Costing</h1>
        <p className="text-gray-600">Track costs and budgets for each job</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="Job costing dashboard"
          description="Track labor, materials, and overhead costs for all your projects here."
        />
      </div>
    </div>
  )
}
