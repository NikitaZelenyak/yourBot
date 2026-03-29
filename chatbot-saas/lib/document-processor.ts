import mammoth from 'mammoth'
import Papa from 'papaparse'
import { PDFParse } from 'pdf-parse'

const CHUNK_SIZE = 400      // tokens per chunk
const CHUNK_OVERLAP = 50    // token overlap between chunks

// ~0.75 words per token
const WORDS_PER_CHUNK = Math.floor(CHUNK_SIZE * 0.75)       // 300
const OVERLAP_WORDS = Math.floor(CHUNK_OVERLAP * 0.75)      // 37
const STEP = WORDS_PER_CHUNK - OVERLAP_WORDS                // 263

export async function parseFile(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'pdf': {
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      return result.text
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case 'csv': {
      const parsed = Papa.parse<Record<string, string>>(buffer.toString(), { header: true })
      return (parsed.data as Record<string, string>[])
        .map((row) => Object.values(row).join(', '))
        .join('\n')
    }
    case 'txt':
      return buffer.toString('utf-8')
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += STEP) {
    const chunk = words.slice(i, i + WORDS_PER_CHUNK).join(' ')
    if (chunk.split(/\s+/).length >= 10) {
      chunks.push(chunk)
    }
  }

  return chunks
}

export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'pdf',
    docx: 'docx',
    doc: 'docx',
    csv: 'csv',
    txt: 'txt',
  }
  if (!map[ext]) throw new Error(`Unsupported file type: .${ext}`)
  return map[ext]
}
