import { createClient } from '@/lib/supabase/server'
import type { TopicCluster } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params
  console.log('[analytics-topics] GET botId:', botId)

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

  // Find the most recent computed_date for this bot
  const { data: latestRow } = await supabase
    .from('topic_clusters')
    .select('computed_date')
    .eq('bot_id', botId)
    .order('computed_date', { ascending: false })
    .limit(1)
    .single()

  if (!latestRow) {
    return Response.json({
      data: {
        topics: [],
        computed_date: null,
      },
    })
  }

  const computedDate = latestRow.computed_date

  // Fetch all topic_clusters for that date
  const { data: topics } = await supabase
    .from('topic_clusters')
    .select('id, bot_id, topic_label, question_count, sample_questions, trend, computed_date')
    .eq('bot_id', botId)
    .eq('computed_date', computedDate)
    .order('question_count', { ascending: false })

  return Response.json({
    data: {
      topics: (topics ?? []) as TopicCluster[],
      computed_date: computedDate,
    },
  })
}
