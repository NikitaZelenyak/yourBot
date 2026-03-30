'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function WasHelpful() {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)

  return (
    <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border">
      <span className="text-sm text-muted-foreground">Was this page helpful?</span>
      <button
        onClick={() => setVoted('up')}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm border transition-all',
          voted === 'up'
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400'
            : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
        )}
      >
        <ThumbsUp className="size-3.5" />
        Yes
      </button>
      <button
        onClick={() => setVoted('down')}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm border transition-all',
          voted === 'down'
            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
            : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
        )}
      >
        <ThumbsDown className="size-3.5" />
        No
      </button>
      {voted && (
        <span className="text-sm text-muted-foreground ml-1">
          {voted === 'up' ? 'Thanks for the feedback!' : 'We\'ll work on improving this.'}
        </span>
      )}
    </div>
  )
}
