import { Calendar, Clock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default function AdminSchedulePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Schedule</h1>
        <p className="text-gray-600">Manage project schedules and timelines</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={Calendar}
          title="Schedule view coming soon"
          description="Calendar and timeline views for managing project schedules will be available here."
        />
      </div>
    </div>
  )
}
