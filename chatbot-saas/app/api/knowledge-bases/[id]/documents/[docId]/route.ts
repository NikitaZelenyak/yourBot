import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }

  const { id, docId } = await params

  // Verify KB ownership
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

  // Fetch document to get storage path
  const { data: doc } = await supabase
    .from('kb_documents')
    .select('id, storage_path')
    .eq('id', docId)
    .eq('kb_id', id)
    .single()

  if (!doc) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Document not found' } },
      { status: 404 }
    )
  }

  // Delete from storage
  const serviceSupabase = createServiceClient()
  await serviceSupabase.storage
    .from('knowledge-base-files')
    .remove([doc.storage_path])

  // Delete document row (chunks cascade)
  await supabase.from('kb_documents').delete().eq('id', docId).eq('kb_id', id)

  return Response.json({ data: { deleted: true } })
}
