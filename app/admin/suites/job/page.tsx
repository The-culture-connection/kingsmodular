'use client'

import Link from 'next/link'
import { 
  Briefcase,
  FileText,
  CheckCircle2,
  DollarSign,
  Clock,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Calendar,
  Camera,
  Calculator,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function JobSuitePage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-accent" />
          Job Suite
        </h1>
        <p className="text-foreground/70">Manage job estimates, schedules, and close out jobs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Jobs Estimates */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Jobs Estimates</h3>
          </div>
          <div className="space-y-2">
            <Link href="/admin/jobs/estimates/approved">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approved Jobs
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/estimates/paid">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Paid Jobs
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/estimates/in-progress">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Jobs In Progress
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/estimates/outstanding">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Outstanding Balance
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/estimates/materials">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Material Details & Cost
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/estimates/payroll">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Payroll Estimations
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/estimates/revenue-expenses">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Revenue vs Expenses
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Schedule</h3>
          </div>
          <p className="text-foreground/70 mb-4">View and manage job schedules</p>
          <Link href="/admin/jobs/schedule">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </div>

        {/* Close Out Job */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Close Out Job</h3>
          </div>
          <div className="space-y-2">
            <Link href="/admin/jobs/close-out/pictures">
              <Button variant="outline" className="w-full justify-start">
                <Camera className="h-4 w-4 mr-2" />
                Submit Pictures
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/close-out/finalize">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalize Price
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/jobs/close-out/cost-breakdown">
              <Button variant="outline" className="w-full justify-start">
                <Calculator className="h-4 w-4 mr-2" />
                Show Cost Breakdown
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

