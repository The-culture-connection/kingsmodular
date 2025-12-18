'use client'

export const dynamic = 'force-dynamic'

import { BigCTAButton } from '@/components/field/big-cta-button'
import { Clock, MapPin, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function FieldDashboardPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
        <p className="text-foreground/70">Quick access to your most used features</p>
      </div>

      {/* Big CTAs - Mobile First */}
      <div className="space-y-4 mb-8">
        <Link href="/field/time">
          <BigCTAButton
            icon={<Clock className="h-8 w-8" />}
            description="Log your work hours"
            variant="primary"
          >
            Log Time
          </BigCTAButton>
        </Link>

        <Link href="/field/mileage">
          <BigCTAButton
            icon={<MapPin className="h-8 w-8" />}
            description="Record mileage for reimbursement"
            variant="secondary"
          >
            Log Mileage
          </BigCTAButton>
        </Link>

        <Link href="/field/notes">
          <BigCTAButton
            icon={<FileText className="h-8 w-8" />}
            description="Add notes and upload photos"
            variant="outline"
          >
            Add Notes
          </BigCTAButton>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-4 text-center">
          <p className="text-sm text-foreground/70 mb-1">Hours This Week</p>
          <p className="text-2xl font-bold text-foreground">0</p>
        </div>
        <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-4 text-center">
          <p className="text-sm text-foreground/70 mb-1">Miles This Week</p>
          <p className="text-2xl font-bold text-foreground">0</p>
        </div>
      </div>
    </div>
  )
}
