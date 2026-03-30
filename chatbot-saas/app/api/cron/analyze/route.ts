import OpenAI from 'openai'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    )
  }

  console.log('[cron-analyze] Starting daily analysis job')

  const supabase = createServiceClient()
  const openai = new OpenAI()

  // Compute yesterday date range in UTC
  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
  const yesterdayDate = yesterdayStart.toISOString().split('T')[0] // 'YYYY-MM-DD'

  console.log(`[cron-analyze] Processing sessions for ${yesterdayDate}`)

  // Fetch all sessions from yesterday
  const { data: allYesterdaySessions } = await supabase
    .from('chat_sessions')
    .select('id, bot_id')
    .gte('started_at', yesterdayStart.toISOString())
    .lt('started_at', todayStart.toISOString())

  if (!allYesterdaySessions || allYesterdaySessions.length === 0) {
    console.log('[cron-analyze] No sessions found for yesterday, exiting')
    return Response.json({ data: { bots_processed: 0, sessions_analyzed: 0, errors: [] } })
  }

  const sessionIds = allYesterdaySessions.map((s) => s.id)

  // Find which sessions already have analytics
  const { data: existingAnalytics } = await supabase
    .from('session_analytics')
    .select('session_id')
    .in('session_id', sessionIds)

  const analyzedIds = new Set(existingAnalytics?.map((a) => a.session_id) ?? [])
  const unanalyzed = allYesterdaySessions.filter((s) => !analyzedIds.has(s.id))

  console.log(
    `[cron-analyze] ${allYesterdaySessions.length} total sessions, ${unanalyzed.length} need analysis`
  )

  // Group by bot_id
  const botSessionMap = new Map<string, string[]>()
  for (const s of unanalyzed) {
    const arr = botSessionMap.get(s.bot_id) ?? []
    arr.push(s.id)
    botSessionMap.set(s.bot_id, arr)
  }

  const errors: string[] = []
  let totalAnalyzed = 0

  for (const [botId, sessions] of botSessionMap) {
    console.log(`[cron-analyze] Processing ${sessions.length} sessions for bot ${botId}`)

    // Process in batches of 10 to avoid rate limits
    for (let i = 0; i < sessions.length; i += 10) {
      const batch = sessions.slice(i, i + 10)

      await Promise.all(
        batch.map(async (sessionId) => {
          try {
            // Fetch messages for this session
            const { data: messages } = await supabase
              .from('chat_messages')
              .select('role, content')
              .eq('session_id', sessionId)
              .order('created_at', { ascending: true })

            if (!messages || messages.length === 0) return

            const conversationText = messages
              .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
              .join('\n')

            const prompt = `Analyze this customer support chatbot conversation and return a JSON object.

Conversation:
${conversationText}

Return ONLY a valid JSON object with these exact fields:
{
  "intent": "short phrase describing the user's main intent",
  "sentiment": "positive" or "neutral" or "negative",
  "topics": ["array", "of", "short", "topic", "tags"],
  "is_answered": true or false,
  "unanswered_questions": ["questions the bot failed to answer, empty array if all answered"],
  "performance_score": number between 0 and 100
}

Performance score: resolution quality (40pts) + engagement depth (30pts, based on message count capped at 10) + sentiment (30pts: positive=30, neutral=15, negative=0)`

            const aiResponse = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' },
              max_tokens: 500,
            })

            const content = aiResponse.choices[0]?.message?.content
            if (!content) throw new Error('Empty AI response')

            const analysis = JSON.parse(content) as {
              intent?: string
              sentiment?: string
              topics?: string[]
              is_answered?: boolean
              unanswered_questions?: string[]
              performance_score?: number
            }

            // Insert session_analytics row
            await supabase.from('session_analytics').insert({
              session_id: sessionId,
              bot_id: botId,
              intent: analysis.intent ?? null,
              sentiment: analysis.sentiment ?? null,
              topics: analysis.topics ?? [],
              is_answered: analysis.is_answered ?? null,
              unanswered_questions: analysis.unanswered_questions ?? [],
              performance_score: analysis.performance_score ?? null,
            })

            // Process unanswered questions discovered by AI
            for (const question of analysis.unanswered_questions ?? []) {
              if (!question) continue
              const { data: existing } = await supabase
                .from('unanswered_questions')
                .select('id, frequency')
                .eq('bot_id', botId)
                .eq('question', question)
                .maybeSingle()

              if (existing) {
                await supabase
                  .from('unanswered_questions')
                  .update({ frequency: existing.frequency + 1 })
                  .eq('id', existing.id)
              } else {
                await supabase.from('unanswered_questions').insert({
                  bot_id: botId,
                  session_id: sessionId,
                  question,
                })
              }
            }

            totalAnalyzed++
          } catch (e) {
            const msg = `Session ${sessionId}: ${e instanceof Error ? e.message : String(e)}`
            console.error(`[cron-analyze] ${msg}`)
            errors.push(msg)
          }
        })
      )
    }

    // Compute topic clusters for this bot from yesterday's analytics
    try {
      const { data: botAnalytics } = await supabase
        .from('session_analytics')
        .select('topics')
        .eq('bot_id', botId)
        .gte('analyzed_at', yesterdayStart.toISOString())
        .lt('analyzed_at', todayStart.toISOString())

      const topicFreq = new Map<string, number>()
      for (const sa of botAnalytics ?? []) {
        for (const topic of sa.topics ?? []) {
          topicFreq.set(topic, (topicFreq.get(topic) ?? 0) + 1)
        }
      }

      for (const [topic, count] of topicFreq) {
        await supabase.from('topic_clusters').upsert(
          {
            bot_id: botId,
            topic_label: topic,
            question_count: count,
            computed_date: yesterdayDate,
          },
          { onConflict: 'bot_id,topic_label,computed_date' }
        )
      }

      console.log(
        `[cron-analyze] Bot ${botId}: upserted ${topicFreq.size} topic clusters for ${yesterdayDate}`
      )
    } catch (e) {
      console.error(`[cron-analyze] Topic cluster error for bot ${botId}:`, e)
    }

    // Compute and upsert daily_metrics for yesterday
    try {
      const { data: daySessions } = await supabase
        .from('chat_sessions')
        .select('id, message_count, outcome, visitor_id_custom, page_url')
        .eq('bot_id', botId)
        .gte('started_at', yesterdayStart.toISOString())
        .lt('started_at', todayStart.toISOString())

      const totalSessions = daySessions?.length ?? 0
      const totalMessages =
        daySessions?.reduce((sum, s) => sum + (s.message_count ?? 0), 0) ?? 0
      const avgMessages = totalSessions > 0 ? totalMessages / totalSessions : 0
      const resolved = daySessions?.filter((s) => s.outcome === 'resolved').length ?? 0
      const unresolved = daySessions?.filter((s) => s.outcome === 'unresolved').length ?? 0
      const abandoned = daySessions?.filter((s) => s.outcome === 'abandoned').length ?? 0
      const resolutionRate = totalSessions > 0 ? resolved / totalSessions : 0
      const uniqueVisitors = new Set(
        daySessions?.map((s) => s.visitor_id_custom).filter(Boolean)
      ).size
      const uniquePages = new Set(
        daySessions?.map((s) => s.page_url).filter(Boolean)
      ).size

      // Average performance score from session_analytics for yesterday
      const { data: dayAnalytics } = await supabase
        .from('session_analytics')
        .select('performance_score')
        .eq('bot_id', botId)
        .gte('analyzed_at', yesterdayStart.toISOString())
        .lt('analyzed_at', todayStart.toISOString())

      const scores = (dayAnalytics ?? [])
        .map((a) => a.performance_score)
        .filter((s): s is number => s !== null)

      const avgPerformance =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      await supabase.from('daily_metrics').upsert(
        {
          bot_id: botId,
          date: yesterdayDate,
          total_sessions: totalSessions,
          total_messages: totalMessages,
          avg_messages_per_session: avgMessages,
          resolved_count: resolved,
          unresolved_count: unresolved,
          abandoned_count: abandoned,
          resolution_rate: resolutionRate,
          performance_score: avgPerformance,
          unique_visitors: uniqueVisitors,
          unique_pages: uniquePages,
        },
        { onConflict: 'bot_id,date' }
      )

      console.log(
        `[cron-analyze] Bot ${botId}: ${totalSessions} sessions, score ${avgPerformance.toFixed(1)}`
      )
    } catch (e) {
      console.error(`[cron-analyze] Daily metrics error for bot ${botId}:`, e)
    }
  }

  console.log(
    `[cron-analyze] Done — ${botSessionMap.size} bots processed, ${totalAnalyzed} sessions analyzed, ${errors.length} errors`
  )

  return Response.json({
    data: {
      bots_processed: botSessionMap.size,
      sessions_analyzed: totalAnalyzed,
      errors,
    },
  })
}
