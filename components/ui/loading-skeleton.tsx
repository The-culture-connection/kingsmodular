import { cn } from '@/lib/utils'

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1, ...props }: LoadingSkeletonProps) {
  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-foreground/10 rounded animate-pulse"
              style={{ width: i === lines - 1 ? '75%' : '100%' }}
            />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('h-4 bg-foreground/10 rounded animate-pulse', className)}
      {...props}
    />
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-foreground/10 rounded flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-10 bg-foreground/5 rounded flex-1 animate-pulse"
              style={{ animationDelay: `${rowIdx * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
