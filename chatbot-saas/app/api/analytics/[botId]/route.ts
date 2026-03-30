import { createClient } from '@/lib/supabase/server'
import type { DailyMetrics } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  console.log('[analytics-overview] GET botId:', botId)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  // Verify bot belongs to user
  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', botId)
    .eq('user_id', user.id)
    .single()

  if (!bot) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  // 1. Last 30 days of daily_metrics
  const { data: dailyMetrics } = await supabase
    .from('daily_metrics')
    .select('id, bot_id, date, total_sessions, total_messages, avg_messages_per_session, resolved_count, unresolved_count, abandoned_count, resolution_rate, performance_score, unique_visitors, unique_pages')
    .eq('bot_id', botId)
    .order('date', { ascending: false })
    .limit(30)

  // 2. Average performance_score of last 7 days
  const { data: last7Days } = await supabase
    .from('daily_metrics')
    .select('performance_score')
    .eq('bot_id', botId)
    .order('date', { ascending: false })
    .limit(7)

  const performanceScore = last7Days && last7Days.length > 0
    ? last7Days.reduce((sum, row) => sum + (row.performance_score ?? 0), 0) / last7Days.length
    : 0

  // 3. Summary from bot_analytics_summary view
  const { data: summaryRow } = await supabase
    .from('bot_analytics_summary')
    .select('total_sessions, total_messages, resolution_rate, open_unanswered_questions')
    .eq('bot_id', botId)
    .single()

  const summary = {
    total_sessions: (summaryRow as { total_sessions: number } | null)?.total_sessions ?? 0,
    total_messages: (summaryRow as { total_messages: number } | null)?.total_messages ?? 0,
    resolution_rate: (summaryRow as { resolution_rate: number } | null)?.resolution_rate ?? 0,
    open_unanswered_questions: (summaryRow as { open_unanswered_questions: number } | null)?.open_unanswered_questions ?? 0,
  }

  // 4. Top 5 pages by session count in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: topPagesRaw } = await supabase
    .from('chat_sessions')
    .select('page_url, page_title')
    .eq('bot_id', botId)
    .not('page_url', 'is', null)
    .gte('started_at', thirtyDaysAgo)

  // Aggregate top pages client-side since Supabase JS doesn't support GROUP BY directly
  const pageCountMap = new Map<string, { page_url: string; page_title: string | null; session_count: number }>()
  for (const row of topPagesRaw ?? []) {
    const key = row.page_url!
    const existing = pageCountMap.get(key)
    if (existing) {
      existing.session_count++
    } else {
      pageCountMap.set(key, {
        page_url: row.page_url!,
        page_title: row.page_title ?? null,
        session_count: 1,
      })
    }
  }
  const topPages = Array.from(pageCountMap.values())
    .sort((a, b) => b.session_count - a.session_count)
    .slice(0, 5)

  return Response.json({
    data: {
      daily_metrics: (dailyMetrics ?? []) as DailyMetrics[],
      performance_score: Math.round(performanceScore * 10) / 10,
      summary,
      top_pages: topPages,
    },
  })
}
