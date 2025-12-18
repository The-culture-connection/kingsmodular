'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/constants'
import { UserRole } from '@/lib/types'
import { signupUser } from '@/lib/firebase/auth'
import { useToast } from '@/lib/toast-context'

const INTERNAL_ROLES: UserRole[] = ['office_admin', 'project_manager', 'bookkeeper', 'field_staff', 'employee']
const CUSTOMER_ROLE: UserRole = 'customer'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
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
  const [error, setError] = useState('')

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
    setError('')
    setIsLoading(true)
    
    try {
      await signupUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: role as string,
        companyName: formData.companyName,
        companyType: formData.companyType,
      })

      showToast('Account created successfully! Please check your email to verify your account.', 'success')
      
      // For internal roles, redirect to pending approval page
      // For customers, redirect directly to customer dashboard
      if (isInternalRole) {
        router.push('/auth/pending-approval')
      } else {
        router.push('/customer/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      showToast(err.message || 'Failed to create account', 'error')
    } finally {
      setIsLoading(false)
    }
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
              alt="Kings Modular LLC"
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

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isInternalRole && (
                  <>
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
                      label="Company Name"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                    />
                  </>
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
                        { value: '', label: 'Select company type...' },
                        { value: 'residential', label: 'Residential' },
                        { value: 'commercial', label: 'Commercial' },
                        { value: 'industrial', label: 'Industrial' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />
                  </>
                )}

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
                  placeholder="Minimum 8 characters"
                />

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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-base"><div className="text-foreground/70">Loading...</div></div>}>
      <SignupForm />
    </Suspense>
  )
}