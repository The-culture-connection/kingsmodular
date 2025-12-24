'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BigCtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
  label?: string
  icon?: React.ReactNode
  description?: string
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  children?: React.ReactNode
}

export function BigCTAButton({
  onClick,
  label,
  icon,
  description,
  variant = 'primary',
  className,
  children,
}: BigCtaButtonProps) {
  const displayLabel = label || children
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size="xl"
      className={cn(
        'w-full h-20 text-xl font-bold flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      {icon && <div className="text-3xl">{icon}</div>}
      <span>{displayLabel}</span>
      {description && (
        <span className="text-sm font-normal opacity-80">{description}</span>
      )}
    </Button>
  )
}

