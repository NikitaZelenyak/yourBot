'use client'

import { useState } from 'react'
import { FileText, FileSpreadsheet, File, Trash2, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils/time'
import type { KbDocument } from '@/types'

interface Props {
  kbId: string
  doc: KbDocument
  onDeleted: () => void
  onReprocessed?: () => void
}

function FileIcon({ fileType }: { fileType: string }) {
  const type = fileType.toLowerCase()
  if (type === 'csv') return <FileSpreadsheet className="size-5 text-muted-foreground" />
  if (type === 'pdf' || type === 'docx' || type === 'doc' || type === 'txt') {
    return <FileText className="size-5 text-muted-foreground" />
  }
  return <File className="size-5 text-muted-foreground" />
}

function StatusBadge({ doc }: { doc: KbDocument }) {
  if (doc.status === 'processing') {
    return (
      <Badge className="border-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
        <Loader2 className="size-3 animate-spin" />
        Processing...
      </Badge>
    )
  }
  if (doc.status === 'ready') {
    return (
      <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Ready
      </Badge>
    )
  }
  return (
    <span title={doc.error_message ?? 'Processing failed'}>
      <Badge className="border-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        Failed
      </Badge>
    </span>
  )
}

export default function DocumentRow({ kbId, doc, onDeleted, onReprocessed }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      const res = await fetch(
        `/api/knowledge-bases/${kbId}/documents/${doc.id}/reprocess`,
        { method: 'POST' }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Reprocess failed')
        return
      }
      toast.success('Document reprocessed successfully')
      onReprocessed?.()
    } finally {
      setRetrying(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}/documents/${doc.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to delete document')
        return
      }
      toast.success('Document deleted')
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <FileIcon fileType={doc.file_type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.filename}</p>
        <p className="text-xs text-muted-foreground">
          {timeAgo(doc.created_at)}
          {doc.status === 'ready' && doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
        </p>
      </div>
      <Badge variant="outline" className="hidden shrink-0 sm:flex">
        {doc.file_type.toUpperCase()}
      </Badge>
      <StatusBadge doc={doc} />
      {doc.status === 'failed' && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-primary"
          onClick={handleRetry}
          disabled={retrying}
          title="Retry processing"
        >
          {retrying ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
