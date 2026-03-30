import { createClient, createServiceClient } from '@/lib/supabase/server'
import { processDocument } from '@/lib/process-document'

export async function POST(
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

  // Verify document belongs to this KB
  const { data: doc } = await supabase
    .from('kb_documents')
    .select('id')
    .eq('id', docId)
    .eq('kb_id', id)
    .single()

  if (!doc) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Document not found' } },
      { status: 404 }
    )
  }

  const serviceSupabase = createServiceClient()

  // Reset document status and clear stale data
  await serviceSupabase
    .from('kb_documents')
    .update({ status: 'processing', error_message: null, chunk_count: 0 })
    .eq('id', docId)

  // Delete any existing chunks for this document
  await serviceSupabase.from('kb_chunks').delete().eq('document_id', docId)

  // Await processDocument so we can return the real result
  await processDocument(docId)

  return Response.json({ data: { success: true } })
}
