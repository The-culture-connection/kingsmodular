'use client'

import { useState } from 'react'
import { BigCTAButton } from '@/components/field/big-cta-button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FileText, Upload, Check } from 'lucide-react'

export default function FieldNotesPage() {
  const [note, setNote] = useState('')
  const [jobId, setJobId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Submit note and handle file uploads
    console.log('Submit note', { note, jobId, date })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Notes & Uploads</h1>
        <p className="text-foreground/70">Add notes and upload photos or documents</p>
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

          <Textarea
            label="Notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your notes here..."
            rows={6}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Files (Photos, Documents)
            </label>
            <div className="border-2 border-dashed border-foreground/20 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-foreground/70">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                PNG, JPG, PDF up to 10MB
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <span className="mt-2 inline-block text-sm text-accent cursor-pointer hover:underline">
                  Browse files
                </span>
              </label>
            </div>
          </div>
        </div>

        <BigCTAButton
          type="submit"
          icon={Check}
          variant="primary"
        >
          Submit Notes & Files
        </BigCTAButton>
      </form>
    </div>
  )
}
