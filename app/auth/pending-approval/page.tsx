'use client'

import { Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Image
            src="/Assets/Logos/PrimaryLogoWhite.png"
            alt="Kings Modular"
            width={200}
            height={60}
            className="h-16 w-auto mx-auto"
          />
        </div>

        <div className="bg-base border border-accent/20 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Pending Approval
            </h1>
            <p className="text-foreground/70">
              Your account is pending approval from an administrator. You'll receive an email notification once your account has been reviewed.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-left bg-foreground/5 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• An administrator will review your registration</li>
                <li>• You'll be assigned appropriate permissions</li>
                <li>• You'll receive an email when your account is approved</li>
              </ul>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Return to Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
