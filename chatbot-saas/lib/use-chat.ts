// Minimal useChat hook compatible with ai/react interface.
// @ai-sdk/react is not installed — this fills the gap until it is.
// Replace with: import { useChat } from '@ai-sdk/react' once @ai-sdk/react is added.

import { useState, useCallback } from 'react'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type UseChatOptions = {
  api: string
  initialMessages?: ChatMessage[]
  body?: Record<string, unknown>
}

type UseChatReturn = {
  messages: ChatMessage[]
  isLoading: boolean
  append: (content: string) => Promise<void>
}

function uid() {
  return Math.random().toString(36).slice(2)
}

export function useChat({ api, initialMessages = [], body }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)

  const append = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = { id: uid(), role: 'user', content }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      const assistantId = uid()

      try {
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            ...body,
          }),
        })

        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status}`)
        }

        // Add empty assistant placeholder immediately
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process all complete SSE lines in buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? '' // keep incomplete last chunk

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]' || !payload) continue

            try {
              const chunk = JSON.parse(payload)
              if (chunk.type === 'text-delta' && typeof chunk.delta === 'string') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + chunk.delta }
                      : m
                  )
                )
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
      } catch (err) {
        // Remove empty assistant placeholder on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api, messages]
  )

  return { messages, isLoading, append }
}
