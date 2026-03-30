'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { UnansweredQuestion } from '@/types'

type Props = { botId: string; botName: string }
type TabStatus = 'open' | 'kb_updated' | 'ignored'

type SummaryData = {
  open: number
  kb_updated: number
  ignored: number
  thisMonth: number
}

export default function UnansweredQuestions({ botId, botName }: Props) {
  const [tab, setTab] = useState<TabStatus>('open')
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryData>({ open: 0, kb_updated: 0, ignored: 0, thisMonth: 0 })

  const loadSummary = useCallback(async () => {
    try {
      const [openRes, kbRes] = await Promise.all([
        fetch(`/api/analytics/${botId}/unanswered?status=open&limit=1`),
        fetch(`/api/analytics/${botId}/unanswered?status=kb_updated&limit=1`),
      ])
      const [openJson, kbJson] = await Promise.all([openRes.json(), kbRes.json()])
      setSummary({
        open: openJson.data?.pagination?.total ?? 0,
        kb_updated: kbJson.data?.pagination?.total ?? 0,
        ignored: 0,
        thisMonth: openJson.data?.pagination?.total ?? 0,
      })
    } catch {
      // silent
    }
  }, [botId])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/analytics/${botId}/unanswered?status=${tab}&page=${page}&limit=20`
      )
      const json = await res.json()
      if (json.data) {
        setQuestions(json.data.questions)
        setTotal(json.data.pagination.total)
      }
    } finally {
      setLoading(false)
    }
  }, [botId, tab, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadSummary() }, [loadSummary])

  const totalPages = Math.ceil(total / 20)

  async function updateStatus(id: string, status: TabStatus) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/analytics/${botId}/unanswered/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        if (status === 'kb_updated') {
          toast.success('Marked as KB Updated — consider adding this to your knowledge base')
        } else {
          toast.success('Status updated')
        }
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        setTotal((t) => t - 1)
        loadSummary()
      } else {
        toast.error('Failed to update status')
      }
    } finally {
      setUpdating(null)
    }
  }

  const emptyMessages: Record<TabStatus, { title: string; desc: string }> = {
    open: {
      title: 'No open questions',
      desc: 'All unanswered questions have been addressed',
    },
    kb_updated: {
      title: 'No KB-updated questions',
      desc: 'Mark questions as KB Updated when you add them to your knowledge base',
    },
    ignored: {
      title: 'No ignored questions',
      desc: 'Questions you choose to ignore will appear here',
    },
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
        <h2 className="text-xl font-bold">Unanswered Questions</h2>
      </div>

      {/* Summary card */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium">
            <span className="text-xl font-bold">{summary.thisMonth}</span> questions your bot
            couldn&apos;t answer this month
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.kb_updated} marked as resolved, {summary.open} still open
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabStatus); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="open">
            Open{summary.open > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 h-4">{summary.open}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="kb_updated">KB Updated</TabsTrigger>
          <TabsTrigger value="ignored">Ignored</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Question</th>
              <th className="text-center px-4 py-2.5 font-medium">Frequency</th>
              <th className="text-left px-4 py-2.5 font-medium">Page</th>
              <th className="text-left px-4 py-2.5 font-medium">First asked</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  Loading…
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="font-medium text-sm">{emptyMessages[tab].title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{emptyMessages[tab].desc}</p>
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-sm">{q.question}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      ×{q.frequency}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                    {q.page_url ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(q.asked_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {tab === 'open' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={updating === q.id}
                            onClick={() => updateStatus(q.id, 'kb_updated')}
                          >
                            Mark as KB Updated
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            disabled={updating === q.id}
                            onClick={() => updateStatus(q.id, 'ignored')}
                          >
                            Ignore
                          </Button>
                        </>
                      )}
                      {(tab === 'kb_updated' || tab === 'ignored') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={updating === q.id}
                          onClick={() => updateStatus(q.id, 'open')}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
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
          <span className="text-muted-foreground text-xs">{total} question{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
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
