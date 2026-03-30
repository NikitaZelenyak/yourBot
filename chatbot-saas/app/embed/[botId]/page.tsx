import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/chat/ChatWindow'

export const dynamic = 'force-dynamic'

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ botId: string }>
}) {
  const { botId } = await params
  const supabase = await createClient()

  const { data: bot } = await supabase
    .from('bots')
    .select('id, name, slug, persona, welcome_message, primary_color, is_active')
    .eq('id', botId)
    .single()

  if (!bot || !bot.is_active) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">This chatbot is unavailable.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div
        className="flex items-center px-4 py-3 text-sm font-medium text-white"
        style={{ backgroundColor: bot.primary_color }}
      >
        {bot.name}
      </div>

      {/* Chat */}
      <ChatWindow
        botId={bot.id}
        welcomeMessage={bot.welcome_message ?? undefined}
        primaryColor={bot.primary_color}
        showEscalation
      />
    </div>
  )
}
