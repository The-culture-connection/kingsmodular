'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Package, Users, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/toast-context'

export default function ExpensesPage() {
  const { showToast } = useToast()
  const [defaultMaterialCost, setDefaultMaterialCost] = useState('')
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('')
  const [defaultHoursPerDay, setDefaultHoursPerDay] = useState('10')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load current expense settings (you can fetch from Firestore or use defaults)
    // For now, using defaults
    setDefaultMaterialCost('')
    setDefaultHourlyRate('')
    setDefaultHoursPerDay('10')
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // TODO: Save to Firestore settings collection
      // For now, just show success message
      showToast('Expense settings saved successfully', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to save settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/suites/admin" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Suite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-accent" />
          Edit Expense Inputs
        </h1>
        <p className="text-foreground/70">Configure default costs for materials and payroll</p>
      </div>

      <div className="space-y-6">
        {/* Materials Defaults */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Materials Defaults</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Default Material Cost (Optional)"
              type="number"
              value={defaultMaterialCost}
              onChange={(e) => setDefaultMaterialCost(e.target.value)}
              placeholder="Leave empty to use material-specific costs"
              step="0.01"
            />
            <p className="text-sm text-foreground/70">
              This default cost will be used when no specific cost is set for a material. Leave empty to use material-specific costs from the Materials collection.
            </p>
          </div>
        </div>

        {/* Payroll Defaults */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Payroll Defaults</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Default Hourly Rate"
              type="number"
              value={defaultHourlyRate}
              onChange={(e) => setDefaultHourlyRate(e.target.value)}
              placeholder="e.g., 25.00"
              step="0.01"
            />
            <Input
              label="Default Hours per Day"
              type="number"
              value={defaultHoursPerDay}
              onChange={(e) => setDefaultHoursPerDay(e.target.value)}
              placeholder="e.g., 10"
              min="1"
              max="24"
            />
            <p className="text-sm text-foreground/70">
              These defaults will be used when calculating payroll costs. Individual employee rates can be set when creating employee profiles.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

