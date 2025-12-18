'use client'

import * as React from 'react'
import { Search, Filter, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

export interface FilterConfig {
  id: string
  label: string
  type: 'text' | 'select'
  options?: { value: string; label: string }[]
}

export interface TableFiltersProps {
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  filters?: FilterConfig[]
  onFilterChange?: (filterId: string, value: string) => void
  onExport?: () => void
  exportLabel?: string
}

export function TableFilters({
  searchPlaceholder = 'Search...',
  onSearch,
  filters = [],
  onFilterChange,
  onExport,
  exportLabel = 'Export',
}: TableFiltersProps) {
  const [searchValue, setSearchValue] = React.useState('')

  const handleSearch = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {onSearch && (
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}
      
      {filters.map((filter) => (
        <div key={filter.id} className="w-full sm:w-48">
          {filter.type === 'select' && filter.options ? (
            <Select
              label={filter.label}
              options={filter.options}
              onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
            />
          ) : (
            <Input
              label={filter.label}
              onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
            />
          )}
        </div>
      ))}

      {onExport && (
        <div className="flex items-end">
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            {exportLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
