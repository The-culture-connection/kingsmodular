import { EmptyState } from '@/components/ui/empty-state'
import { FileText, Briefcase, DollarSign } from 'lucide-react'

export default function CustomerDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-foreground/70">Overview of your projects and account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70">Active Jobs</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
              <Briefcase className="h-12 w-12 text-accent/20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Estimates</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
              <FileText className="h-12 w-12 text-accent/20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-3xl font-bold text-foreground mt-2">$0</p>
            </div>
              <DollarSign className="h-12 w-12 text-accent/20" />
          </div>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-12">
        <EmptyState
          title="Welcome to your dashboard"
          description="Your project information will appear here once you have active jobs."
        />
      </div>
    </div>
  )
}
