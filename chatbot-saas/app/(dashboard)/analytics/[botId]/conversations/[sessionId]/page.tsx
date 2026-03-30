import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SessionReplay from '@/components/analytics/SessionReplay'

export default async function SessionReplayPage({
  params,
}: {
  params: Promise<{ botId: string; sessionId: string }>
}) {
  const { botId, sessionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: bot } = await supabase
    .from('bots')
    .select('id, name')
    .eq('id', botId)
    .eq('user_id', user.id)
    .single()

  if (!bot) redirect('/analytics')

  return <SessionReplay botId={botId} sessionId={sessionId} botName={bot.name} />
}
