'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusOption {
  value: string
  label: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'In Progress' },
  { value: 'completed', label: 'Closed' },
  { value: 'paid', label: 'Paid' },
]

interface StatusSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  excludeAll?: boolean // Exclude "All Statuses" option
}

export function StatusSelect({ value, onChange, className, excludeAll = false }: StatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter options based on excludeAll prop
  const options = excludeAll ? STATUS_OPTIONS.filter(opt => opt.value !== 'all') : STATUS_OPTIONS
  
  const selectedOption = options.find(opt => opt.value === value) || options[0]

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between h-10 w-full rounded-lg border bg-foreground/5 border-accent/20 px-4 py-2 text-sm text-foreground',
          'hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'
        )}
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className={cn('h-4 w-4 text-foreground/70 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-base border border-accent/20 rounded-lg shadow-lg overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/10 transition-colors',
                  value === option.value && 'bg-accent/20 text-accent'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

