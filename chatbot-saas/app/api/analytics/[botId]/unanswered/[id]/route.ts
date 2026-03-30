import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { UnansweredQuestion } from '@/types'

const bodySchema = z.object({
  status: z.enum(['open', 'kb_updated', 'ignored']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ botId: string; id: string }> }
) {
  const { botId, id } = await params
  console.log('[analytics-unanswered-patch] PATCH botId:', botId, 'id:', id)

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

  const json = await request.json().catch(() => null)
  if (!json) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 }
    )
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { data: updated, error } = await supabase
    .from('unanswered_questions')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .eq('bot_id', botId)
    .select('id, bot_id, session_id, question, asked_at, page_url, frequency, status')
    .single()

  if (error || !updated) {
    console.error('[analytics-unanswered-patch] update error:', error)
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Unanswered question not found' } },
      { status: 404 }
    )
  }

  return Response.json({ data: updated as UnansweredQuestion })
}
