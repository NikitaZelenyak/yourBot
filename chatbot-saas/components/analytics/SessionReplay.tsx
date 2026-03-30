'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ChatMessage, SessionAnalytics, Escalation, ChatSessionWithAnalytics } from '@/types'

type Props = { botId: string; sessionId: string; botName: string }

type SessionData = {
  session: ChatSessionWithAnalytics
  messages: ChatMessage[]
  analytics: SessionAnalytics | null
  escalation: Escalation | null
}

const OUTCOME_COLORS = {
  resolved: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  unresolved: 'bg-amber-500/15 text-amber-700 border-amber-200',
  abandoned: 'bg-red-500/15 text-red-600 border-red-200',
}

const UNANSWERED_PHRASES = [
  "i don't know",
  "i'm not sure",
  "i don't have information",
  "i cannot find",
  "not able to find",
  "don't have details",
]

function isUnanswered(content: string) {
  const lower = content.toLowerCase()
  return UNANSWERED_PHRASES.some((p) => lower.includes(p))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

function duration(start: string, end: string | null) {
  if (!end) return 'Active'
  const secs = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ${secs % 60}s`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function scoreColor(val: number) {
  if (val >= 80) return 'text-emerald-600'
  if (val >= 60) return 'text-amber-600'
  return 'text-red-500'
}

export default function SessionReplay({ botId, sessionId, botName }: Props) {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingEscalation, setUpdatingEscalation] = useState(false)

  useEffect(() => {
    fetch(`/api/analytics/${botId}/conversations/${sessionId}`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data) })
      .finally(() => setLoading(false))
  }, [botId, sessionId])

  async function updateEscalationStatus(status: string) {
    if (!data?.escalation) return
    setUpdatingEscalation(true)
    try {
      const res = await fetch(`/api/escalations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.escalation.id, status }),
      })
      if (res.ok) {
        toast.success('Escalation status updated')
        setData((prev) =>
          prev ? { ...prev, escalation: { ...prev.escalation!, status: status as Escalation['status'] } } : prev
        )
      } else {
        toast.error('Failed to update status')
      }
    } finally {
      setUpdatingEscalation(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading session…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Session not found</p>
        <Link href={`/analytics/${botId}/conversations`}>
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </div>
    )
  }

  const { session, messages, analytics, escalation } = data

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/analytics/${botId}/conversations`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-3.5" /> Conversations
          </Button>
        </Link>
        <h2 className="text-xl font-bold">Session replay</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left panel: metadata 40% */}
        <div className="lg:w-[40%] flex flex-col gap-3">
          {/* Visitor info */}
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-4 flex flex-col gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Visitor
              </p>
              {session.visitor_name && <Row label="Name" value={session.visitor_name} />}
              {session.visitor_email && <Row label="Email" value={session.visitor_email} />}
              {session.visitor_phone && <Row label="Phone" value={session.visitor_phone} />}
              {session.visitor_id_custom && <Row label="ID" value={session.visitor_id_custom} />}
              {!session.visitor_name && !session.visitor_email && !session.visitor_id_custom && (
                <span className="text-muted-foreground italic text-xs">Anonymous visitor</span>
              )}
            </CardContent>
          </Card>

          {/* Session info */}
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-4 flex flex-col gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Session
              </p>
              {session.page_url && (
                <div className="flex items-start gap-1">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">Page</span>
                  <a
                    href={session.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-0.5 break-all"
                  >
                    {session.page_url.length > 50 ? session.page_url.slice(0, 50) + '…' : session.page_url}
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>
              )}
              <Row label="Started" value={formatDate(session.started_at)} />
              {session.ended_at && <Row label="Ended" value={formatDate(session.ended_at)} />}
              <Row label="Duration" value={duration(session.started_at, session.ended_at)} />
              <Row label="Messages" value={String(session.message_count ?? messages.length)} />
              {session.outcome && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">Outcome</span>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] capitalize', OUTCOME_COLORS[session.outcome] ?? '')}
                  >
                    {session.outcome}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics */}
          {analytics && (
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4 flex flex-col gap-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  AI Analysis
                </p>
                {analytics.intent && <Row label="Intent" value={analytics.intent} />}
                {analytics.sentiment && <Row label="Sentiment" value={analytics.sentiment} />}
                {analytics.performance_score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">Score</span>
                    <span className={cn('text-sm font-bold', scoreColor(analytics.performance_score))}>
                      {analytics.performance_score}
                    </span>
                  </div>
                )}
                {analytics.topics && analytics.topics.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Topics</span>
                    <div className="flex flex-wrap gap-1">
                      {analytics.topics.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Escalation */}
          {escalation && (
            <Card className="shadow-sm border-red-200">
              <CardContent className="pt-4 pb-4 flex flex-col gap-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">
                  Escalation
                </p>
                {escalation.visitor_name && <Row label="Name" value={escalation.visitor_name} />}
                <Row label="Email" value={escalation.visitor_email} />
                {escalation.message && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Message</span>
                    <p className="text-xs bg-muted rounded p-2 break-words">{escalation.message}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">Status</span>
                  <Select
                    value={escalation.status}
                    onValueChange={updateEscalationStatus}
                    disabled={updatingEscalation}
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel: messages 60% */}
        <div className="lg:w-[60%]">
          <Card className="shadow-sm h-full">
            <CardContent className="pt-4 pb-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conversation
              </p>
              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
                {messages.map((msg) => {
                  const unanswered = msg.role === 'assistant' && isUnanswered(msg.content)
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col gap-0.5',
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      )}
                    >
                      {unanswered && (
                        <div className="flex items-center gap-1 text-amber-600 text-[10px] mb-0.5">
                          <AlertTriangle className="size-2.5" />
                          Couldn&apos;t answer
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words',
                          msg.role === 'user'
                            ? 'rounded-br-sm bg-indigo-600 text-white'
                            : cn(
                                'rounded-bl-sm bg-muted text-foreground',
                                unanswered ? 'border border-amber-400' : ''
                              )
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Analysis footer */}
              <div className="border-t pt-2 text-[10px] text-muted-foreground">
                {analytics
                  ? `This session was analyzed by AI on ${new Date(analytics.analyzed_at).toLocaleDateString()}`
                  : 'Pending analysis (runs nightly)'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-xs break-words">{value}</span>
    </div>
  )
}
