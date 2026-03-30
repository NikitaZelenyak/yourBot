import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  outcome: z.enum(['resolved', 'unresolved', 'abandoned']).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  console.log('[analytics-conversations] GET botId:', botId)

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

  // Parse query params
  const url = new URL(request.url)
  const rawQuery = {
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    outcome: url.searchParams.get('outcome') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
  }

  const parsedQuery = querySchema.safeParse(rawQuery)
  if (!parsedQuery.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsedQuery.error.message } },
      { status: 400 }
    )
  }

  const { page, limit, outcome, search, dateFrom, dateTo } = parsedQuery.data
  const offset = (page - 1) * limit

  // Build query for chat_sessions
  let query = supabase
    .from('chat_sessions')
    .select(
      'id, started_at, ended_at, message_count, outcome, page_url, page_title, visitor_id_custom, visitor_name, visitor_email',
      { count: 'exact' }
    )
    .eq('bot_id', botId)

  if (outcome) {
    query = query.eq('outcome', outcome)
  }

  if (search) {
    query = query.or(
      `visitor_name.ilike.%${search}%,visitor_email.ilike.%${search}%,visitor_id_custom.ilike.%${search}%`
    )
  }

  if (dateFrom) {
    query = query.gte('started_at', dateFrom)
  }

  if (dateTo) {
    query = query.lte('started_at', dateTo)
  }

  query = query
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: sessions, count, error } = await query

  if (error) {
    console.error('[analytics-conversations] query error:', error)
    return Response.json(
      { error: { code: 'QUERY_FAILED', message: 'Failed to fetch sessions' } },
      { status: 500 }
    )
  }

  // Check which sessions have escalations
  const sessionIds = (sessions ?? []).map((s) => s.id)
  let escalatedIds = new Set<string>()

  if (sessionIds.length > 0) {
    const { data: escalations } = await supabase
      .from('escalations')
      .select('session_id')
      .in('session_id', sessionIds)

    escalatedIds = new Set((escalations ?? []).map((e) => e.session_id))
  }

  const enrichedSessions = (sessions ?? []).map((s) => ({
    id: s.id,
    started_at: s.started_at,
    ended_at: s.ended_at ?? null,
    message_count: s.message_count ?? 0,
    outcome: s.outcome ?? null,
    page_url: s.page_url ?? null,
    page_title: s.page_title ?? null,
    visitor_id_custom: s.visitor_id_custom ?? null,
    visitor_name: s.visitor_name ?? null,
    visitor_email: s.visitor_email ?? null,
    has_escalation: escalatedIds.has(s.id),
  }))

  return Response.json({
    data: {
      sessions: enrichedSessions,
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    },
  })
}
