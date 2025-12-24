import { EmptyState } from '@/components/ui/empty-state'
import { MessageSquare } from 'lucide-react'

export default function CustomerMessagesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Messages / Updates</h1>
        <p className="text-gray-600">Communicate with your project team</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-12">
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No messages"
          description="Project updates and messages from your team will appear here."
        />
      </div>
    </div>
  )
}
