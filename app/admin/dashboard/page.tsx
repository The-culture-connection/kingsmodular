import { Briefcase, DollarSign, Users, Calendar } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-foreground/70">Overview of your operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70">Active Jobs</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
            <Briefcase className="h-12 w-12 text-accent/20" />
          </div>
        </div>

        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70">Revenue (MTD)</p>
              <p className="text-3xl font-bold text-foreground mt-2">$0</p>
            </div>
            <DollarSign className="h-12 w-12 text-primary/20" />
          </div>
        </div>

        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70">Team Members</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
            <Users className="h-12 w-12 text-primary/20" />
          </div>
        </div>

        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/70">Upcoming Events</p>
              <p className="text-3xl font-bold text-foreground mt-2">0</p>
            </div>
            <Calendar className="h-12 w-12 text-primary/20" />
          </div>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-foreground/50 text-sm">No recent activity</p>
        </div>

        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <p className="text-foreground/50 text-sm">Quick actions will appear here</p>
        </div>
      </div>
    </div>
  )
}
