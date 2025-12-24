'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Package, Users, Save, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/toast-context'
import { getMileagePayrollConfig, updateMileagePayrollConfig, MileagePayrollConfig } from '@/lib/firebase/pricingConfig'
import { getGasPricingConfig, updateGasPricingConfig, GasPricingConfig } from '@/lib/firebase/pricingConfig'

export default function ExpensesPage() {
  const { showToast } = useToast()
  const [defaultMaterialCost, setDefaultMaterialCost] = useState('')
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('')
  const [defaultHoursPerDay, setDefaultHoursPerDay] = useState('10')
  const [mileagePayrollConfig, setMileagePayrollConfig] = useState<MileagePayrollConfig | null>(null)
  const [gasConfig, setGasConfig] = useState<GasPricingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setIsLoading(true)
      const [mileageConfig, gasPricingConfig] = await Promise.all([
        getMileagePayrollConfig(),
        getGasPricingConfig(),
      ])
      setMileagePayrollConfig(mileageConfig)
      setGasConfig(gasPricingConfig)
    } catch (error: any) {
      showToast(error.message || 'Failed to load settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const promises: Promise<void>[] = []
      
      if (mileagePayrollConfig) {
        promises.push(updateMileagePayrollConfig(mileagePayrollConfig))
      }
      
      if (gasConfig) {
        promises.push(updateGasPricingConfig(gasConfig))
      }
      
      await Promise.all(promises)
      showToast('Expense settings saved successfully', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
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

        {/* Mileage Payroll */}
        {mileagePayrollConfig && (
          <div className="bg-base border border-accent/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Car className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">Mileage Payroll</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={mileagePayrollConfig.enabled}
                  onChange={(e) => setMileagePayrollConfig({ ...mileagePayrollConfig, enabled: e.target.checked })}
                  className="rounded border-accent/30 bg-base text-accent"
                />
                <label className="text-foreground">Enable mileage payroll</label>
              </div>
              <Input
                label="Rate per Mile ($)"
                type="number"
                value={mileagePayrollConfig.ratePerMile}
                onChange={(e) => setMileagePayrollConfig({ ...mileagePayrollConfig, ratePerMile: parseFloat(e.target.value) || 0 })}
                placeholder="0.50"
                step="0.01"
                min="0"
              />
              <p className="text-sm text-foreground/70">
                This rate is multiplied by the number of assigned employees and the distance in miles to calculate mileage payroll cost for each job.
              </p>
            </div>
          </div>
        )}

        {/* Gas Pricing */}
        {gasConfig && (
          <div className="bg-base border border-accent/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Car className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">Gas Pricing</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={gasConfig.enabled}
                  onChange={(e) => setGasConfig({ ...gasConfig, enabled: e.target.checked })}
                  className="rounded border-accent/30 bg-base text-accent"
                />
                <label className="text-foreground">Enable gas pricing</label>
              </div>
              <Input
                label="Gas Price per Gallon ($)"
                type="number"
                value={gasConfig.gasPricePerGallon}
                onChange={(e) => setGasConfig({ ...gasConfig, gasPricePerGallon: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
              />
              <Input
                label="Miles per Gallon (MPG)"
                type="number"
                value={gasConfig.mpg}
                onChange={(e) => setGasConfig({ ...gasConfig, mpg: parseFloat(e.target.value) || 0 })}
                step="0.1"
                min="0"
              />
              <div className="p-3 bg-accent/10 rounded-lg">
                <p className="text-sm text-foreground/70">
                  Base cost per mile: <span className="font-semibold text-accent">
                    ${gasConfig.mpg > 0 ? (gasConfig.gasPricePerGallon / gasConfig.mpg).toFixed(2) : '0.00'}/mile
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
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

