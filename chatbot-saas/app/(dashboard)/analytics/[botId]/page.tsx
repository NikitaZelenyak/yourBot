import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BotAnalyticsDashboard from '@/components/analytics/BotAnalyticsDashboard'

export default async function BotAnalyticsPage({
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

  // Verify ownership
  const { data: bot } = await supabase
    .from('bots')
    .select('id, name, primary_color, is_active')
    .eq('id', botId)
    .eq('user_id', user.id)
    .single()

  if (!bot) redirect('/analytics')

  return <BotAnalyticsDashboard botId={botId} botName={bot.name} primaryColor={bot.primary_color} />
}
