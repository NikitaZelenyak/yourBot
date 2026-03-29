import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/api-key'

const postSchema = z.object({
  label: z.string().max(50).optional(),
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

  // Verify ownership
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

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, label, last_used_at, created_at')
    .eq('bot_id', id)
    .order('created_at', { ascending: false })

  return Response.json({ data: keys ?? [] })
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

  // Verify ownership
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
  const parsed = postSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const rawKey = generateApiKey()
  const keyHash = hashApiKey(rawKey)

  const { data: newKey } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      bot_id: id,
      key_hash: keyHash,
      label: parsed.data.label ?? null,
    })
    .select('id, label, created_at')
    .single()

  if (!newKey) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create API key' } },
      { status: 500 }
    )
  }

  // rawKey is returned ONCE here — never stored plain, never returned again
  return Response.json({
    data: { id: newKey.id, rawKey, label: newKey.label, created_at: newKey.created_at },
  })
}
