import { streamText } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { buildSystemPrompt } from '@/lib/bot-engine'
import { embedText } from '@/lib/embeddings'
import type { Bot } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const bodySchema = z.object({
  botId: z.string().uuid(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .min(1),
})

async function getKbContext(
  botId: string,
  userMessage: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data: botKbs } = await supabase
    .from('bot_knowledge_bases')
    .select('kb_id')
    .eq('bot_id', botId)

  if (!botKbs || botKbs.length === 0) return ''

  const kbIds = botKbs.map((bk) => bk.kb_id)

  const queryEmbedding = await embedText(userMessage)

  const { data: chunks } = await supabase.rpc('hybrid_search', {
    query_embedding: queryEmbedding,
    query_text: userMessage,
    kb_ids: kbIds,
    match_count: 5,
  })

  if (!chunks || chunks.length === 0) return ''

  const context = chunks
    .map((c: { content: string }) => c.content)
    .join('\n\n---\n\n')

  return `KNOWLEDGE BASE CONTEXT:
Use the following information to answer the user's question.
If the answer is not in the context, use your general knowledge.

${context}

---`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
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

  const { botId, messages } = parsed.data

  const { data: bot } = await supabase
    .from('bots')
    .select('id, name, slug, persona, welcome_message, primary_color, is_active, user_id, avatar_url, allowed_domains, created_at, updated_at')
    .eq('id', botId)
    .eq('user_id', user.id)
    .single()

  if (!bot) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  const lastUserMessage = messages[messages.length - 1]?.content ?? ''
  const kbContext = await getKbContext(botId, lastUserMessage, supabase)
  const systemPrompt = kbContext
    ? kbContext + '\n\n' + buildSystemPrompt(bot as Bot)
    : buildSystemPrompt(bot as Bot)

  const result = streamText({
    model: openai,
    system: systemPrompt,
    messages,
    maxOutputTokens: 1000,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
