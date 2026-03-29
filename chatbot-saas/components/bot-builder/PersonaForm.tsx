'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Bot } from '@/types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export type BotFormData = {
  name: string
  slug: string
  persona?: string
  welcome_message?: string
  primary_color: string
}

// Thrown by the onSubmit callback to signal a field-level error back to the form.
export class FormFieldError extends Error {
  constructor(public readonly field: keyof BotFormData, message: string) {
    super(message)
    this.name = 'FormFieldError'
  }
}

const formSchema = z.object({
  name: z.string().min(1, 'Name required').max(50),
  slug: z
    .string()
    .min(1, 'Slug required')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  persona: z.string().max(2000).optional(),
  welcome_message: z.string().max(200).optional(),
  primary_color: z.string().min(1),
})

type FormValues = z.infer<typeof formSchema>

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

interface Props {
  bot?: Bot
  onSubmit: (data: BotFormData) => Promise<void>
}

export default function PersonaForm({ bot, onSubmit }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const slugManuallyEdited = useRef(!!bot)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bot?.name ?? '',
      slug: bot?.slug ?? '',
      persona: bot?.persona ?? '',
      welcome_message: bot?.welcome_message ?? '',
      primary_color: bot?.primary_color ?? '#6366f1',
    },
  })

  const personaValue = form.watch('persona') ?? ''

  async function handleSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      await onSubmit(values as BotFormData)
    } catch (err) {
      if (err instanceof FormFieldError) {
        form.setError(err.field, { message: err.message })
      } else {
        throw err
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Bot name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Customer Support Bot"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    if (!slugManuallyEdited.current) {
                      form.setValue('slug', toSlug(e.target.value), {
                        shouldValidate: true,
                      })
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Slug <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="customer-support-bot"
                  {...field}
                  onChange={(e) => {
                    slugManuallyEdited.current = true
                    field.onChange(e)
                  }}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">Used in your embed URL</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="persona"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persona</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Describe your bot's personality, purpose, and any specific knowledge..."
                  {...field}
                />
              </FormControl>
              <p className="text-right text-xs text-muted-foreground">
                {personaValue.length} / 2000
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="welcome_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Welcome message</FormLabel>
              <FormControl>
                <Input
                  placeholder="Hello! How can I help you today?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primary_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chat bubble color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="#6366f1"
                    className="font-mono"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="self-start">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {bot ? 'Saving…' : 'Creating…'}
            </span>
          ) : bot ? (
            'Save changes'
          ) : (
            'Create bot'
          )}
        </Button>
      </form>
    </Form>
  )
}
