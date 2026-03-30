import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UnansweredQuestions from '@/components/analytics/UnansweredQuestions'

export default async function UnansweredPage({
  params,
}: {
  params: Promise<{ botId: string }>
}) {
  const { botId } = await params
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

  return <UnansweredQuestions botId={botId} botName={bot.name} />
}
