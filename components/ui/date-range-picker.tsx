'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-day-picker/dist/style.css'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  required?: boolean
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  required = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    return start || end ? { from: start, to: end } : undefined
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    setRange(start || end ? { from: start, to: end } : undefined)
  }, [startDate, endDate])

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

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange)
    
    if (selectedRange?.from) {
      onStartDateChange(format(selectedRange.from, 'yyyy-MM-dd'))
    }
    
    if (selectedRange?.to) {
      onEndDateChange(format(selectedRange.to, 'yyyy-MM-dd'))
    } else if (selectedRange?.from && !selectedRange.to) {
      // Clear end date if only start date is selected
      onEndDateChange('')
    }
  }

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRange(undefined)
    onStartDateChange('')
    onEndDateChange('')
  }

  const displayValue = () => {
    if (range?.from && range?.to) {
      return `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
    }
    if (range?.from) {
      return format(range.from, 'MMM d, yyyy')
    }
    return 'Select dates'
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Calendar className="h-4 w-4" />
        Date Range
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between h-10 w-full rounded-lg border bg-base px-3 py-2 text-sm text-foreground cursor-pointer',
          'hover:border-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent',
          required && !startDate && 'border-red-500',
          range?.from && range?.to ? 'border-accent' : 'border-foreground/20'
        )}
      >
        <span className={cn(range?.from && range?.to ? 'text-foreground' : 'text-foreground/50')}>
          {displayValue()}
        </span>
        <div className="flex items-center gap-2">
          {(range?.from || range?.to) && (
            <button
              type="button"
              onClick={clearDates}
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
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
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
              day_range_start: 'rdp-day_range_start',
              day_range_middle: 'rdp-day_range_middle',
              day_range_end: 'rdp-day_range_end',
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
