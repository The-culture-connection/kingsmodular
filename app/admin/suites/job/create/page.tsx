'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Plus, Camera, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StateSelect } from '@/components/ui/state-select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/lib/toast-context'
import { getJobs, createPendingEstimate, Job } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'

export default function CreateJobPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const jobsData = await getJobs()
      setJobs(jobsData)
    } catch (error: any) {
      showToast(error.message || 'Failed to load jobs', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    )
  }

  const totalPrice = selectedJobs.reduce((sum, jobId) => {
    const job = jobs.find((j) => j.id === jobId)
    return sum + (job?.price || 0)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedJobs.length === 0) {
      showToast('Please select at least one job', 'error')
      return
    }

    if (!startDate) {
      showToast('Please select a start date', 'error')
      return
    }

    if (!streetAddress.trim() || !city.trim() || !state || !zipCode.trim()) {
      showToast('Please fill in all address fields', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const selectedJobsData = jobs.filter((job) => selectedJobs.includes(job.id))

      // Calculate total days from time estimates
      const totalDays = selectedJobsData.reduce((sum, job) => sum + (job.timeEstimate || 0), 0)
      
      // Calculate end date from start date + total days
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(end.getDate() + totalDays)
      const endDateString = end.toISOString().split('T')[0]

      const fullLocation = `${streetAddress.trim()}, ${city.trim()}, ${state} ${zipCode.trim()}`

      // Use a system/admin user ID - in production, you'd get this from auth
      const adminUserId = 'system' // TODO: Get from auth context

      await createPendingEstimate({
        uid: adminUserId,
        customerId: adminUserId,
        customerEmail: 'admin@kingsmodular.com',
        customerCompanyName: 'Kings Modular',
        jobs: selectedJobsData,
        totalPrice,
        dateRange: {
          start: startDate,
          end: endDateString,
        },
        location: fullLocation,
        status: 'draft',
      })

      showToast('Job created successfully!', 'success')
      router.push('/admin/suites/job')
    } catch (error: any) {
      showToast(error.message || 'Failed to create job', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground/70">Loading jobs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Link href="/admin/suites/job" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Job Suite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Job</h1>
        <p className="text-foreground/70">Select jobs and provide project details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Location */}
        <div className="bg-base border border-accent/20 rounded-lg p-6 space-y-4">
          <DatePicker
            date={startDate}
            onDateChange={setStartDate}
            required
            label="Start Date"
          />
          {selectedJobs.length > 0 && (() => {
            const totalDays = jobs.filter(j => selectedJobs.includes(j.id))
              .reduce((sum, job) => sum + (job.timeEstimate || 0), 0)
            const endDate = startDate ? (() => {
              const start = new Date(startDate)
              const end = new Date(start)
              end.setDate(end.getDate() + totalDays)
              return end.toISOString().split('T')[0]
            })() : ''
            return totalDays > 0 ? (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                <div className="text-sm text-foreground/70">Estimated Duration</div>
                <div className="font-semibold text-foreground">{totalDays} day{totalDays !== 1 ? 's' : ''}</div>
                {endDate && (
                  <div className="text-xs text-foreground/60 mt-1">
                    Expected completion: {new Date(endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : null
          })()}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <MapPin className="h-4 w-4" />
                Street Address
              </label>
              <Input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Enter street address"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="City"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <StateSelect
                  label="State"
                  value={state}
                  onChange={setState}
                  required
                />
              </div>
            </div>
            <div>
              <Input
                label="Zip Code"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter zip code"
                required
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {/* Jobs Selection */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Select Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const isSelected = selectedJobs.includes(job.id)
              return (
                <div
                  key={job.id}
                  onClick={() => toggleJobSelection(job.id)}
                  className={cn(
                    'bg-base border rounded-lg p-4 cursor-pointer transition-all hover:border-accent',
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : 'border-accent/20 hover:bg-foreground/5'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{job.name}</h3>
                  </div>
                  <p className="text-sm text-foreground/70 mb-3">{job.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-accent">
                        ${job.price.toLocaleString()}
                      </span>
                      {job.timeEstimate && (
                        <div className="text-xs text-foreground/60 mt-1">
                          {job.timeEstimate} day{job.timeEstimate !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Total Price */}
        <div className="bg-accent/20 border border-accent rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm text-foreground/70">Total</p>
              <p className="text-2xl font-bold text-accent">${totalPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-accent/20 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="text-accent"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={selectedJobs.length === 0 || !startDate || !streetAddress.trim() || !city.trim() || !state || !zipCode.trim()}
            className="bg-accent hover:bg-accent/90"
          >
            Create Job
          </Button>
        </div>
      </form>
    </div>
  )
}

