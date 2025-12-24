'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Search, X, Download } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface Filter {
  id: string
  label: string
  type: 'select'
  options: FilterOption[]
}

interface TableFiltersProps {
  // Legacy props (for backward compatibility)
  searchValue?: string
  onSearchChange?: (value: string) => void
  onClear?: () => void
  placeholder?: string
  // New props
  searchPlaceholder?: string
  onExport?: () => void
  filters?: Filter[]
}

export function TableFilters({
  searchValue: controlledSearchValue,
  onSearchChange,
  onClear,
  placeholder,
  searchPlaceholder,
  onExport,
  filters = [],
}: TableFiltersProps) {
  const [internalSearchValue, setInternalSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})

  const searchValue = controlledSearchValue ?? internalSearchValue
  const displayPlaceholder = searchPlaceholder ?? placeholder ?? 'Search...'

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setInternalSearchValue(value)
    }
  }

  const handleClear = () => {
    if (onClear) {
      onClear()
    } else {
      setInternalSearchValue('')
    }
  }

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <div className="relative flex-1 max-w-sm min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={displayPlaceholder}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filters.map((filter) => (
        <div key={filter.id} className="min-w-[150px]">
          <Select
            label={filter.label}
            value={filterValues[filter.id] || filter.options[0]?.value || ''}
            onChange={(e) => {
              setFilterValues((prev) => ({
                ...prev,
                [filter.id]: e.target.value,
              }))
            }}
            options={filter.options}
          />
        </div>
      ))}

      {onExport && (
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      )}
    </div>
  )
}

