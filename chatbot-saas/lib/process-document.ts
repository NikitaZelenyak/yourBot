import { createServiceClient } from '@/lib/supabase/server'
import { parseFile, chunkText } from '@/lib/document-processor'
import { embedTexts } from '@/lib/embeddings'

const CHUNK_INSERT_BATCH = 50

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createServiceClient()

  console.log('[process-document] Starting:', documentId)

  // 1. Fetch document record
  const { data: doc } = await supabase
    .from('kb_documents')
    .select('id, kb_id, filename, file_type, storage_path')
    .eq('id', documentId)
    .single()

  if (!doc) {
    console.error('[process-document] document not found:', documentId)
    return
  }

  console.log('[process-document] Fetched document:', doc.filename)

  try {
    // 2. Download file from storage
    console.log('[process-document] Downloading from storage:', doc.storage_path)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-base-files')
      .download(doc.storage_path)

    if (downloadError) {
      throw new Error('Storage download failed: ' + downloadError.message)
    }
    if (!fileData) {
      throw new Error('Storage download returned no data')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    console.log('[process-document] File downloaded, size:', buffer.length)

    // 3. Parse file into text
    const text = await parseFile(buffer, doc.file_type)
    console.log('[process-document] Parsed text length:', text.length)

    // 4. Chunk text
    const chunks = chunkText(text)
    console.log('[process-document] Chunks created:', chunks.length)

    if (chunks.length === 0) {
      await supabase
        .from('kb_documents')
        .update({ status: 'failed', error_message: 'No text extracted from file' })
        .eq('id', documentId)
      return
    }

    // 5. Generate embeddings in batches
    console.log('[process-document] Starting embeddings for', chunks.length, 'chunks')
    const embeddings = await embedTexts(chunks)
    console.log('[process-document] Embeddings done, inserting chunks...')

    // 6. Insert chunks in batches of 50
    for (let i = 0; i < chunks.length; i += CHUNK_INSERT_BATCH) {
      const batchChunks = chunks.slice(i, i + CHUNK_INSERT_BATCH)
      const batchEmbeddings = embeddings.slice(i, i + CHUNK_INSERT_BATCH)

      // embedding is a vector type — cast as unknown since Supabase TS types
      // represent it as string | null but we pass number[] for pgvector
      const rows = batchChunks.map((content, j) => ({
        document_id: documentId,
        kb_id: doc.kb_id,
        content,
        embedding: batchEmbeddings[j] as unknown as string,
        chunk_index: i + j,
        metadata: { filename: doc.filename, chunk_index: i + j },
      }))

      const { error: insertError } = await supabase.from('kb_chunks').insert(rows)
      if (insertError) throw new Error(insertError.message)
    }

    // 7. Mark document as ready
    await supabase
      .from('kb_documents')
      .update({ status: 'ready', chunk_count: chunks.length })
      .eq('id', documentId)

    console.log('[process-document] Complete:', chunks.length, 'chunks stored')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : ''
    console.error('[process-document] FAILED:', message)
    console.error('[process-document] Stack:', stack)

    await supabase
      .from('kb_documents')
      .update({ status: 'failed', error_message: message })
      .eq('id', documentId)
  }
}
