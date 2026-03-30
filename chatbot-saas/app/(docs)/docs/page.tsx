import Link from 'next/link'
import { ArrowRight, Code2, Globe } from 'lucide-react'
import DocHeading from '@/components/docs/DocHeading'
import CodeBlock from '@/components/docs/CodeBlock'
import DocNav from '@/components/docs/DocNav'
import WasHelpful from '@/components/docs/WasHelpful'

const embedExample = `<!-- Paste before </body> on any page -->
<script>
  window.ChatbotConfig = {
    botId: 'your-bot-id'
  }
</script>
<script src="https://yourbot.ai/embed.js" async></script>`

const apiExample = `curl -X POST https://yourbot.ai/api/public/v1/YOUR_BOT_ID/chat \\
  -H "Authorization: Bearer cb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'`

export default function GettingStartedPage() {
  return (
    <article className="space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-border">
        <DocHeading level="h1" id="getting-started">Getting Started</DocHeading>
        <p className="text-muted-foreground text-base leading-relaxed">
          YourBot lets you create AI-powered chatbots and embed them on any website in minutes.
          Each bot has a configurable persona, connects to your knowledge base, and tracks
          visitor conversations in an analytics dashboard.
        </p>
      </div>

      {/* Two integration paths */}
      <section className="space-y-4">
        <DocHeading level="h2" id="integration-options">Two ways to integrate</DocHeading>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/docs/embed"
            className="group rounded-xl border border-border p-5 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Globe className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="font-semibold text-sm text-foreground">Embed snippet</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Copy two lines of HTML. The chatbot appears as a floating widget on your site.
              No backend required — works on any static or dynamic site.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
              Embed guide <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            href="/docs/api"
            className="group rounded-xl border border-border p-5 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Code2 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-sm text-foreground">REST API</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Call the chat endpoint from your own backend. Streaming responses, full
              visitor context, API key authentication.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
              API reference <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="space-y-3">
        <DocHeading level="h2" id="prerequisites">Prerequisites</DocHeading>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
            A YourBot account.{' '}
            <Link href="/register" className="text-primary hover:underline">Sign up free.</Link>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
            A configured bot with a Bot ID.{' '}
            <Link href="/bots" className="text-primary hover:underline">Create one in the dashboard.</Link>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
            For REST API calls: an API key generated from your bot&apos;s settings page.
          </li>
        </ul>
      </section>

      {/* Quick start */}
      <section className="space-y-5">
        <DocHeading level="h2" id="quick-start">Quick start — 3 steps</DocHeading>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
              1
            </div>
            <div className="space-y-2 flex-1">
              <p className="font-medium text-sm text-foreground">Create a bot in the dashboard</p>
              <p className="text-sm text-muted-foreground">
                Go to{' '}
                <Link href="/bots" className="text-primary hover:underline">Bots</Link>
                {' '}→ New Bot. Give it a name and persona. Copy the Bot ID from the embed panel.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
              2
            </div>
            <div className="space-y-2 flex-1">
              <p className="font-medium text-sm text-foreground">Add the embed snippet to your site</p>
              <p className="text-sm text-muted-foreground mb-2">
                Paste these two lines before the closing <code className="font-mono text-xs bg-muted px-1 rounded">&lt;/body&gt;</code> tag.
                Replace <code className="font-mono text-xs bg-muted px-1 rounded">your-bot-id</code> with your actual Bot ID.
              </p>
              <CodeBlock code={embedExample} language="html" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">
              3
            </div>
            <div className="space-y-2 flex-1">
              <p className="font-medium text-sm text-foreground">Reload your page — the chatbot appears</p>
              <p className="text-sm text-muted-foreground">
                A floating chat button appears in the bottom-right corner of your site.
                Click it to open the conversation. The bot is live immediately — no build step required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REST API preview */}
      <section className="space-y-3">
        <DocHeading level="h2" id="rest-api-preview">Calling the API directly</DocHeading>
        <p className="text-sm text-muted-foreground">
          If you prefer server-to-server integration, use the REST API with an API key.
          See the{' '}
          <Link href="/docs/api" className="text-primary hover:underline">full API reference</Link>
          {' '}for all parameters and streaming response handling.
        </p>
        <CodeBlock code={apiExample} language="bash" />
      </section>

      <WasHelpful />
      <DocNav next={{ title: 'Embed Guide', href: '/docs/embed' }} />
    </article>
  )
}
