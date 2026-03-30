'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import DocumentUpload from '@/components/knowledge-base/DocumentUpload'
import DocumentRow from '@/components/knowledge-base/DocumentRow'
import KbSkeleton from '@/components/knowledge-base/KbSkeleton'
import type { KnowledgeBase, KbDocument } from '@/types'

export default function KnowledgeBaseDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [kb, setKb] = useState<KnowledgeBase | null>(null)
  const [docs, setDocs] = useState<KbDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Inline edit state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false)

  // Polling
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/knowledge-bases/${id}/documents`)
    const json = await res.json()
    if (json.data) setDocs(json.data)
  }, [id])

  const fetchKb = useCallback(async () => {
    const res = await fetch(`/api/knowledge-bases/${id}`)
    const json = await res.json()
    if (json.error?.code === 'NOT_FOUND') {
      setNotFound(true)
    } else if (json.data) {
      setKb(json.data)
      setEditName(json.data.name)
      setEditDesc(json.data.description ?? '')
    }
  }, [id])

  useEffect(() => {
    Promise.all([fetchKb(), fetchDocs()]).finally(() => setLoading(false))
  }, [fetchKb, fetchDocs])

  // Auto-poll while any doc is processing
  useEffect(() => {
    const hasProcessing = docs.some((d) => d.status === 'processing')

    if (hasProcessing && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        fetchDocs()
      }, 3000)
    }

    if (!hasProcessing && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [docs, fetchDocs])

  async function handleSaveEdit() {
    if (!editName.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/knowledge-bases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to save changes')
        return
      }
      setKb(json.data)
      setEditing(false)
      toast.success('Changes saved')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    if (kb) {
      setEditName(kb.name)
      setEditDesc(kb.description ?? '')
    }
    setEditing(false)
  }

  function handleUploadSuccess() {
    setUploadOpen(false)
    fetchDocs()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <Separator />
        <KbSkeleton />
      </div>
    )
  }

  if (notFound || !kb) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="font-medium">Knowledge base not found</p>
        <Button asChild variant="outline">
          <a href="/knowledge-bases">Back to knowledge bases</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* KB Info section */}
      <div className="space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                placeholder="Knowledge base name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What kind of information does this KB contain?"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{kb.name}</h1>
              {kb.description && (
                <p className="mt-1 text-sm text-muted-foreground">{kb.description}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Documents section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Documents</h2>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            Upload document
          </Button>
        </div>

        {docs.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No documents yet — upload your first file
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {docs.map((doc) => (
              <DocumentRow
                key={doc.id}
                kbId={id}
                doc={doc}
                onDeleted={fetchDocs}
                onReprocessed={fetchDocs}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <DocumentUpload kbId={id} onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
