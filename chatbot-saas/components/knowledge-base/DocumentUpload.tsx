'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'csv', 'txt']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

interface Props {
  kbId: string
  onSuccess: () => void
}

export default function DocumentUpload({ kbId, onSuccess }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function getExtension(name: string): string {
    return name.split('.').pop()?.toLowerCase() ?? ''
  }

  function validateFile(file: File): string | null {
    if (file.size > MAX_SIZE_BYTES) return `File is too large. Max size is 10 MB.`
    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Please upload PDF, DOCX, CSV, or TXT.`
    }
    return null
  }

  async function uploadFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setErrorMsg(validationError)
      setState('error')
      return
    }

    setFileName(file.name)
    setState('uploading')
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setErrorMsg(json.error?.message ?? 'Upload failed. Please try again.')
        setState('error')
        return
      }

      setState('success')
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setState('error')
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (state !== 'uploading' && state !== 'success') setState('dragging')
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    if (state === 'dragging') setState('idle')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (state === 'uploading' || state === 'success') return
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleClick() {
    if (state === 'uploading' || state === 'success') return
    inputRef.current?.click()
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleRetry() {
    setState('idle')
    setErrorMsg('')
    setFileName('')
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          state === 'dragging' && 'border-primary bg-primary/5',
          state === 'idle' && 'border-border hover:border-primary/50 hover:bg-muted/50',
          state === 'uploading' && 'cursor-default border-border bg-muted/30',
          state === 'success' && 'cursor-default border-green-500 bg-green-50 dark:bg-green-950/20',
          state === 'error' && 'cursor-pointer border-destructive/50 hover:border-destructive/70',
        )}
      >
        {state === 'uploading' ? (
          <>
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-[slide_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          </>
        ) : state === 'success' ? (
          <>
            <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Upload className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Uploaded! Processing document...
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop a file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports PDF, DOCX, CSV, TXT — max 10 MB
              </p>
            </div>
          </>
        )}
      </div>

      {state === 'error' && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <button
            onClick={(e) => { e.stopPropagation(); handleRetry() }}
            className="ml-3 shrink-0 text-xs font-medium text-destructive underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.csv,.txt"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
