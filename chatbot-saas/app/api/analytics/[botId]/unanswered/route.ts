import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { UnansweredQuestion } from '@/types'

const querySchema = z.object({
  status: z.enum(['open', 'kb_updated', 'ignored']).default('open'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  console.log('[analytics-unanswered] GET botId:', botId)

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

  const url = new URL(request.url)
  const rawQuery = {
    status: url.searchParams.get('status') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  }

  const parsedQuery = querySchema.safeParse(rawQuery)
  if (!parsedQuery.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsedQuery.error.message } },
      { status: 400 }
    )
  }

  const { status, page, limit } = parsedQuery.data
  const offset = (page - 1) * limit

  const { data: questions, count, error } = await supabase
    .from('unanswered_questions')
    .select('id, bot_id, session_id, question, asked_at, page_url, frequency, status', { count: 'exact' })
    .eq('bot_id', botId)
    .eq('status', status)
    .order('frequency', { ascending: false })
    .order('asked_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[analytics-unanswered] query error:', error)
    return Response.json(
      { error: { code: 'QUERY_FAILED', message: 'Failed to fetch unanswered questions' } },
      { status: 500 }
    )
  }

  return Response.json({
    data: {
      questions: (questions ?? []) as UnansweredQuestion[],
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    },
  })
}
