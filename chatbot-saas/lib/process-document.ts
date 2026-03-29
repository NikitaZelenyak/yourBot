import { createServiceClient } from '@/lib/supabase/server'
import { parseFile, chunkText } from '@/lib/document-processor'
import { embedTexts } from '@/lib/embeddings'

const CHUNK_INSERT_BATCH = 50

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createServiceClient()

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

  try {
    // 2. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-base-files')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? 'Failed to download file')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // 3. Parse file into text
    const text = await parseFile(buffer, doc.file_type)

    // 4. Chunk text
    const chunks = chunkText(text)

    if (chunks.length === 0) {
      await supabase
        .from('kb_documents')
        .update({ status: 'failed', error_message: 'No text extracted from file' })
        .eq('id', documentId)
      return
    }

    // 5. Generate embeddings in batches
    const embeddings = await embedTexts(chunks)

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

    console.log(`[process-document] done: ${documentId}, ${chunks.length} chunks`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[process-document] failed:', documentId, message)

    await supabase
      .from('kb_documents')
      .update({ status: 'failed', error_message: message })
      .eq('id', documentId)
  }
}
