'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { UserRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/constants'

const INTERNAL_ROLES: UserRole[] = ['office_admin', 'project_manager', 'bookkeeper', 'field_staff', 'employee']
const CUSTOMER_ROLE: UserRole = 'customer'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<UserRole | ''>('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    companyType: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  // Check for role query parameter (e.g., ?role=customer from "Request a quote")
  useEffect(() => {
    const roleParam = searchParams?.get('role')
    if (roleParam === 'customer') {
      setRole('customer')
      setStep(2)
    }
  }, [searchParams])

  const isInternalRole = role && INTERNAL_ROLES.includes(role as UserRole)

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // TODO: Implement signup API call
    // For internal roles, redirect to pending approval page
    // For customers, redirect to dashboard after signup
    
    setTimeout(() => {
      setIsLoading(false)
      if (isInternalRole) {
        router.push('/auth/pending-approval')
      } else {
        router.push('/dashboard')
      }
    }, 1000)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex bg-base">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-base">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="block mb-8">
            <Image
              src="/Assets/Logos/PrimaryLogoWhite.png"
              alt="Kings Modular"
              width={200}
              height={60}
              className="h-16 w-auto"
            />
          </Link>

          {step === 1 ? (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
              <p className="text-foreground/70 mb-8">Choose your role to get started</p>

              <div className="space-y-3">
                {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => (
                  <button
                    key={roleKey}
                    onClick={() => handleRoleSelect(roleKey as UserRole)}
                    className="w-full text-left p-4 border-2 border-foreground/20 rounded-lg hover:border-accent hover:bg-accent/10 transition-all"
                  >
                    <div className="font-semibold text-foreground">{roleLabel}</div>
                    <div className="text-sm text-foreground/70 mt-1">
                      {ROLE_DESCRIPTIONS[roleKey as UserRole]}
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-center text-sm text-foreground/70">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-accent font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-foreground/70 hover:text-foreground mb-4"
                >
                  ← Back to role selection
                </button>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {ROLE_LABELS[role as UserRole]}
                </h1>
                <p className="text-foreground/70">
                  {ROLE_DESCRIPTIONS[role as UserRole]}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  minLength={8}
                />

                {isInternalRole && (
                  <Input
                    label="Company Name"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                  />
                )}

                {role === CUSTOMER_ROLE && (
                  <>
                    <Input
                      label="Company Name"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                    />
                    <Select
                      label="Company Type"
                      value={formData.companyType}
                      onChange={(e) => handleChange('companyType', e.target.value)}
                      options={[
                        { value: 'residential', label: 'Residential' },
                        { value: 'commercial', label: 'Commercial' },
                        { value: 'industrial', label: 'Industrial' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </>
                )}

                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Create Account
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-foreground/70">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-accent font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right side - Image/Video */}
      <div className="hidden lg:block lg:w-1/2 relative bg-base">
        <Image
          src="/Assets/General Photos/image5.jpeg"
          alt="Kings Modular"
          fill
          className="object-cover opacity-80"
          priority
        />
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
        </video>
      </div>
    </div>
  )
}