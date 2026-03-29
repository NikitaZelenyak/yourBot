'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Bot } from '@/types'

type Props = {
  bot: Bot
}

const BASE_URL = 'http://localhost:3000'

function iframeSnippet(botId: string) {
  return `<iframe
  src="${BASE_URL}/embed/${botId}"
  width="400"
  height="600"
  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1)"
  allow="clipboard-write"
></iframe>`
}

function jsSnippet(botId: string) {
  return `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${BASE_URL}/embed/${botId}';
    iframe.style.cssText = 'position:fixed;bottom:24px;right:24px;width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999';
    document.body.appendChild(iframe);
  })();
</script>`
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl bg-zinc-900">
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-100">
          <code>{code}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-600"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy code
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Replace <code className="font-mono">localhost:3000</code> with your domain before going live.
      </p>
    </div>
  )
}

export default function EmbedPanel({ bot }: Props) {
  return (
    <Tabs defaultValue="iframe">
      <TabsList>
        <TabsTrigger value="iframe">iFrame</TabsTrigger>
        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
      </TabsList>
      <TabsContent value="iframe" className="mt-4">
        <CodeBlock code={iframeSnippet(bot.id)} label="iFrame snippet" />
      </TabsContent>
      <TabsContent value="javascript" className="mt-4">
        <CodeBlock code={jsSnippet(bot.id)} label="JavaScript snippet" />
      </TabsContent>
    </Tabs>
  )
}
