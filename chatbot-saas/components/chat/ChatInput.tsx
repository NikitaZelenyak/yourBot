'use client'

import { useRef, KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

type Props = {
  onSubmit: (message: string) => void
  isLoading: boolean
  primaryColor?: string
}

export default function ChatInput({ onSubmit, isLoading, primaryColor = '#6366f1' }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function resize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function submit() {
    const el = textareaRef.current
    if (!el) return
    const value = el.value.trim()
    if (!value || isLoading) return
    onSubmit(value)
    el.value = ''
    el.style.height = 'auto'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t bg-white px-3 py-2">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Type a message..."
        disabled={isLoading}
        onInput={resize}
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm outline-none placeholder:text-gray-400 disabled:opacity-50"
        style={{ maxHeight: '120px' }}
      />
      <button
        onClick={submit}
        disabled={isLoading}
        className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: primaryColor }}
        aria-label="Send message"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  )
}
