'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

import { BigCTAButton } from '@/components/field/big-cta-button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MapPin, Check } from 'lucide-react'

export default function FieldMileagePage() {
  const [miles, setMiles] = useState('')
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit mileage entry
    console.log('Submit mileage', { miles, jobId, date, fromLocation, toLocation })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Mileage Entry</h1>
        <p className="text-foreground/70">Record mileage for reimbursement</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-6 space-y-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Select
            label="Job"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            options={[
              { value: '', label: 'Select a job...' },
              { value: '1', label: 'Job 1' },
            ]}
          />

          <Input
            label="From Location"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
            placeholder="Starting location"
            required
          />

          <Input
            label="To Location"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
            placeholder="Destination"
            required
          />

          <Input
            label="Miles"
            type="number"
            step="0.1"
            min="0"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            placeholder="0.0"
            required
          />
        </div>

        <BigCTAButton
          type="submit"
          icon={<Check className="h-8 w-8" />}
          variant="primary"
        >
          Submit Mileage
        </BigCTAButton>
      </form>
    </div>
  )
}
