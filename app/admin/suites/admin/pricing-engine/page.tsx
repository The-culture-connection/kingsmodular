'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Tag, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/toast-context'
import { getGasPricingConfig, updateGasPricingConfig, GasPricingConfig } from '@/lib/firebase/pricingConfig'
// Removed direct import - will use API route instead

export default function PricingEnginePage() {
  const { showToast } = useToast()
  const [config, setConfig] = useState<GasPricingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const gasConfig = await getGasPricingConfig()
      setConfig(gasConfig)
    } catch (error: any) {
      showToast(error.message || 'Failed to load pricing config', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return
    
    try {
      setIsSaving(true)
      await updateGasPricingConfig(config)
      showToast('Pricing configuration saved successfully', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to save configuration', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRecalculateAll = async () => {
    if (!confirm('This will recalculate gas pricing for all jobs. This may take a while. Continue?')) {
      return
    }

    try {
      setIsRecalculating(true)
      // Get all jobs from Firestore using client SDK
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      const jobsRef = collection(db, 'jobs')
      const snapshot = await getDocs(jobsRef)
      
      let successCount = 0
      let errorCount = 0

      // Use API route instead of direct import to avoid firebase-admin in client bundle
      for (const doc of snapshot.docs) {
        try {
          const response = await fetch('/api/jobs/calculate-gas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobId: doc.id }),
          })
          
          if (!response.ok) {
            throw new Error(`API returned ${response.status}`)
          }
          
          successCount++
        } catch (error) {
          console.error(`Error recalculating job ${doc.id}:`, error)
          errorCount++
        }
      }

      showToast(
        `Recalculation complete: ${successCount} succeeded, ${errorCount} failed`,
        errorCount > 0 ? 'warning' : 'success'
      )
    } catch (error: any) {
      showToast(error.message || 'Failed to recalculate jobs', 'error')
    } finally {
      setIsRecalculating(false)
    }
  }

  const updateConfig = (updates: Partial<GasPricingConfig>) => {
    if (!config) return
    setConfig({ ...config, ...updates })
  }

  const updateSurgeConfig = (updates: Partial<GasPricingConfig['surge']>) => {
    if (!config) return
    setConfig({
      ...config,
      surge: { ...config.surge, ...updates },
    })
  }

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground/70">Loading pricing configuration...</div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/suites/admin" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Suite
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Tag className="h-8 w-8 text-accent" />
              Pricing Engine
            </h1>
            <p className="text-foreground/70">Configure gas pricing and surge rules</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRecalculateAll}
              isLoading={isRecalculating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalculate All Jobs
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">General Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
                className="rounded border-accent/30 bg-base text-accent"
              />
              <label className="text-foreground">Enable gas pricing</label>
            </div>
            <Input
              label="Office Base Address"
              value={config.officeAddress}
              onChange={(e) => updateConfig({ officeAddress: e.target.value })}
              placeholder="6407 US - 50, Holton, IN 47023"
            />
          </div>
        </div>

        {/* Gas Pricing */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Gas Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Gas Price per Gallon ($)"
              type="number"
              value={config.gasPricePerGallon}
              onChange={(e) => updateConfig({ gasPricePerGallon: parseFloat(e.target.value) || 0 })}
              step="0.01"
              min="0"
            />
            <Input
              label="Miles per Gallon (MPG)"
              type="number"
              value={config.mpg}
              onChange={(e) => updateConfig({ mpg: parseFloat(e.target.value) || 0 })}
              step="0.1"
              min="0"
            />
          </div>
          <div className="mt-4 p-3 bg-accent/10 rounded-lg">
            <p className="text-sm text-foreground/70">
              Base cost per mile: <span className="font-semibold text-accent">
                ${(config.gasPricePerGallon / config.mpg).toFixed(2)}/mile
              </span>
            </p>
          </div>
        </div>

        {/* Surge Pricing */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Surge Pricing</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.surge.enabled}
                onChange={(e) => updateSurgeConfig({ enabled: e.target.checked })}
                className="rounded border-accent/30 bg-base text-accent"
              />
              <label className="text-foreground">Enable surge pricing</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Surge Threshold (miles)"
                type="number"
                value={config.surge.milesThreshold}
                onChange={(e) => updateSurgeConfig({ milesThreshold: parseFloat(e.target.value) || 0 })}
                step="1"
                min="0"
              />
              <Input
                label="Surge Multiplier"
                type="number"
                value={config.surge.multiplier}
                onChange={(e) => updateSurgeConfig({ multiplier: parseFloat(e.target.value) || 0 })}
                step="0.1"
                min="1"
              />
            </div>
            <div className="mt-4 p-3 bg-accent/10 rounded-lg">
              <p className="text-sm text-foreground/70">
                Surge cost per mile: <span className="font-semibold text-accent">
                  ${((config.gasPricePerGallon / config.mpg) * config.surge.multiplier).toFixed(2)}/mile
                </span>
                {config.surge.enabled && (
                  <span className="block mt-1">
                    (applies when distance &gt; {config.surge.milesThreshold} miles)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Mode */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Pricing Mode</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pricingMode"
                value="FULL_SURGE"
                checked={config.pricingMode === 'FULL_SURGE'}
                onChange={() => updateConfig({ pricingMode: 'FULL_SURGE' })}
                className="rounded border-accent/30 bg-base text-accent"
              />
              <div>
                <div className="text-foreground font-medium">Full Surge</div>
                <div className="text-sm text-foreground/70">
                  Customer pays the full surge rate when surge applies
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pricingMode"
                value="INCREMENT_ONLY"
                checked={config.pricingMode === 'INCREMENT_ONLY'}
                onChange={() => updateConfig({ pricingMode: 'INCREMENT_ONLY' })}
                className="rounded border-accent/30 bg-base text-accent"
              />
              <div>
                <div className="text-foreground font-medium">Increment Only</div>
                <div className="text-sm text-foreground/70">
                  Customer pays only the difference above base rate when surge applies
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
