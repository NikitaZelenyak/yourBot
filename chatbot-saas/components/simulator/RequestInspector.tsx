'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { RequestInspectorData } from '@/types/index'

interface RequestInspectorProps {
  data: RequestInspectorData | null
}

export default function RequestInspector({ data }: RequestInspectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          Request Inspector
        </span>
        {data?.status != null && (
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              data.status >= 200 && data.status < 300
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {data.status} {data.timeMs != null ? `· ${data.timeMs}ms` : ''}
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3 text-xs font-mono bg-background">
          {!data ? (
            <p className="text-muted-foreground italic text-sm font-sans">No request made yet. Send a message in the widget.</p>
          ) : (
            <>
              <div>
                <p className="text-muted-foreground mb-1 font-sans font-medium text-xs uppercase tracking-wide">URL</p>
                <p className="bg-muted rounded px-2 py-1.5 break-all">{data.url}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 font-sans font-medium text-xs uppercase tracking-wide">Headers</p>
                <pre className="bg-muted rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap">
                  {Object.entries(data.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                </pre>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 font-sans font-medium text-xs uppercase tracking-wide">Request Body</p>
                <pre className="bg-muted rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap">{data.body}</pre>
              </div>
              {data.responsePreview != null && (
                <div>
                  <p className="text-muted-foreground mb-1 font-sans font-medium text-xs uppercase tracking-wide">
                    Response Preview (first 500 chars)
                  </p>
                  <pre className="bg-muted rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap break-all">
                    {data.responsePreview}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
