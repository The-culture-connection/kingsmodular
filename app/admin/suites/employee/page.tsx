'use client'

import Link from 'next/link'
import { 
  Users, 
  UserPlus, 
  Clock, 
  FileText, 
  Receipt, 
  Calendar,
  ArrowRight,
  Banknote,
  FileBadge,
  Hourglass,
  Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EmployeeSuitePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-accent" />
          Employee Suite
        </h1>
        <p className="text-foreground/70">Manage employee onboarding, information, and payroll</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employee Onboarding */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Employee Onboarding</h3>
          </div>
          <div className="space-y-2">
            <Link href="/admin/employees/onboarding/create-profile">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Employee Profile
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Employees Info */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Employees Info</h3>
          </div>
          <div className="space-y-2">
            <Link href="/admin/employees/info/hours">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Hours
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/employees/info/paystubs">
              <Button variant="outline" className="w-full justify-start">
                <Banknote className="h-4 w-4 mr-2" />
                Paystubs
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/employees/info/tax-info">
              <Button variant="outline" className="w-full justify-start">
                <FileBadge className="h-4 w-4 mr-2" />
                Tax Info
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/employees/info/pto">
              <Button variant="outline" className="w-full justify-start">
                <Hourglass className="h-4 w-4 mr-2" />
                PTO Requests
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/employees/info/generate-payroll">
              <Button variant="outline" className="w-full justify-start">
                <Calculator className="h-4 w-4 mr-2" />
                Generate Payroll
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

