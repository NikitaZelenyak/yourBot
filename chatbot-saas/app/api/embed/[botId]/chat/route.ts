// Public endpoint for the embed iframe. No API key required.
// Bot must exist and be active — botId alone is sufficient to identify it.
// Rate limiting is a future concern (M2).

import { streamText } from 'ai'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { buildSystemPrompt } from '@/lib/bot-engine'
import type { Bot } from '@/types'

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params

  // Use service role client — anon client can't read bots due to RLS
  const supabase = createServiceClient()

  const { data: bot } = await supabase
    .from('bots')
    .select('id, name, slug, persona, welcome_message, primary_color, is_active, user_id, avatar_url, allowed_domains, created_at, updated_at')
    .eq('id', botId)
    .single()

  if (!bot || !bot.is_active) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found or inactive' } },
      { status: 404 }
    )
  }

  const json = await request.json()
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const systemPrompt = buildSystemPrompt(bot as Bot)

  const result = streamText({
    model: openai,
    system: systemPrompt,
    messages: parsed.data.messages,
    maxOutputTokens: 1000,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
