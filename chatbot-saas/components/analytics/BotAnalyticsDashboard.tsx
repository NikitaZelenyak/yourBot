'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import MetricCard from './MetricCard'
import SessionsLineChart from './SessionsLineChart'
import OutcomeBarChart from './OutcomeBarChart'
import SentimentPieChart from './SentimentPieChart'
import UsageHeatmap from './UsageHeatmap'
import TopPagesTable from './TopPagesTable'
import type { DailyMetrics } from '@/types'

type Props = {
  botId: string
  botName: string
  primaryColor: string
}

type AnalyticsData = {
  daily_metrics: DailyMetrics[]
  performance_score: number
  summary: {
    total_sessions: number
    total_messages: number
    resolution_rate: number
    open_unanswered_questions: number
  }
  top_pages: { page_url: string; page_title: string | null; session_count: number }[]
}

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' },
]

export default function BotAnalyticsDashboard({ botId, botName, primaryColor }: Props) {
  const [days, setDays] = useState('30')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [escalationCount, setEscalationCount] = useState(0)
  const [uniqueVisitors, setUniqueVisitors] = useState(0)
  const [uniquePages, setUniquePages] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/${botId}`)
      const json = await res.json()
      if (json.data) setData(json.data)

      // Fetch escalations count from sessions
      const sessRes = await fetch(`/api/analytics/${botId}/conversations?limit=1`)
      const sessJson = await sessRes.json()
      if (sessJson.data) {
        // approximate unique visitors from summary
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [botId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = data?.daily_metrics.slice(0, parseInt(days)) ?? []
  const totalSessions = filtered.reduce((s, m) => s + m.total_sessions, 0)
  const avgResolution =
    filtered.length > 0
      ? filtered.reduce((s, m) => s + m.resolution_rate, 0) / filtered.length
      : 0
  const avgMessages =
    filtered.length > 0
      ? filtered.reduce((s, m) => s + m.avg_messages_per_session, 0) / filtered.length
      : 0
  const perfScore = data?.performance_score ?? 0

  // Trend vs previous period
  const half = Math.floor(filtered.length / 2)
  const recentHalf = filtered.slice(0, half)
  const olderHalf = filtered.slice(half)
  const recentResolution =
    recentHalf.length > 0
      ? recentHalf.reduce((s, m) => s + m.resolution_rate, 0) / recentHalf.length
      : 0
  const olderResolution =
    olderHalf.length > 0
      ? olderHalf.reduce((s, m) => s + m.resolution_rate, 0) / olderHalf.length
      : 0
  const resolutionTrend: 'up' | 'down' | 'flat' =
    recentResolution > olderResolution + 2
      ? 'up'
      : recentResolution < olderResolution - 2
      ? 'down'
      : 'flat'

  const chartData = [...filtered].reverse()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="size-3.5" /> Back
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{botName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Analytics dashboard</p>
          </div>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total sessions" value={totalSessions} />
        <MetricCard
          label="Resolution rate"
          value={`${Math.round(avgResolution * 10) / 10}%`}
          trend={resolutionTrend}
          trendLabel="vs previous period"
        />
        <MetricCard
          label="Avg messages / session"
          value={Math.round(avgMessages * 10) / 10}
        />
        <MetricCard
          label="Performance score"
          value={perfScore}
          colorCode
          subtext="0–100 composite"
        />
      </div>

      {/* Charts */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Loading charts…
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sessions per day</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionsLineChart data={chartData} primaryColor={primaryColor} />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outcome breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <OutcomeBarChart data={chartData} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sentiment distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <SentimentPieChart
                  positive={filtered.reduce((s, m) => s + (m.resolved_count ?? 0), 0)}
                  neutral={filtered.reduce((s, m) => s + (m.unresolved_count ?? 0), 0)}
                  negative={filtered.reduce((s, m) => s + (m.abandoned_count ?? 0), 0)}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peak usage heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <UsageHeatmap botId={botId} />
              </CardContent>
            </Card>
          </div>

          {/* Top pages */}
          {data && data.top_pages.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top pages</CardTitle>
              </CardHeader>
              <CardContent>
                <TopPagesTable pages={data.top_pages} />
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Unique visitors</p>
                <p className="text-xl font-bold mt-0.5">{data?.summary.total_sessions ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Unique pages</p>
                <p className="text-xl font-bold mt-0.5">{data?.top_pages.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Open questions</p>
                <Link href={`/analytics/${botId}/unanswered`} className="flex items-center gap-1 text-primary hover:underline mt-0.5">
                  <p className="text-xl font-bold">{data?.summary.open_unanswered_questions ?? 0}</p>
                  <ExternalLink className="size-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total messages</p>
                <p className="text-xl font-bold mt-0.5">{data?.summary.total_messages ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Sub-navigation */}
      <div className="flex gap-2 flex-wrap border-t pt-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/analytics/${botId}/conversations`}>Conversations</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/analytics/${botId}/topics`}>Topics</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/analytics/${botId}/unanswered`}>Unanswered</Link>
        </Button>
      </div>
    </div>
  )
}
