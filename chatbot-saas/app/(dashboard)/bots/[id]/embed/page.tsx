import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EmbedPanel from '@/components/bot-builder/EmbedPanel'
import type { Bot } from '@/types'

export default async function EmbedCodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bot } = await supabase
    .from('bots')
    .select('id, name, slug, persona, welcome_message, primary_color, is_active, user_id, avatar_url, allowed_domains, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!bot) {
    redirect('/bots')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Embed your bot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy the snippet below and paste it into your website.
        </p>
      </div>

      <EmbedPanel bot={bot as Bot} />

      <div>
        <h2 className="mb-1 text-base font-medium">Preview</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This is how your bot will look when embedded.
        </p>
        <div className="flex justify-center">
          <iframe
            src={`/embed/${bot.id}`}
            width={400}
            height={600}
            style={{
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
            title={`${bot.name} preview`}
          />
        </div>
      </div>
    </div>
  )
}
