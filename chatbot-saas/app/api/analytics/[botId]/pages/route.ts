import { createClient } from '@/lib/supabase/server'
import type { PageAnalytics } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  console.log('[analytics-pages] GET botId:', botId)

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
    .maybeSingle()

  if (!bot) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('page_url, page_title, message_count, outcome')
    .eq('bot_id', botId)
    .not('page_url', 'is', null)
    .gte('started_at', thirtyDaysAgo.toISOString())

  if (error) {
    console.error('[analytics-pages] query error:', error)
    return Response.json(
      { error: { code: 'QUERY_FAILED', message: 'Failed to fetch page data' } },
      { status: 500 }
    )
  }

  // Aggregate in JS — Supabase JS does not support GROUP BY directly
  const pageMap = new Map<
    string,
    {
      page_url: string
      page_title: string | null
      session_count: number
      total_messages: number
      resolved: number
    }
  >()

  for (const s of sessions ?? []) {
    if (!s.page_url) continue
    const existing = pageMap.get(s.page_url)
    if (existing) {
      existing.session_count++
      existing.total_messages += s.message_count ?? 0
      if (s.outcome === 'resolved') existing.resolved++
    } else {
      pageMap.set(s.page_url, {
        page_url: s.page_url,
        page_title: s.page_title ?? null,
        session_count: 1,
        total_messages: s.message_count ?? 0,
        resolved: s.outcome === 'resolved' ? 1 : 0,
      })
    }
  }

  const pages: PageAnalytics[] = Array.from(pageMap.values())
    .map((p) => ({
      page_url: p.page_url,
      page_title: p.page_title,
      session_count: p.session_count,
      total_messages: p.total_messages,
      resolution_rate:
        p.session_count > 0
          ? Math.round((p.resolved / p.session_count) * 100 * 10) / 10
          : null,
    }))
    .sort((a, b) => b.session_count - a.session_count)

  return Response.json({ data: { pages } })
}
