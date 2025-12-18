'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calculator, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GeneratePayrollPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePayroll = async () => {
    setIsGenerating(true)
    // TODO: Implement payroll generation logic
    setTimeout(() => {
      setIsGenerating(false)
      alert('Payroll generation functionality will be implemented here')
    }, 1000)
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/suites/employee" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employee Suite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-accent" />
          Generate Payroll
        </h1>
        <p className="text-foreground/70">Generate payroll for all employees based on hours and rates</p>
      </div>

      <div className="bg-base border border-accent/20 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Payroll Generation</h2>
          <p className="text-foreground/70 mb-6">
            This feature will generate payroll for all employees based on their clock in/out times, 
            hourly rates, and any applicable deductions or bonuses.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-foreground/5 border border-accent/10 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-2">Payroll Period</h3>
            <p className="text-foreground/70 text-sm">Select the pay period for payroll generation</p>
            {/* TODO: Add date range picker */}
          </div>

          <div className="bg-foreground/5 border border-accent/10 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-2">Employees</h3>
            <p className="text-foreground/70 text-sm">All active employees will be included in the payroll</p>
            {/* TODO: Add employee selection */}
          </div>

          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={handleGeneratePayroll}
              disabled={isGenerating}
              className="bg-accent hover:bg-accent/90"
            >
              {isGenerating ? 'Generating...' : 'Generate Payroll'}
            </Button>
            <Button variant="outline" className="text-accent">
              Preview Payroll
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

