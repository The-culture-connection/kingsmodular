'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-day-picker/dist/style.css'

interface DatePickerProps {
  date: string
  onDateChange: (date: string) => void
  required?: boolean
  label?: string
}

// Parse date string (yyyy-MM-dd) as local date, not UTC
const parseLocalDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function DatePicker({
  date,
  onDateChange,
  required = false,
  label = 'Start Date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => parseLocalDate(date))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parsed = parseLocalDate(date)
    setSelectedDate(parsed)
  }, [date])

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

  const handleSelect = (selected: Date | undefined) => {
    setSelectedDate(selected)
    if (selected) {
      onDateChange(format(selected, 'yyyy-MM-dd'))
    }
    setIsOpen(false)
  }

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDate(undefined)
    onDateChange('')
  }

  const displayValue = () => {
    if (selectedDate) {
      return format(selectedDate, 'MMM d, yyyy')
    }
    return 'Select date'
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Calendar className="h-4 w-4" />
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between h-10 w-full rounded-lg border bg-base px-3 py-2 text-sm text-foreground cursor-pointer',
          'hover:border-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent',
          required && !date && 'border-red-500',
          selectedDate ? 'border-accent' : 'border-foreground/20'
        )}
      >
        <span className={cn(selectedDate ? 'text-foreground' : 'text-foreground/50')}>
          {displayValue()}
        </span>
        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              type="button"
              onClick={clearDate}
              className="text-foreground/50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Calendar className="h-4 w-4 text-accent" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-base border border-accent/20 rounded-lg shadow-lg p-4">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className="rdp-gold"
            style={{
              '--rdp-accent-color': '#aa9550',
              '--rdp-background-color': '#9c7a1a',
              '--rdp-outline': '2px solid #aa9550',
            } as React.CSSProperties}
            classNames={{
              months: 'flex flex-col sm:flex-row gap-4 font-gotham',
              month: 'space-y-4 font-gotham',
              caption: 'flex justify-center pt-1 relative items-center font-gotham',
              caption_label: 'text-sm font-medium text-foreground font-gotham',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-accent rounded-md w-9 font-normal text-[0.8rem] font-gotham',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
              day: 'h-9 w-9 p-0 font-normal font-gotham',
              day_selected: 'rdp-day_selected',
              day_today: 'text-accent font-semibold',
              day_outside: 'text-foreground/30 opacity-50',
              day_disabled: 'text-foreground/30 opacity-50',
              day_hidden: 'invisible',
            }}
          />
        </div>
      )}
    </div>
  )
}

