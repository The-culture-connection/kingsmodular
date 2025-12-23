'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  Settings,
  LogOut,
  UserPlus,
  BarChart3,
  Receipt,
  Wrench
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employee Suite', href: '/admin/suites/employee', icon: UserPlus },
    { name: 'Admin Suite', href: '/admin/suites/admin', icon: Settings },
    { name: 'Revenue Analytics', href: '/admin/suites/revenue', icon: BarChart3 },
    { name: 'Job Suite', href: '/admin/suites/job', icon: Briefcase },
  ]

  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 bg-base border-r border-accent/20 flex flex-col">
        <div className="p-6 border-b border-accent/20">
          <h1 className="text-xl font-bold text-foreground">Admin Portal</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-accent text-base font-semibold' 
                    : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-accent/20">
          <div className="mb-4 text-sm text-foreground/70">
            <p className="font-medium text-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground/70 hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

