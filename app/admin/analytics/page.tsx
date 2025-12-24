import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function AdminAnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-gray-600">View insights and reports on your business</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={<BarChart3 className="h-12 w-12" />}
          title="Analytics dashboard"
          description="Charts, graphs, and insights about your projects, revenue, and operations will appear here."
        />
      </div>
    </div>
  )
}
