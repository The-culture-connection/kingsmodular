import { EmptyState } from '@/components/ui/empty-state'
import { Briefcase } from 'lucide-react'

export default function CustomerJobsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Jobs</h1>
        <p className="text-gray-600">View and manage your construction projects</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Your active jobs will appear here once projects are assigned to your account."
        />
      </div>
    </div>
  )
}
