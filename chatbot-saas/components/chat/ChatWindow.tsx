'use client'

import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { useChat } from '@/lib/use-chat'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import EscalationForm from './EscalationForm'
import type { RagDebugInfo } from '@/types'

export type ChatWindowRef = {
  sendMessage: (content: string) => void
}

type Props = {
  botId: string
  welcomeMessage?: string
  primaryColor?: string
  /** Override the default embed API. Pass '/api/chat' for dashboard preview. */
  apiEndpoint?: string
  /** Extra fields merged into the POST body (e.g. { botId } for /api/chat). */
  extraBody?: Record<string, unknown>
  /** Called after each message send with RAG debug info from /api/chat/debug. */
  onDebugInfo?: (info: RagDebugInfo) => void
  /** When true, show escalation widget after unanswered responses */
  showEscalation?: boolean
  /** Session ID if known (used for escalation form) */
  sessionId?: string | null
}

const UNANSWERED_PHRASES = [
  "i don't know",
  "i'm not sure",
  "i don't have information",
  "i cannot find",
  "not able to find",
  "don't have details",
]

function hasUnansweredPhrase(content: string) {
  const lower = content.toLowerCase()
  return UNANSWERED_PHRASES.some((p) => lower.includes(p))
}

const ChatWindow = forwardRef<ChatWindowRef, Props>(function ChatWindow(
  {
    botId,
    welcomeMessage,
    primaryColor = '#6366f1',
    apiEndpoint,
    extraBody,
    onDebugInfo,
    showEscalation = false,
    sessionId = null,
  },
  ref
) {
  const api = apiEndpoint ?? `/api/embed/${botId}/chat`
  const { messages, isLoading, append } = useChat({ api, body: extraBody })
  const bottomRef = useRef<HTMLDivElement>(null)
  const [lastUserMessage, setLastUserMessage] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const wrappedAppend = useCallback(
    async (content: string) => {
      setLastUserMessage(content)
      if (onDebugInfo) {
        fetch('/api/chat/debug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId,
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user' as const, content },
            ],
          }),
        })
          .then((r) => r.json())
          .then((json: { data?: RagDebugInfo }) => {
            if (json.data) onDebugInfo(json.data)
          })
          .catch(() => {})
      }
      await append(content)
    },
    [append, onDebugInfo, botId, messages]
  )

  useImperativeHandle(ref, () => ({ sendMessage: wrappedAppend }), [wrappedAppend])

  // Detect if last assistant message is unanswered
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
  const showEscalationWidget =
    showEscalation &&
    !isLoading &&
    lastAssistantMsg != null &&
    hasUnansweredPhrase(lastAssistantMsg.content)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Message list */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {welcomeMessage && (
          <MessageBubble
            role="assistant"
            content={welcomeMessage}
            primaryColor={primaryColor}
          />
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            primaryColor={primaryColor}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[var(--color-muted)] px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Escalation widget — shows after unanswered bot responses */}
      {showEscalationWidget && (
        <EscalationForm
          botId={botId}
          sessionId={sessionId}
          prefilledMessage={lastUserMessage}
          primaryColor={primaryColor}
        />
      )}

      {/* Input */}
      <ChatInput onSubmit={wrappedAppend} isLoading={isLoading} primaryColor={primaryColor} />
    </div>
  )
})

export default ChatWindow
