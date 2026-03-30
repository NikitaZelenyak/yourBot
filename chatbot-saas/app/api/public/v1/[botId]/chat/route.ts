import { streamText } from 'ai'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'
import { buildSystemPrompt } from '@/lib/bot-engine'
import { hashApiKey } from '@/lib/api-key'
import { embedText } from '@/lib/embeddings'
import type { Bot } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const visitorContextSchema = z.object({
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  userPhone: z.string().optional(),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
})

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .min(1),
  visitorContext: visitorContextSchema.optional(),
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

async function runPostResponseAnalytics(
  sessionId: string,
  botId: string,
  botMessageContent: string,
  userQuestion: string,
  pageUrl: string | undefined
) {
  try {
    const svc = createServiceClient()

    // 1. Increment message_count using raw SQL via execute
    // Supabase JS doesn't support column-relative updates natively,
    // so we use a targeted SELECT + UPDATE pattern.
    const { data: sessionRow } = await svc
      .from('chat_sessions')
      .select('message_count')
      .eq('id', sessionId)
      .single()

    if (sessionRow !== null) {
      const currentCount = (sessionRow as { message_count: number | null }).message_count ?? 0
      await svc
        .from('chat_sessions')
        .update({ message_count: currentCount + 1 })
        .eq('id', sessionId)
    }

    // 2. Check if bot response is unanswered
    const { data: isUnanswered } = await svc.rpc('is_unanswered_response', {
      message_content: botMessageContent,
    })

    if (isUnanswered && userQuestion) {
      const { data: existing } = await svc
        .from('unanswered_questions')
        .select('id, frequency')
        .eq('bot_id', botId)
        .eq('question', userQuestion)
        .maybeSingle()

      if (existing) {
        await svc
          .from('unanswered_questions')
          .update({ frequency: existing.frequency + 1 })
          .eq('id', existing.id)
      } else {
        await svc.from('unanswered_questions').insert({
          bot_id: botId,
          session_id: sessionId,
          question: userQuestion,
          page_url: pageUrl ?? null,
        })
      }
    }

    // 3. Compute and update session outcome
    const { data: outcome } = await svc.rpc('compute_session_outcome', {
      p_session_id: sessionId,
    })
    if (outcome) {
      await svc
        .from('chat_sessions')
        .update({ outcome })
        .eq('id', sessionId)
    }
  } catch (e) {
    console.error('[public-v1-chat] post-response analytics error:', e)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params

  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization')
  const rawKey = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '').trim()
    : null

  if (!rawKey) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing API key' } },
      { status: 401 }
    )
  }

  const supabase = createServiceClient()

  // 2. Look up API key by hash
  const keyHash = hashApiKey(rawKey)
  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, bot_id, user_id')
    .eq('key_hash', keyHash)
    .eq('bot_id', botId)
    .single()

  if (!apiKey) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } },
      { status: 401 }
    )
  }

  // 3. Fetch the bot
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

  // 4. Validate request body
  const json = await request.json()
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  // 5. Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)
    .then(() => {})

  const { messages, visitorContext } = parsed.data

  // 6. Create chat session with visitor context fields
  const sessionInsert = {
    bot_id: botId,
    visitor_id_custom: visitorContext?.userId ?? null,
    visitor_name: visitorContext?.userName ?? null,
    visitor_email: visitorContext?.userEmail ?? null,
    visitor_phone: visitorContext?.userPhone ?? null,
    page_url: visitorContext?.pageUrl ?? null,
    page_title: visitorContext?.pageTitle ?? null,
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .insert(sessionInsert)
    .select('id')
    .single()

  const sessionId = session?.id ?? null
  console.log('[public-v1-chat] session created:', sessionId)

  // 7. RAG: inject KB context if bot has connected knowledge bases
  const lastUserMessage = messages[messages.length - 1]?.content ?? ''
  const kbContext = await getKbContext(botId, lastUserMessage, supabase)

  // 8. Build system prompt — KB context prepended so facts come first
  const systemPrompt = kbContext
    ? kbContext + '\n\n' + buildSystemPrompt(bot as Bot)
    : buildSystemPrompt(bot as Bot)

  const result = streamText({
    model: openai,
    system: systemPrompt,
    messages,
    maxOutputTokens: 1000,
    temperature: 0.7,
    onFinish: ({ text }) => {
      if (!sessionId) return
      void (async () => {
        await runPostResponseAnalytics(
          sessionId,
          botId,
          text,
          lastUserMessage,
          visitorContext?.pageUrl
        )
      })()
    },
  })

  return result.toUIMessageStreamResponse()
}
