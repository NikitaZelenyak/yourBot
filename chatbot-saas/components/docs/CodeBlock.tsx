'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

type CodeBlockProps = {
  code: string
  language?: string
  className?: string
}

export default function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950', className)}>
      {language && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      {!language && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="size-3.5 text-green-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      )}
      <pre className="overflow-x-auto p-4 text-sm font-mono text-zinc-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
