import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const botSchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  persona: z.string().max(2000).optional(),
  welcome_message: z.string().max(200).optional(),
  primary_color: z.string().default('#6366f1'),
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

  const { data: bots, error } = await supabase
    .from('bots')
    .select('id, name, slug, persona, welcome_message, primary_color, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return Response.json({ data: bots })
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
  const parsed = botSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { name, slug, persona, welcome_message, primary_color } = parsed.data

  const { data: existing } = await supabase
    .from('bots')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return Response.json(
      { error: { code: 'SLUG_TAKEN', message: 'This slug is already taken' } },
      { status: 409 }
    )
  }

  const { data: bot, error } = await supabase
    .from('bots')
    .insert({ name, slug, persona, welcome_message, primary_color, user_id: user.id })
    .select('id, name, slug, persona, welcome_message, primary_color, is_active, created_at, updated_at')
    .single()

  if (error) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return Response.json({ data: bot }, { status: 201 })
}
