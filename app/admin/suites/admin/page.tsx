'use client'

import Link from 'next/link'
import { 
  Settings, 
  Tag,
  MapPin,
  Zap,
  CreditCard,
  Calculator,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminSuitePage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-accent" />
          Admin Suite
        </h1>
        <p className="text-foreground/70">Configure pricing, employee pay, and revenue analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pricing Engine */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Pricing Engine</h3>
          </div>
          <div className="space-y-2">
            <Link href="/admin/pricing-engine/add-rule">
              <Button variant="outline" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2" />
                Add Rule
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/pricing-engine/mileage-upcharge">
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Mileage Upcharge
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/pricing-engine/mileage-surge">
              <Button variant="outline" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Automatic Mileage Surge
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Employee Pay with Verizon Fleet */}
        <div className="bg-base border border-accent/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Employee Pay (Verizon Fleet)</h3>
          </div>
          <div className="space-y-2">
            <Link href="/admin/employee-pay/calculate">
              <Button variant="outline" className="w-full justify-start">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate (Clock In/Out)
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/employee-pay/edit-inputs">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Edit Employee Inputs
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/employee-pay/payouts">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Payout Status
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

