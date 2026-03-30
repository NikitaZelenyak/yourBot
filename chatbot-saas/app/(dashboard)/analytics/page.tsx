import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, Bot, ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/motion/AnimatedGrid'
import AnalyticsBotRow from '@/components/analytics/AnalyticsBotRow'
import type { Bot as BotType, DailyMetrics } from '@/types'

export default async function AnalyticsOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: bots } = await supabase
    .from('bots')
    .select('id, name, slug, primary_color, is_active, created_at, updated_at, user_id, persona, welcome_message, avatar_url, allowed_domains')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (!bots || bots.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <BarChart3 className="size-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold">No analytics yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a bot and start conversations to see analytics
          </p>
        </div>
        <Button asChild>
          <Link href="/bots/new">Create your first bot</Link>
        </Button>
      </FadeIn>
    )
  }

  // Fetch last 7 days of daily_metrics for all bots in one query
  const botIds = bots.map((b) => b.id)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: allMetrics } = await supabase
    .from('daily_metrics')
    .select('bot_id, date, total_sessions, resolution_rate, performance_score')
    .in('bot_id', botIds)
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: true })

  const metricsByBot = new Map<string, typeof allMetrics>()
  for (const row of allMetrics ?? []) {
    const existing = metricsByBot.get(row.bot_id) ?? []
    existing.push(row)
    metricsByBot.set(row.bot_id, existing)
  }

  return (
    <div className="flex flex-col gap-6">
      <FadeIn className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last 7 days across all your bots
          </p>
        </div>
      </FadeIn>

      <div className="flex flex-col gap-3">
        {(bots as BotType[]).map((bot) => {
          const metrics = metricsByBot.get(bot.id) ?? []
          const totalSessions = metrics.reduce((s, m) => s + (m.total_sessions ?? 0), 0)
          const avgResolution =
            metrics.length > 0
              ? metrics.reduce((s, m) => s + (m.resolution_rate ?? 0), 0) / metrics.length
              : 0
          const avgPerformance =
            metrics.length > 0
              ? metrics.reduce((s, m) => s + (m.performance_score ?? 0), 0) / metrics.length
              : 0
          const sparkData = metrics.map((m) => ({ value: m.total_sessions ?? 0 }))

          return (
            <AnalyticsBotRow
              key={bot.id}
              bot={bot}
              totalSessions={totalSessions}
              resolutionRate={Math.round(avgResolution * 10) / 10}
              performanceScore={Math.round(avgPerformance * 10) / 10}
              sparkData={sparkData}
            />
          )
        })}
      </div>
    </div>
  )
}
