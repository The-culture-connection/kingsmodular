'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, CheckCircle2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StateSelect } from '@/components/ui/state-select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { getJobs, createPendingEstimate, Job } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'

export default function QuotePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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
      console.log('Loaded jobs:', jobsData) // Debug log
      if (jobsData.length === 0) {
        console.warn('No jobs found in Firestore')
      }
      setJobs(jobsData)
    } catch (error: any) {
      console.error('Error loading jobs:', error) // Debug log
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
    
    if (!user) {
      showToast('Please sign in to submit a quote', 'error')
      router.push('/auth/login')
      return
    }

    if (selectedJobs.length === 0) {
      showToast('Please select at least one job', 'error')
      return
    }

    if (!startDate || !endDate) {
      showToast('Please select a date range', 'error')
      return
    }

    if (!streetAddress.trim() || !city.trim() || !state || !zipCode.trim()) {
      showToast('Please fill in all address fields', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const selectedJobsData = jobs.filter((job) => selectedJobs.includes(job.id))

      const fullLocation = `${streetAddress.trim()}, ${city.trim()}, ${state} ${zipCode.trim()}`

      await createPendingEstimate({
        uid: user.id,
        customerId: user.id,
        customerEmail: user.email,
        customerCompanyName: user.companyName || '',
        jobs: selectedJobsData,
        totalPrice,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        location: fullLocation,
        status: 'pending',
      })

      showToast('Quote submitted successfully!', 'success')
      router.push('/customer/estimates')
    } catch (error: any) {
      showToast(error.message || 'Failed to submit quote', 'error')
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
    <div className="relative">
      {/* Total Price Display - Upper Right */}
      <div className="absolute top-0 right-0 bg-accent/20 border border-accent rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm text-foreground/70">Total</p>
            <p className="text-2xl font-bold text-accent">${totalPrice.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 pr-48">
        <h1 className="text-3xl font-bold text-foreground mb-2">Request a Quote</h1>
        <p className="text-foreground/70">Select jobs and provide project details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Range and Location */}
        <div className="bg-base border border-accent/20 rounded-lg p-6 space-y-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            required
          />
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
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-foreground/70 mb-3">{job.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-accent">
                      ${job.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {jobs.length === 0 && (
            <div className="bg-base border border-accent/20 rounded-lg p-8 text-center">
              <p className="text-foreground/70">No jobs available at this time.</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-accent/20">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={selectedJobs.length === 0 || !startDate || !endDate || !streetAddress.trim() || !city.trim() || !state || !zipCode.trim()}
            className="bg-accent hover:bg-accent/90"
          >
            Submit Quote
          </Button>
        </div>
      </form>
    </div>
  )
}
