'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type PageRow = {
  page_url: string
  page_title: string | null
  session_count: number
  resolution_rate?: number | null
}

type Props = { pages: PageRow[] }

function truncate(s: string, max = 48) {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export default function TopPagesTable({ pages }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground uppercase tracking-wider">
            <th className="text-left py-2 pr-4 font-medium">Page URL</th>
            <th className="text-right py-2 pr-4 font-medium">Sessions</th>
            <th className="text-right py-2 font-medium">Resolution</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.page_url} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
              <td className="py-2 pr-4 font-mono text-xs max-w-[280px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={p.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate block"
                    >
                      {truncate(p.page_url)}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs break-all text-xs">
                    {p.page_url}
                  </TooltipContent>
                </Tooltip>
              </td>
              <td className="text-right py-2 pr-4 tabular-nums">{p.session_count}</td>
              <td className="text-right py-2 tabular-nums text-muted-foreground">
                {p.resolution_rate != null ? `${p.resolution_rate}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
