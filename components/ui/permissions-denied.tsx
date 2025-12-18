import { Lock } from 'lucide-react'
import { EmptyState } from './empty-state'

export function PermissionsDenied({ message = 'You do not have permission to access this page.' }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <EmptyState
        icon={Lock}
        title="Access Denied"
        description={message}
      />
    </div>
  )
}
