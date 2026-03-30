'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import PersonaForm, { type BotFormData } from '@/components/bot-builder/PersonaForm'
import ApiKeyManager from '@/components/bot-builder/ApiKeyManager'
import KbManager from '@/components/knowledge-base/KbManager'
import { Button } from '@/components/ui/button'
import type { Bot } from '@/types'

export default function EditBotPage() {
  const params = useParams()
  const id = params.id as string

  const [bot, setBot] = useState<Bot | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/bots/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error?.code === 'NOT_FOUND') {
          setNotFound(true)
        } else {
          setBot(json.data)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data: BotFormData) {
    const res = await fetch(`/api/bots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()

    if (!res.ok) {
      toast.error(json.error?.message ?? 'Something went wrong')
      return
    }

    setBot(json.data)
    toast.success('Changes saved')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded-4xl bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (notFound || !bot) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="font-medium">Bot not found</p>
        <Button asChild variant="outline">
          <Link href="/bots">Back to bots</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit bot</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/bots/${id}/test`}>
              <FlaskConical className="mr-1.5 size-3.5" />
              Test Bot
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/bots/${id}/embed`}>View embed code</Link>
          </Button>
        </div>
      </div>
      <PersonaForm bot={bot} onSubmit={handleSubmit} />
      <div className="mt-8">
        <ApiKeyManager botId={id} />
      </div>
      <div className="mt-8">
        <KbManager botId={id} />
      </div>
    </div>
  )
}
