'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneCall, X, Check } from 'lucide-react'

type Props = {
  botId: string
  sessionId: string | null
  prefilledName?: string
  prefilledMessage?: string
  primaryColor?: string
}

export default function EscalationForm({
  botId,
  sessionId,
  prefilledName = '',
  prefilledMessage = '',
  primaryColor = '#6366f1',
}: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(prefilledName)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(prefilledMessage)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!sessionId) { setError('Session not started yet'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          botId,
          visitorName: name || undefined,
          visitorEmail: email,
          message,
          originalQuestion: prefilledMessage || undefined,
        }),
      })
      if (res.ok || res.status === 201) {
        setSubmitted(true)
      } else {
        const json = await res.json().catch(() => null)
        setError(json?.error?.message ?? 'Failed to submit. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-2 mb-2">
      <AnimatePresence mode="wait">
        {!open && !submitted && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-dashed px-4 py-3 flex items-center justify-between gap-3 bg-muted/50"
          >
            <div className="flex items-center gap-2.5">
              <PhoneCall className="size-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground leading-snug">
                Need more help? Talk to our team &rarr;
              </p>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setOpen(true)}
            >
              Request callback
            </Button>
          </motion.div>
        )}

        {open && !submitted && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="rounded-xl border bg-background px-4 py-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Request a callback</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <Input
              placeholder="Your name (optional)"
              className="h-8 text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              placeholder="Email address *"
              className="h-8 text-xs"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Textarea
              placeholder="What did you need help with?"
              className="text-xs resize-none h-16"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {error && <p className="text-[10px] text-red-500">{error}</p>}

            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs"
              style={{ backgroundColor: primaryColor }}
              disabled={loading}
            >
              {loading ? 'Submitting…' : 'Submit'}
            </Button>
          </motion.form>
        )}

        {submitted && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border bg-emerald-50 px-4 py-3 flex items-center gap-2.5"
          >
            <Check className="size-3.5 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700">We&apos;ll be in touch soon!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
