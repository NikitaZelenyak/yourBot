import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getFileType } from '@/lib/document-processor'
import { processDocument } from '@/lib/process-document'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

  const { data: docs } = await supabase
    .from('kb_documents')
    .select('id, filename, file_type, status, chunk_count, error_message, created_at')
    .eq('kb_id', id)
    .order('created_at', { ascending: false })

  return Response.json({ data: docs ?? [] })
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

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'No file provided' } },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'File exceeds 10MB limit' } },
      { status: 400 }
    )
  }

  let fileType: string
  try {
    fileType = getFileType(file.name)
  } catch {
    return Response.json(
      { error: { code: 'INVALID_REQUEST', message: 'Unsupported file type. Use pdf, docx, csv, or txt.' } },
      { status: 400 }
    )
  }

  // Generate a document ID upfront so we can use it in the storage path
  const docId = crypto.randomUUID()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? fileType
  const storagePath = `kb-${id}/${docId}.${ext}`

  // Upload raw file to storage using service role client
  const serviceSupabase = createServiceClient()
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await serviceSupabase.storage
    .from('knowledge-base-files')
    .upload(storagePath, fileBuffer, { contentType: file.type || 'application/octet-stream' })

  if (uploadError) {
    return Response.json(
      { error: { code: 'STORAGE_ERROR', message: uploadError.message } },
      { status: 500 }
    )
  }

  // Insert document row with the pre-generated ID
  const { data: doc } = await supabase
    .from('kb_documents')
    .insert({
      id: docId,
      kb_id: id,
      filename: file.name,
      file_type: fileType,
      storage_path: storagePath,
      status: 'processing',
    })
    .select('id, filename, file_type, status, chunk_count, error_message, created_at')
    .single()

  if (!doc) {
    return Response.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create document record' } },
      { status: 500 }
    )
  }

  // Fire-and-forget processing — do NOT await
  processDocument(doc.id).catch((err) => {
    console.error('[documents/upload] processDocument failed:', err)
  })

  return Response.json({ data: doc }, { status: 201 })
}
