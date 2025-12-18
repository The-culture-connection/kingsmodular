'use client'

import { useState } from 'react'
import { BigCTAButton } from '@/components/field/big-cta-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Clock, Check } from 'lucide-react'

export default function FieldTimePage() {
  const [hours, setHours] = useState('')
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit time entry
    console.log('Submit time', { hours, jobId, date })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Time Entry</h1>
        <p className="text-foreground/70">Log your work hours</p>
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
              { value: '2', label: 'Job 2' },
            ]}
          />

          <Input
            label="Hours"
            type="number"
            step="0.25"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="8.0"
            required
          />
        </div>

        <BigCTAButton
          type="submit"
          icon={Check}
          variant="primary"
        >
          Submit Time Entry
        </BigCTAButton>
      </form>
    </div>
  )
}
