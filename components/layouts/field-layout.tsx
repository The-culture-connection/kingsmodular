'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Clock,
  MapPin,
  FileText,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

const fieldNavItems = [
  { href: '/field/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/field/time', label: 'Time Entry', icon: Clock },
  { href: '/field/mileage', label: 'Mileage', icon: MapPin },
  { href: '/field/notes', label: 'Notes & Uploads', icon: FileText },
]

export function FieldLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-base">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown as overlay */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-base border-r border-accent/20 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/field/dashboard">
              <Image
                src="/Assets/Logos/PrimaryLogoWhite.png"
                alt="Kings Modular"
                width={150}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {fieldNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-4 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-base'
                      : 'text-foreground hover:bg-foreground/10'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-base py-4"
              onClick={logout}
            >
              <LogOut className="h-6 w-6 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar - Mobile first */}
        <header className="sticky top-0 z-30 bg-base border-b border-accent/20">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/field/dashboard" className="lg:hidden">
              <Image
                src="/Assets/Logos/PrimaryLogoWhite.png"
                alt="Kings Modular"
                width={120}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content - Mobile optimized */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
