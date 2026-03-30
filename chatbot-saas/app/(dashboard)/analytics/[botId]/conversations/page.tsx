import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConversationsList from '@/components/analytics/ConversationsList'

export default async function ConversationsPage({
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

  return <ConversationsList botId={botId} botName={bot.name} />
}
