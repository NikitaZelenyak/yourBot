import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
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

  const { data: kb } = await supabase
    .from('knowledge_bases')
    .select('id, name, description, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!kb) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Knowledge base not found' } },
      { status: 404 }
    )
  }

  return Response.json({ data: kb })
}

export async function PATCH(
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

  const json = await request.json()
  const parsed = patchSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { data: kb } = await supabase
    .from('knowledge_bases')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, description, created_at, updated_at')
    .single()

  if (!kb) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Knowledge base not found' } },
      { status: 404 }
    )
  }

  return Response.json({ data: kb })
}

export async function DELETE(
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

  // Verify ownership before deletion
  const { data: kb } = await supabase
    .from('knowledge_bases')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!kb) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Knowledge base not found' } },
      { status: 404 }
    )
  }

  // Delete storage files (use service role for storage access)
  const serviceSupabase = createServiceClient()
  const { data: files } = await serviceSupabase.storage
    .from('knowledge-base-files')
    .list(`kb-${id}`)

  if (files && files.length > 0) {
    const paths = files.map((f) => `kb-${id}/${f.name}`)
    await serviceSupabase.storage.from('knowledge-base-files').remove(paths)
  }

  // Delete KB row (cascades to documents and chunks)
  await supabase
    .from('knowledge_bases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return Response.json({ data: { deleted: true } })
}
