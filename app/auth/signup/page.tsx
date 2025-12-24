'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { signupUser } from '@/lib/firebase/auth'
import { useToast } from '@/lib/toast-context'
import { useAuth } from '@/lib/auth-context'

function SignupForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    companyType: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      await signupUser({
        email: formData.email,
        password: formData.password,
        role: 'customer', // Always customer for public signup
        companyName: formData.companyName,
        companyType: formData.companyType,
      })

      showToast('Account created successfully! Please check your email to verify your account.', 'success')
      
      // Wait for auth state to propagate - onAuthStateChanged should fire immediately
      // Give it a moment for the profile to load
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Try to refresh user profile to ensure it's loaded
      try {
        await refreshUser()
      } catch (err) {
        // If refresh fails, that's okay - onAuthStateChanged will handle it
      }
      
      router.push('/customer/dashboard')
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

          <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-foreground/70 mb-8">Sign up to request quotes and manage your projects</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />

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