import { createClient } from '@/lib/supabase/server'
import type { ChatSessionWithAnalytics, ChatMessage, SessionAnalytics, Escalation } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string; sessionId: string }> }
) {
  const { botId, sessionId } = await params
  console.log('[analytics-session-detail] GET botId:', botId, 'sessionId:', sessionId)

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

  // Fetch session — verify it belongs to this bot
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, bot_id, visitor_id, started_at, ended_at, message_count, outcome, page_url, page_title, visitor_id_custom, visitor_name, visitor_email, visitor_phone')
    .eq('id', sessionId)
    .eq('bot_id', botId)
    .single()

  if (!session) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Session not found' } },
      { status: 404 }
    )
  }

  // Fetch all messages ordered by created_at asc
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, session_id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  // Fetch session_analytics row if exists
  const { data: analytics } = await supabase
    .from('session_analytics')
    .select('id, session_id, bot_id, intent, sentiment, topics, is_answered, unanswered_questions, performance_score, analyzed_at')
    .eq('session_id', sessionId)
    .maybeSingle()

  // Fetch escalation row if exists
  const { data: escalation } = await supabase
    .from('escalations')
    .select('id, session_id, bot_id, visitor_name, visitor_email, message, original_question, status, created_at')
    .eq('session_id', sessionId)
    .maybeSingle()

  return Response.json({
    data: {
      session: session as unknown as ChatSessionWithAnalytics,
      messages: (messages ?? []) as ChatMessage[],
      analytics: analytics as SessionAnalytics | null,
      escalation: escalation as Escalation | null,
    },
  })
}
