import { Button } from '@/components/ui/button'
import { Tag } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function AdminPricingPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pricing</h1>
          <p className="text-gray-600">Manage pricing templates and rates</p>
        </div>
        <Button>
          <Tag className="h-4 w-4 mr-2" />
          New Pricing Template
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="Pricing management"
          description="Create and manage pricing templates for labor, materials, and services."
        />
      </div>
    </div>
  )
}
