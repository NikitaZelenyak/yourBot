'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PersonaForm, {
  FormFieldError,
  type BotFormData,
} from '@/components/bot-builder/PersonaForm'

export default function NewBotPage() {
  const router = useRouter()

  async function handleSubmit(data: BotFormData) {
    const res = await fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()

    if (!res.ok) {
      if (json.error?.code === 'SLUG_TAKEN') {
        throw new FormFieldError('slug', 'This slug is already taken')
      }
      toast.error(json.error?.message ?? 'Something went wrong')
      return
    }

    router.push(`/bots/${json.data.id}/embed`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Create a new bot</h1>
      <PersonaForm onSubmit={handleSubmit} />
    </div>
  )
}
