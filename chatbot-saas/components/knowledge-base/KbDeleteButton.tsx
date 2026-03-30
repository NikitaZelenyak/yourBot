'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface Props {
  kbId: string
  kbName: string
}

export default function KbDeleteButton({ kbId, kbName }: Props) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm(`Delete "${kbName}"? This will permanently remove all documents and cannot be undone.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to delete knowledge base')
        return
      }

      toast.success('Knowledge base deleted')
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
