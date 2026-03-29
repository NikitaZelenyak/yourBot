'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@/lib/use-chat'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

type Props = {
  botId: string
  welcomeMessage?: string
  primaryColor?: string
}

export default function ChatWindow({
  botId,
  welcomeMessage,
  primaryColor = '#6366f1',
}: Props) {
  const api = `/api/embed/${botId}/chat`
  const { messages, isLoading, append } = useChat({ api })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

        {/* Typing indicator */}
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

      {/* Input */}
      <ChatInput
        onSubmit={append}
        isLoading={isLoading}
        primaryColor={primaryColor}
      />
    </div>
  )
}
