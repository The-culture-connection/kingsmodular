import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/lib/toast-context'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const gotham = localFont({
  src: [
    {
      path: '../Assets/Fonts/Gotham Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../Assets/Fonts/Gotham Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-gotham',
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  adjustFontFallback: false, // Prevent font loading from blocking startup
})

export const metadata: Metadata = {
  title: 'Kings Modular',
  description: 'Construction management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${gotham.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}