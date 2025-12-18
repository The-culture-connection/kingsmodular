'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
]

interface StateSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  error?: string
}

export function StateSelect({ value, onChange, label, required = false, error }: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredStates = US_STATES.filter(state =>
    state.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (state: string) => {
    onChange(state)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-between h-10 w-full rounded-lg border bg-base px-3 py-2 text-sm text-foreground',
            'hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-foreground/20',
            !value && 'text-foreground/50'
          )}
        >
          <span>{value || 'Select state...'}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-base border border-accent/20 rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b border-accent/20">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search states..."
                  className="w-full pl-8 pr-3 py-2 bg-base border border-accent/20 rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => handleSelect(state)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent/20 transition-colors',
                      value === state && 'bg-accent/30 font-semibold'
                    )}
                  >
                    {state}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-foreground/50">No states found</div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
