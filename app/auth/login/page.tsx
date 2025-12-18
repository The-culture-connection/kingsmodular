'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      await login(email, password)
      showToast('Signed in successfully!', 'success')
      // Wait a moment for auth state to update, then redirect based on role
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in. Please check your credentials.'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-base">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="block mb-8">
            <Image
              src="/Assets/Logos/PrimaryLogoWhite.png"
              alt="Kings Modular LLC."
              width={200}
              height={60}
              className="h-16 w-auto"
            />
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-foreground/70 mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-foreground/30 bg-base text-accent" />
                <span className="ml-2 text-sm text-foreground/70">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-accent hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/70">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-accent font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Video */}
      <div className="hidden lg:block lg:w-1/2 relative bg-base">
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="/Assets/Videos/Homescreenvid.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  )
}