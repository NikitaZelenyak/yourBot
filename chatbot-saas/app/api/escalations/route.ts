import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  botId: z.string().uuid(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email(),
  message: z.string().min(1),
  originalQuestion: z.string().optional(),
})

export async function POST(request: Request) {
  console.log('[escalations] POST request received')

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

  const { sessionId, botId, visitorName, visitorEmail, message, originalQuestion } = parsed.data

  const supabase = createServiceClient()

  // Verify the bot exists and is active
  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', botId)
    .eq('is_active', true)
    .single()

  if (!bot) {
    return Response.json(
      { error: { code: 'BOT_NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  const { data: escalation, error } = await supabase
    .from('escalations')
    .insert({
      session_id: sessionId,
      bot_id: botId,
      visitor_name: visitorName ?? null,
      visitor_email: visitorEmail,
      message,
      original_question: originalQuestion ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[escalations] insert error:', error)
    return Response.json(
      { error: { code: 'INSERT_FAILED', message: 'Failed to create escalation' } },
      { status: 500 }
    )
  }

  console.log('[escalations] created escalation:', escalation.id)
  return Response.json({ data: escalation }, { status: 201 })
}
