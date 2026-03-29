import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const kbIdSchema = z.object({
  kbId: z.string().uuid(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const { id } = await params

  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bot) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  const { data: connections } = await supabase
    .from('bot_knowledge_bases')
    .select('kb_id, created_at, knowledge_bases(id, name, description)')
    .eq('bot_id', id)

  return Response.json({ data: connections ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const { id } = await params

  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bot) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  const json = await request.json()
  const parsed = kbIdSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  // Verify KB belongs to this user
  const { data: kb } = await supabase
    .from('knowledge_bases')
    .select('id')
    .eq('id', parsed.data.kbId)
    .eq('user_id', user.id)
    .single()

  if (!kb) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Knowledge base not found' } },
      { status: 404 }
    )
  }

  // Upsert — ignore if already connected
  await supabase
    .from('bot_knowledge_bases')
    .upsert({ bot_id: id, kb_id: parsed.data.kbId }, { onConflict: 'bot_id,kb_id' })

  return Response.json({ data: { connected: true } })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const { id } = await params

  const { data: bot } = await supabase
    .from('bots')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bot) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Bot not found' } },
      { status: 404 }
    )
  }

  const json = await request.json()
  const parsed = kbIdSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  await supabase
    .from('bot_knowledge_bases')
    .delete()
    .eq('bot_id', id)
    .eq('kb_id', parsed.data.kbId)

  return Response.json({ data: { disconnected: true } })
}
