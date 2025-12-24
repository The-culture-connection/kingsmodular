import * as React from 'react'
import { cn } from '@/lib/utils'

const TableContext = React.createContext<{ dense?: boolean }>({})

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  dense?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, dense, ...props }, ref) => (
    <TableContext.Provider value={{ dense }}>
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', dense && 'table-dense', className)}
          {...props}
        />
      </div>
    </TableContext.Provider>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-foreground/5 data-[state=selected]:bg-foreground/10',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { dense } = React.useContext(TableContext)
  return (
    <th
      ref={ref}
      className={cn(
        dense ? 'h-8 px-2' : 'h-12 px-4',
        'text-left align-middle font-medium text-foreground/70 [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
})
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const { dense } = React.useContext(TableContext)
  return (
    <td
      ref={ref}
      className={cn(
        dense ? 'p-2' : 'p-4',
        'align-middle [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
})
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell }

