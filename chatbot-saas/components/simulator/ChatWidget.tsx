'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import type { SimulatorMessage, RequestInspectorData } from '@/types/index'

interface ChatWidgetProps {
  botId: string
  botName: string
  welcomeMessage: string | null
  apiKey: string
  visitorContext: {
    userId?: string
    userName?: string
    userEmail?: string
    userPhone?: string
  } | null
  pageUrl: string
  pageTitle: string
  onRequest: (data: RequestInspectorData) => void
  resetKey: number
  pendingMessage: string | null
  onPendingConsumed: () => void
}

export default function ChatWidget({
  botId,
  botName,
  welcomeMessage,
  apiKey,
  visitorContext,
  pageUrl,
  pageTitle,
  onRequest,
  resetKey,
  pendingMessage,
  onPendingConsumed,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<SimulatorMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
    setStreaming(false)
  }, [resetKey])

  useEffect(() => {
    if (open && welcomeMessage && messages.length === 0) {
      setMessages([{ id: 'welcome', role: 'assistant', content: welcomeMessage }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pendingMessage) {
      setOpen(true)
      onPendingConsumed()
      // Small delay to let open state + welcome message settle
      setTimeout(() => sendMessage(pendingMessage), 50)
    }
  }, [pendingMessage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || streaming) return
    if (!apiKey.startsWith('cb_live_')) {
      setError('Enter a valid API key (cb_live_...) in the controls panel')
      return
    }

    setError(null)
    setInput('')
    const userMsg: SimulatorMessage = { id: crypto.randomUUID(), role: 'user', content }
    setMessages((prev) => [...prev, userMsg])

    const url = `/api/public/v1/${botId}/chat`
    // Build full conversation history (exclude welcome message, exclude streaming placeholders)
    const history = messages
      .filter((m) => m.id !== 'welcome' && !m.streaming)
      .map(({ role, content: c }) => ({ role, content: c }))
    const body = {
      messages: [...history, { role: 'user' as const, content }],
      visitorContext: {
        ...visitorContext,
        pageUrl,
        pageTitle,
      },
    }

    const maskedKey = apiKey.length > 14
      ? apiKey.slice(0, 10) + '...' + apiKey.slice(-4)
      : apiKey.slice(0, 10) + '...'

    const reqData: RequestInspectorData = {
      url,
      headers: { Authorization: `Bearer ${maskedKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body, null, 2),
      status: null,
      timeMs: null,
      responsePreview: null,
    }

    const startTime = Date.now()
    let responseText = ''
    const assistantId = crypto.randomUUID()

    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }])
    setStreaming(true)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })

      reqData.status = res.status

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
        const errMsg =
          res.status === 401
            ? 'Invalid API key. Check your key in Bot Settings.'
            : res.status === 404
            ? 'Bot not found. Check the selected bot.'
            : errJson?.error?.message ?? `HTTP ${res.status}`
        setError(errMsg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        reqData.timeMs = Date.now() - startTime
        reqData.responsePreview = JSON.stringify(errJson).slice(0, 500)
        onRequest(reqData)
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
              responseText += parsed.delta
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: responseText } : m)
              )
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
      )
      reqData.timeMs = Date.now() - startTime
      reqData.responsePreview = responseText.slice(0, 500)
      onRequest(reqData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed'
      setError(msg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      reqData.timeMs = Date.now() - startTime
      reqData.responsePreview = msg
      onRequest(reqData)
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[340px] h-[460px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shrink-0">
            <span className="font-semibold text-sm truncate">{botName || 'Chat'}</span>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity ml-2 shrink-0">
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-8">Start a conversation</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content || (msg.streaming ? (
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <Loader2 className="size-3 animate-spin" /> typing…
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
              placeholder="Type a message…"
              className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
              disabled={streaming}
            />
            <button
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
              className="text-indigo-600 hover:text-indigo-800 disabled:opacity-30 transition-colors"
            >
              {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="size-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </div>
  )
}
