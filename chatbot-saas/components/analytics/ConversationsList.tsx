'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SessionRow = {
  id: string
  started_at: string
  ended_at: string | null
  message_count: number
  outcome: 'resolved' | 'unresolved' | 'abandoned' | null
  page_url: string | null
  visitor_id_custom: string | null
  visitor_name: string | null
  visitor_email: string | null
  has_escalation: boolean
}

type Props = { botId: string; botName: string }

const OUTCOME_COLORS = {
  resolved: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  unresolved: 'bg-amber-500/15 text-amber-700 border-amber-200',
  abandoned: 'bg-red-500/15 text-red-600 border-red-200',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function duration(start: string, end: string | null) {
  if (!end) return 'Active'
  const secs = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function truncateUrl(url: string, max = 40) {
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    return path.length > max ? path.slice(0, max) + '…' : path
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url
  }
}

export default function ConversationsList({ botId, botName }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (outcome !== 'all') params.set('outcome', outcome)
    if (debouncedSearch) params.set('search', debouncedSearch)

    try {
      const res = await fetch(`/api/analytics/${botId}/conversations?${params}`)
      const json = await res.json()
      if (json.data) {
        setSessions(json.data.sessions)
        setTotal(json.data.pagination.total)
      }
    } finally {
      setLoading(false)
    }
  }, [botId, page, outcome, debouncedSearch])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / 20)

  function visitorLabel(s: SessionRow) {
    return s.visitor_name ?? s.visitor_email ?? s.visitor_id_custom ?? 'Anonymous'
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/analytics/${botId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-3.5" /> {botName}
          </Button>
        </Link>
        <h2 className="text-xl font-bold">Conversations</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search visitor…"
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={outcome} onValueChange={(v) => { setOutcome(v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('Export coming soon')}
          className="gap-1.5"
        >
          <Download className="size-3.5" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Visitor</th>
              <th className="text-left px-4 py-2.5 font-medium">Page</th>
              <th className="text-left px-4 py-2.5 font-medium">Outcome</th>
              <th className="text-right px-4 py-2.5 font-medium">Messages</th>
              <th className="text-right px-4 py-2.5 font-medium">Duration</th>
              <th className="text-right px-4 py-2.5 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  Loading…
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No conversations found
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-t cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => router.push(`/analytics/${botId}/conversations/${s.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{visitorLabel(s)}</span>
                    {s.has_escalation && (
                      <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-4 border-red-300 text-red-600">
                        Escalated
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                    {s.page_url ? truncateUrl(s.page_url) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.outcome ? (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] capitalize', OUTCOME_COLORS[s.outcome])}
                      >
                        {s.outcome}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.message_count}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {duration(s.started_at, s.ended_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums text-xs">
                    {relativeTime(s.started_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">
            {total} conversation{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
