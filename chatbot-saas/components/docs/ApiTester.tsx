'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ApiTesterProps = {
  defaultBotId?: string
}

export default function ApiTester({ defaultBotId }: ApiTesterProps) {
  const [botId, setBotId] = useState(defaultBotId ?? '')
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState('Hello, can you help me?')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiKeyRef = useRef(apiKey)
  apiKeyRef.current = apiKey

  // Clear API key on unmount (page leave)
  useEffect(() => {
    return () => {
      setApiKey('')
    }
  }, [])

  async function handleSend() {
    if (!botId.trim() || !apiKey.trim() || !message.trim()) return
    setError(null)
    setLoading(true)

    const userMessage = message.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setMessage('')

    try {
      const response = await fetch(`/api/public/v1/${botId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKeyRef.current}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error?.message ?? `HTTP ${response.status}`)
      }

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
              assistantText += parsed.delta
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold text-foreground">Try it — live API tester</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Makes a real request to your bot. Your API key is used only in your browser.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Security note */}
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 dark:bg-blue-950/20 dark:border-blue-800">
          <ShieldCheck className="size-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Your API key is only used in your browser and never sent to our servers except to make the API call directly to the endpoint above.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tester-bot-id" className="text-xs">Bot ID</Label>
            <Input
              id="tester-bot-id"
              value={botId}
              onChange={e => setBotId(e.target.value)}
              placeholder="e.g. my-support-bot"
              className="font-mono text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tester-api-key" className="text-xs">API Key</Label>
            <Input
              id="tester-api-key"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="cb_live_..."
              className="font-mono text-xs h-8"
            />
          </div>
        </div>

        {/* Chat thread */}
        {messages.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg bg-muted/30 border border-border p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground'
                  )}
                >
                  {msg.content || <span className="animate-pulse">▋</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 dark:bg-red-950/20 dark:border-red-800">
            <AlertCircle className="size-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="text-sm h-9"
            onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSend() }}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !botId.trim() || !apiKey.trim() || !message.trim()}
            size="sm"
            className="h-9 px-3 shrink-0"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
