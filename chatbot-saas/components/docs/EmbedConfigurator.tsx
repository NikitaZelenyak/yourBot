'use client'

import { useState } from 'react'
import { Check, Copy, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Config = {
  botId: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
}

function generateSnippet(config: Config): string {
  const lines = [
    `<script>`,
    `  window.ChatbotConfig = {`,
    `    botId: '${config.botId || 'your-bot-id'}',`,
  ]
  if (config.userId) lines.push(`    userId: '${config.userId}',`)
  if (config.userName) lines.push(`    userName: '${config.userName}',`)
  if (config.userEmail) lines.push(`    userEmail: '${config.userEmail}',`)
  if (config.userPhone) lines.push(`    userPhone: '${config.userPhone}',`)
  lines.push(`  }`)
  lines.push(`</script>`)
  lines.push(`<script src="https://yourbot.ai/embed.js" async></script>`)
  return lines.join('\n')
}

export default function EmbedConfigurator() {
  const [config, setConfig] = useState<Config>({
    botId: 'your-bot-id',
    userId: '',
    userName: '',
    userEmail: '',
    userPhone: '',
  })
  const [copied, setCopied] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const snippet = generateSnippet(config)

  function update(key: keyof Config) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfig(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold text-foreground">Live snippet editor</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Edit the fields below to generate your personalised embed snippet.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left: inputs */}
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cfg-bot-id" className="text-xs">
              botId <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cfg-bot-id"
              value={config.botId}
              onChange={update('botId')}
              placeholder="your-bot-id"
              className="font-mono text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-user-id" className="text-xs text-muted-foreground">
              userId <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="cfg-user-id"
              value={config.userId}
              onChange={update('userId')}
              placeholder="resident-12345"
              className="font-mono text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-user-name" className="text-xs text-muted-foreground">
              userName <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="cfg-user-name"
              value={config.userName}
              onChange={update('userName')}
              placeholder="Jane Smith"
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-email" className="text-xs text-muted-foreground">
              userEmail <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="cfg-email"
              value={config.userEmail}
              onChange={update('userEmail')}
              placeholder="jane@example.com"
              className="font-mono text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cfg-phone" className="text-xs text-muted-foreground">
              userPhone <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="cfg-phone"
              value={config.userPhone}
              onChange={update('userPhone')}
              placeholder="+1 555 000 1234"
              className="font-mono text-xs h-8"
            />
          </div>
        </div>

        {/* Right: generated snippet */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Generated snippet
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="size-3.5" />
                Preview
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <><Check className="size-3.5 text-green-400" /><span className="text-green-500">Copied</span></>
                ) : (
                  <><Copy className="size-3.5" />Copy</>
                )}
              </button>
            </div>
          </div>
          <pre className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-xs font-mono text-zinc-100 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {snippet}
          </pre>
        </div>
      </div>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-sm">Embed preview</DialogTitle>
          </DialogHeader>
          <div className="h-[480px] bg-muted/30 flex items-center justify-center">
            {config.botId && config.botId !== 'your-bot-id' ? (
              <iframe
                src={`/embed/${config.botId}`}
                className="w-full h-full border-0"
                title="Bot preview"
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground px-6">
                <p className="font-medium mb-1">Enter a valid Bot ID</p>
                <p className="text-xs">The preview loads your bot in a real iframe.</p>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t bg-muted/20">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
