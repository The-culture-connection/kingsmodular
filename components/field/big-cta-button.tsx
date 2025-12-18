'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'

export interface BigCTAButtonProps extends Omit<ButtonProps, 'size'> {
  icon?: React.ReactNode
  description?: string
  fullWidth?: boolean
}

export function BigCTAButton({
  icon,
  description,
  fullWidth = true,
  className,
  children,
  ...props
}: BigCTAButtonProps) {
  return (
    <Button
      size="xl"
      className={cn(
        'flex flex-col items-center justify-center gap-3 h-auto py-6 px-6',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {icon && <div className="h-8 w-8 flex items-center justify-center">{icon}</div>}
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold">{children}</span>
        {description && (
          <span className="text-sm opacity-90">{description}</span>
        )}
      </div>
    </Button>
  )
}
