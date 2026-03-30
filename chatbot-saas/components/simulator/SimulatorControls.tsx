'use client'

import { useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Bot, SimulatorConfig, SimulatorVisitor } from '@/types/index'

const SIMULATED_PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Retirement Living', path: '/retirement-living' },
  { label: 'Pricing & Fees', path: '/pricing' },
  { label: 'Dining Options', path: '/dining' },
  { label: 'Medical Services', path: '/medical' },
  { label: 'Activities & Events', path: '/activities' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Custom URL', path: 'custom' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home — Chartwell',
  '/retirement-living': 'Retirement Living — Chartwell',
  '/pricing': 'Pricing & Fees — Chartwell',
  '/dining': 'Dining Options — Chartwell',
  '/medical': 'Medical Services — Chartwell',
  '/activities': 'Activities & Events — Chartwell',
  '/contact': 'Contact Us — Chartwell',
}

const QUICK_MESSAGES = [
  'What are your pricing options?',
  'Tell me about your dining options',
  'What medical services do you offer?',
  'How do I book a tour?',
  'What activities are available for residents?',
  'I need to speak to someone',
  'What makes Chartwell different?',
]

interface SimulatorControlsProps {
  bots: Pick<Bot, 'id' | 'name' | 'slug' | 'welcome_message'>[]
  config: SimulatorConfig
  onApply: (config: SimulatorConfig) => void
  onReset: () => void
  onQuickMessage: (text: string) => void
}

export default function SimulatorControls({
  bots,
  config,
  onApply,
  onReset,
  onQuickMessage,
}: SimulatorControlsProps) {
  const [draft, setDraft] = useState<SimulatorConfig>(config)

  function handleBotChange(botId: string) {
    const bot = bots.find((b) => b.id === botId)
    if (!bot) return
    setDraft((d) => ({
      ...d,
      botId: bot.id,
      botName: bot.name,
      welcomeMessage: bot.welcome_message,
    }))
  }

  function handlePageChange(path: string) {
    const title = PAGE_TITLES[path] ?? draft.pageTitle
    const label = SIMULATED_PAGES.find((p) => p.path === path)?.label ?? 'Custom URL'
    setDraft((d) => ({ ...d, pagePath: path, pageLabel: label, pageTitle: title }))
  }

  function handleVisitorChange(patch: Partial<SimulatorVisitor>) {
    setDraft((d) => ({ ...d, visitor: { ...d.visitor, ...patch } }))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Bot selection */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bot</Label>
        <Select value={draft.botId} onValueChange={handleBotChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a bot…" />
          </SelectTrigger>
          <SelectContent>
            {bots.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
                <span className="ml-1.5 text-muted-foreground text-xs font-mono">/{b.slug}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {draft.botId && (
          <a
            href={`/bots/${draft.botId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3" />
            Open bot settings to generate an API key
          </a>
        )}
      </div>

      {/* API Key */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">API Key</Label>
        <Input
          value={draft.apiKey}
          onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
          placeholder="cb_live_…"
          className="font-mono text-sm"
        />
        {!draft.apiKey && (
          <p className="text-xs text-muted-foreground">
            Generate a key in Bot Settings if you don&apos;t have one
          </p>
        )}
      </div>

      {/* Visitor identity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visitor Identity</Label>
          <Switch
            checked={draft.visitor.enabled}
            onCheckedChange={(checked: boolean) => handleVisitorChange({ enabled: checked })}
          />
        </div>
        {draft.visitor.enabled && (
          <div className="space-y-2 pt-1">
            {[
              { label: 'Visitor ID', key: 'visitorId' as const },
              { label: 'Name', key: 'name' as const },
              { label: 'Email', key: 'email' as const },
              { label: 'Phone', key: 'phone' as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-1">{label}</Label>
                <Input
                  value={draft.visitor[key]}
                  onChange={(e) => handleVisitorChange({ [key]: e.target.value })}
                  className="text-sm h-8"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulated page */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Simulated Page</Label>
        <Select value={draft.pagePath} onValueChange={handlePageChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a page…" />
          </SelectTrigger>
          <SelectContent>
            {SIMULATED_PAGES.map((p) => (
              <SelectItem key={p.path} value={p.path}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {draft.pagePath === 'custom' && (
          <Input
            value={draft.customUrl}
            onChange={(e) => setDraft((d) => ({ ...d, customUrl: e.target.value }))}
            placeholder="/custom-path"
            className="text-sm font-mono mt-1.5"
          />
        )}
        <div className="mt-1">
          <Label className="text-xs text-muted-foreground mb-1">Page title</Label>
          <Input
            value={draft.pageTitle}
            onChange={(e) => setDraft((d) => ({ ...d, pageTitle: e.target.value }))}
            className="text-sm h-8"
          />
        </div>
      </div>

      {/* Apply / Reset */}
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={() => onApply(draft)}>Apply settings</Button>
        <Button variant="outline" size="icon" onClick={onReset} title="Reset conversation">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* Analytics link */}
      {draft.botId && (
        <a
          href={`/analytics/${draft.botId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-3" />
          View Analytics for this bot
        </a>
      )}

      {/* Quick test messages */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Test Messages</Label>
        <div className="space-y-1">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => onQuickMessage(msg)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 hover:text-foreground text-muted-foreground transition-colors truncate"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
