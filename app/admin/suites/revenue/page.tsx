'use client'

import Link from 'next/link'
import { 
  TrendingUp,
  FileText,
  BarChart3,
  PieChart,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RevenueSuitePage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-accent" />
          Revenue Analytics
        </h1>
        <p className="text-foreground/70">View invoices, generate revenue charts, and compare job costs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">View Invoices</h3>
          </div>
          <p className="text-foreground/70 mb-4">Access and manage all invoices</p>
          <Link href="/admin/revenue-analytics/invoices">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              View Invoices
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </div>

        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Revenue Chart Generation</h3>
          </div>
          <p className="text-foreground/70 mb-4">Generate visual revenue reports and charts</p>
          <Link href="/admin/revenue-analytics/charts">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Revenue Chart Generation
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </div>

        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Job Cost Comparison</h3>
          </div>
          <p className="text-foreground/70 mb-4">Compare costs across different jobs</p>
          <Link href="/admin/revenue-analytics/cost-comparison">
            <Button variant="outline" className="w-full justify-start">
              <PieChart className="h-4 w-4 mr-2" />
              Job Cost Comparison
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

