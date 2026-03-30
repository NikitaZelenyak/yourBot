'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, FlaskConical } from 'lucide-react'
import ChatWindow, { type ChatWindowRef } from '@/components/chat/ChatWindow'
import DebugPanel from '@/components/chat/DebugPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Bot, RagDebugInfo } from '@/types'

type KbConnection = {
  kb_id: string
  knowledge_bases: { id: string; name: string; description: string | null } | null
}

export default function TestBotPage() {
  const params = useParams()
  const id = params.id as string
  const chatRef = useRef<ChatWindowRef>(null)

  const [bot, setBot] = useState<Bot | null>(null)
  const [kbs, setKbs] = useState<KbConnection[]>([])
  const [debugInfo, setDebugInfo] = useState<RagDebugInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/bots/${id}`).then((r) => r.json()),
      fetch(`/api/bots/${id}/knowledge-bases`).then((r) => r.json()),
    ])
      .then(([botJson, kbJson]) => {
        setBot(botJson.data ?? null)
        setKbs(kbJson.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="font-medium">Bot not found</p>
        <Button asChild variant="outline">
          <Link href="/bots">Back to bots</Link>
        </Button>
      </div>
    )
  }

  const suggested = [
    `What information do you have about ${bot.name}?`,
    'Summarize what you know',
    'What topics can you help with?',
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/bots/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <FlaskConical className="size-4 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Test: {bot.name}</h1>
      </div>

      {/* Two-column layout */}
      <div className="flex items-start gap-4">
        {/* Left: Chat (fixed height) */}
        <div className="flex h-[560px] w-3/5 flex-col overflow-hidden rounded-xl border bg-card">
          <ChatWindow
            ref={chatRef}
            botId={id}
            welcomeMessage={bot.welcome_message ?? undefined}
            primaryColor={bot.primary_color}
            apiEndpoint="/api/chat"
            extraBody={{ botId: id }}
            onDebugInfo={setDebugInfo}
          />
        </div>

        {/* Right: Info + Debug */}
        <div className="flex w-2/5 flex-col gap-4">
          {/* Bot config */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium">Bot Config</h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">{bot.name}</span>
                <span className="ml-1">· /{bot.slug}</span>
              </div>
              {bot.persona && (
                <p className="rounded bg-muted p-2 font-mono text-[11px]">
                  {bot.persona.substring(0, 100)}
                  {bot.persona.length > 100 ? '…' : ''}
                </p>
              )}
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium">Connected KBs</p>
              {kbs.length === 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="size-3.5" />
                  No knowledge bases connected
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {kbs.map((conn) => (
                    <Badge key={conn.kb_id} variant="secondary" className="text-xs">
                      {conn.knowledge_bases?.name ?? conn.kb_id}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Debug panel */}
          {debugInfo && <DebugPanel debugInfo={debugInfo} />}

          {/* Quick prompts */}
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium">Quick test prompts</h2>
            <div className="space-y-2">
              {suggested.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => chatRef.current?.sendMessage(prompt)}
                  className="w-full rounded-lg border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
