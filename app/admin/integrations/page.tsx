import { Plug } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function AdminIntegrationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
        <p className="text-gray-600">Connect with third-party tools and services</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={<Plug className="h-12 w-12" />}
          title="Integrations"
          description="Connect with accounting software, payment processors, and other tools."
        />
      </div>
    </div>
  )
}
