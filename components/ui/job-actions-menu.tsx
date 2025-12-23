'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  FileText,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobActionsMenuProps {
  jobId: string
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onExport: () => void
  onGenerateInvoice: () => void
}

export function JobActionsMenu({
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onGenerateInvoice,
}: JobActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-foreground/70" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-base border border-accent/20 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleAction(onView)}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/10 flex items-center gap-2 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View job details
            </button>
            
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/10 flex items-center gap-2 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit job (status)
            </button>
            
            <button
              onClick={() => handleAction(onDuplicate)}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/10 flex items-center gap-2 transition-colors"
            >
              <Copy className="h-4 w-4" />
              Duplicate job
            </button>
            
            <button
              onClick={() => handleAction(onExport)}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/10 flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export job data
            </button>
            
            <button
              onClick={() => handleAction(onGenerateInvoice)}
              className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent/10 flex items-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Generate Invoice
            </button>
            
            <div className="border-t border-accent/20 my-1" />
            
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete job
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

