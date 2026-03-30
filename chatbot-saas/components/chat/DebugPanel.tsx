'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { RagDebugInfo } from '@/types'

type Props = {
  debugInfo: RagDebugInfo | null
  isVisible?: boolean
}

function SimilarityBar({ score }: { score: number }) {
  const color =
    score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
  const label =
    score >= 0.8 ? 'text-green-400' : score >= 0.6 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(score * 100, 100)}%` }}
        />
      </div>
      <span className={`font-mono text-[11px] ${label}`}>{score.toFixed(2)} match</span>
    </div>
  )
}

export default function DebugPanel({ debugInfo, isVisible = true }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  if (!isVisible || !debugInfo) return null

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-white/60">RAG Debug</span>
        {debugInfo.rag_used ? (
          <span className="rounded-full bg-green-900/60 px-2 py-0.5 text-[11px] text-green-400">
            KB Active — {debugInfo.chunks_found} chunks injected
          </span>
        ) : (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
            No KB — using persona only
          </span>
        )}
      </div>

      {/* Chunks or empty state */}
      <div className="px-4 py-3">
        {!debugInfo.rag_used ? (
          <p className="leading-relaxed text-white/40">
            No knowledge bases connected to this bot.
            <br />
            Go to Edit Bot to connect a knowledge base.
          </p>
        ) : (
          <div className="space-y-2">
            {debugInfo.chunks.map((chunk, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5">
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-start gap-2 p-2.5 text-left"
                >
                  {expanded.has(i) ? (
                    <ChevronDown className="mt-0.5 size-3 shrink-0 text-white/40" />
                  ) : (
                    <ChevronRight className="mt-0.5 size-3 shrink-0 text-white/40" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-white/50">{chunk.source}</span>
                      <SimilarityBar score={chunk.similarity} />
                    </div>
                    <p className="leading-relaxed text-white/70">
                      {expanded.has(i)
                        ? chunk.content
                        : chunk.content.substring(0, 200) +
                          (chunk.content.length > 200 ? '…' : '')}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* System prompt preview */}
        {debugInfo.system_prompt_preview && (
          <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.03] p-2.5">
            <p className="mb-1 text-[11px] text-white/30">System prompt preview</p>
            <p className="leading-relaxed text-white/50">{debugInfo.system_prompt_preview}</p>
          </div>
        )}
      </div>
    </div>
  )
}
