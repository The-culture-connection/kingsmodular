import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id || props.name} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex h-10 w-full rounded-lg border border-accent/20 bg-base px-3 py-2 text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }

