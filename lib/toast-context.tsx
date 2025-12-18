'use client'

import * as React from 'react'
import { ToastContainer, ToastProps } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], duration?: number) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const showToast = React.useCallback(
    (message: string, type: ToastProps['type'] = 'info', duration = 5000) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((prev) => [...prev, { id, message, type, duration, onClose: () => {} }])
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toastsWithClose = React.useMemo(
    () => toasts.map((toast) => ({ ...toast, onClose: removeToast })),
    [toasts, removeToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toastsWithClose} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
