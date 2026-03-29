'use client'

import { motion } from 'framer-motion'

type Props = {
  role: 'user' | 'assistant'
  content: string
  primaryColor?: string
}

export default function MessageBubble({ role, content, primaryColor = '#6366f1' }: Props) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'rounded-2xl rounded-br-sm text-white'
            : 'rounded-2xl rounded-bl-sm bg-[var(--color-muted)] text-[var(--color-foreground)]'
        }`}
        style={isUser ? { backgroundColor: primaryColor } : undefined}
      >
        {content}
      </div>
    </motion.div>
  )
}
