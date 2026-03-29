'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, Check, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { ApiKeyPublic, ApiKeyCreated } from '@/types'

type Props = { botId: string }

function formatDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function ApiKeyManager({ botId }: Props) {
  const [keys, setKeys] = useState<ApiKeyPublic[]>([])
  const [loading, setLoading] = useState(true)

  // Generate dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [created, setCreated] = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchKeys = useCallback(async () => {
    const res = await fetch(`/api/bots/${botId}/keys`)
    const json = await res.json()
    if (json.data) setKeys(json.data)
    setLoading(false)
  }, [botId])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  async function handleGenerate() {
    setGenerating(true)
    const res = await fetch(`/api/bots/${botId}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim() || undefined }),
    })
    const json = await res.json()
    setGenerating(false)

    if (!res.ok) {
      toast.error(json.error?.message ?? 'Failed to generate key')
      return
    }

    setCreated(json.data)
    setLabel('')
  }

  async function handleDelete(keyId: string) {
    if (!window.confirm('Delete this API key? Any apps using it will stop working.')) return

    const res = await fetch(`/api/keys/${keyId}`, { method: 'DELETE' })
    const json = await res.json()

    if (!res.ok) {
      toast.error(json.error?.message ?? 'Failed to delete key')
      return
    }

    setKeys((prev) => prev.filter((k) => k.id !== keyId))
    toast.success('API key deleted')
  }

  function handleCopy() {
    if (!created) return
    navigator.clipboard.writeText(created.rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCloseDialog() {
    if (created) {
      fetchKeys()
      setCreated(null)
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Use these keys to call your bot from your backend.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 size-3.5" />
          Generate API key
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No API keys yet. Generate one to start using the public API.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{key.label ?? 'Unnamed key'}</p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(key.created_at)} · Last used {formatDate(key.last_used_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(key.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{created ? 'API key generated' : 'Generate API key'}</DialogTitle>
          </DialogHeader>

          {created ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="font-medium text-amber-700 dark:text-amber-400">
                  Copy this key now. You will never see it again.
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
                  {created.rawKey}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="key-label">Label (optional)</Label>
              <Input
                id="key-label"
                placeholder="e.g. Production website"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          <DialogFooter>
            {created ? (
              <Button onClick={handleCloseDialog}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
