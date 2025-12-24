'use client'

import Link from 'next/link'
import { 
  Settings, 
  Tag,
  Package,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminSuitePage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-accent" />
          Admin Suite
        </h1>
        <p className="text-foreground/70">Configure pricing, materials, and expense inputs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Edit Pricing Engine */}
        <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Tag className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Edit Pricing Engine</h3>
          </div>
          <p className="text-sm text-foreground/70 mb-4">
            Configure pricing rules, mileage upcharges, and automatic pricing adjustments
          </p>
          <Link href="/admin/suites/admin/pricing-engine">
            <Button variant="outline" className="w-full justify-between group">
              <span>Manage Pricing</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Add Materials */}
        <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Add Materials</h3>
          </div>
          <p className="text-sm text-foreground/70 mb-4">
            Add new materials to the system with name and cost per unit
          </p>
          <Link href="/admin/suites/admin/materials">
            <Button variant="outline" className="w-full justify-between group">
              <span>Manage Materials</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Edit Expense Inputs */}
        <div className="bg-base border border-accent/20 rounded-lg p-6 hover:shadow-lg hover:border-accent/40 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Edit Expense Inputs</h3>
          </div>
          <p className="text-sm text-foreground/70 mb-4">
            Configure default costs and settings for materials and payroll expenses
          </p>
          <Link href="/admin/suites/admin/expenses">
            <Button variant="outline" className="w-full justify-between group">
              <span>Manage Expenses</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
