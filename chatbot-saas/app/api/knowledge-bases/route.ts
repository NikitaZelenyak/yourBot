import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const postSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const { data: kbs } = await supabase
    .from('knowledge_bases')
    .select('id, name, description, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return Response.json({ data: kbs ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
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

  const { data: kb } = await supabase
    .from('knowledge_bases')
    .insert({ user_id: user.id, ...parsed.data })
    .select('id, name, description, created_at, updated_at')
    .single()

  if (!kb) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create knowledge base' } },
      { status: 500 }
    )
  }

  return Response.json({ data: kb }, { status: 201 })
}
