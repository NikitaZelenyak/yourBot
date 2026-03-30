'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { KnowledgeBase } from '@/types'

type ConnectedKb = {
  kb_id: string
  created_at: string
  knowledge_bases: { id: string; name: string; description: string | null }
}

interface Props {
  botId: string
}

export default function KbManager({ botId }: Props) {
  const [connected, setConnected] = useState<ConnectedKb[]>([])
  const [allKbs, setAllKbs] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const fetchConnected = useCallback(async () => {
    const res = await fetch(`/api/bots/${botId}/knowledge-bases`)
    const json = await res.json()
    if (json.data) setConnected(json.data)
  }, [botId])

  useEffect(() => {
    fetchConnected().finally(() => setLoading(false))
  }, [fetchConnected])

  async function openDialog() {
    const res = await fetch('/api/knowledge-bases')
    const json = await res.json()
    if (json.data) setAllKbs(json.data)
    setSelectedKbId(null)
    setDialogOpen(true)
  }

  const connectedIds = new Set(connected.map((c) => c.kb_id))
  const availableKbs = allKbs.filter((kb) => !connectedIds.has(kb.id))

  async function handleConnect() {
    if (!selectedKbId) return
    setConnecting(true)
    try {
      const res = await fetch(`/api/bots/${botId}/knowledge-bases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kbId: selectedKbId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to connect knowledge base')
        return
      }
      toast.success('Knowledge base connected')
      setDialogOpen(false)
      fetchConnected()
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect(kbId: string, kbName: string) {
    if (!window.confirm(`Disconnect "${kbName}" from this bot?`)) return
    setDisconnecting(kbId)
    try {
      const res = await fetch(`/api/bots/${botId}/knowledge-bases`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kbId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to disconnect knowledge base')
        return
      }
      toast.success('Knowledge base disconnected')
      fetchConnected()
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Knowledge Bases</h2>
          <p className="text-sm text-muted-foreground">
            Give this bot access to custom knowledge from your documents.
          </p>
        </div>
        <Button size="sm" onClick={openDialog}>
          <Plus className="mr-1.5 size-3.5" />
          Connect knowledge base
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : connected.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No knowledge bases connected.{' '}
          <span className="block mt-1">Connect a KB to give this bot access to custom knowledge.</span>
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {connected.map((c) => (
            <div key={c.kb_id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.knowledge_bases.name}</p>
                {c.knowledge_bases.description && (
                  <p className="truncate text-xs text-muted-foreground">{c.knowledge_bases.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDisconnect(c.kb_id, c.knowledge_bases.name)}
                disabled={disconnecting === c.kb_id}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect knowledge base</DialogTitle>
          </DialogHeader>
          {availableKbs.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {allKbs.length === 0 ? (
                <>
                  No knowledge bases yet.{' '}
                  <Link href="/knowledge-bases/new" className="underline underline-offset-2">
                    Create one first
                  </Link>
                </>
              ) : (
                'All your knowledge bases are already connected.'
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {availableKbs.map((kb) => (
                <button
                  key={kb.id}
                  onClick={() => setSelectedKbId(kb.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted ${
                    selectedKbId === kb.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <p className="text-sm font-medium">{kb.name}</p>
                  {kb.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{kb.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!selectedKbId || connecting || availableKbs.length === 0}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
