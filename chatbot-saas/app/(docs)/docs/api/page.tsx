import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import DocHeading from '@/components/docs/DocHeading'
import CodeBlock from '@/components/docs/CodeBlock'
import DocNav from '@/components/docs/DocNav'
import WasHelpful from '@/components/docs/WasHelpful'
import ApiTester from '@/components/docs/ApiTester'

const curlExample = `curl -X POST https://yourbot.ai/api/public/v1/YOUR_BOT_ID/chat \\
  -H "Authorization: Bearer cb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      { "role": "user", "content": "What are your office hours?" }
    ],
    "visitorContext": {
      "userId": "resident-123",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "pageUrl": "https://yoursite.com/support",
      "pageTitle": "Support"
    }
  }'`

const fetchExample = `const response = await fetch(
  'https://yourbot.ai/api/public/v1/YOUR_BOT_ID/chat',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer cb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'What are your office hours?' }
      ],
      visitorContext: {
        userId: 'resident-123',
        userName: 'Jane Smith',
      }
    }),
  }
)

// Response is a Server-Sent Events stream
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value, { stream: true })
  for (const line of chunk.split('\\n')) {
    if (!line.startsWith('data: ')) continue
    const raw = line.slice(6).trim()
    if (raw === '[DONE]') break

    const parsed = JSON.parse(raw)
    if (parsed.type === 'text-delta') {
      process.stdout.write(parsed.delta)
    }
  }
}`

const useChatExample = `// Simplest approach — use the Vercel AI SDK useChat hook
// Install: npm install @ai-sdk/react

import { useChat } from '@ai-sdk/react'

export function SupportWidget() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'https://yourbot.ai/api/public/v1/YOUR_BOT_ID/chat',
    headers: {
      Authorization: 'Bearer cb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    body: {
      visitorContext: {
        userId: currentUser.id,
        userName: currentUser.name,
      }
    },
  })

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      <input value={input} onChange={handleInputChange} />
      <button type="submit">Send</button>
    </form>
  )
}`

const responseExample = `// Each SSE chunk looks like this:
data: {"type":"text-delta","delta":"Hello"}

data: {"type":"text-delta","delta":", how"}

data: {"type":"text-delta","delta":" can I help?"}

data: [DONE]`

export default function ApiReferencePage() {
  return (
    <article className="space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-border">
        <DocHeading level="h1" id="rest-api">REST API Reference</DocHeading>
        <p className="text-muted-foreground text-base leading-relaxed">
          The public REST API lets you send messages to any bot from your own backend.
          All requests require an API key and return a streaming response.
        </p>
      </div>

      {/* Authentication */}
      <section className="space-y-4">
        <DocHeading level="h2" id="authentication">Authentication</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All requests must include an API key in the{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">Authorization</code> header.
        </p>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted/50 border-b border-border">
            <p className="text-xs font-mono text-muted-foreground">Header format</p>
          </div>
          <div className="px-4 py-3 font-mono text-sm text-foreground">
            Authorization: Bearer cb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>API key format: <code className="font-mono text-xs bg-muted px-1 rounded">cb_live_&lt;32 random characters&gt;</code></p>
          <p>
            Generate a key from{' '}
            <Link href="/bots" className="text-primary hover:underline">your bot&apos;s settings page</Link>.
            Each key is tied to a single bot.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">Security warning</p>
            <p>
              Never expose your API key in client-side JavaScript, HTML source, or version control.
              API keys are for server-to-server calls only. Use the embed snippet for browser-facing integrations.
            </p>
          </div>
        </div>
      </section>

      {/* Main endpoint */}
      <section className="space-y-5">
        <DocHeading level="h2" id="chat-endpoint">POST /api/public/v1/{'{botId}'}/chat</DocHeading>
        <p className="text-sm text-muted-foreground">
          Send a message to a bot and receive a streamed response.
        </p>

        {/* Request body table */}
        <div className="space-y-3">
          <DocHeading level="h3" id="request-body">Request body</DocHeading>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Field</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Required</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">messages</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">array</td>
                  <td className="px-4 py-2.5 text-xs"><span className="text-red-500 font-medium">Yes</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Array of message objects with <code className="font-mono bg-muted px-0.5 rounded">role</code> and <code className="font-mono bg-muted px-0.5 rounded">content</code>.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">messages[].role</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{'"user" | "assistant"'}</td>
                  <td className="px-4 py-2.5 text-xs"><span className="text-red-500 font-medium">Yes</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Who sent the message.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">messages[].content</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs"><span className="text-red-500 font-medium">Yes</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">The message text.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">visitorContext</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">object</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Visitor identity and page info for analytics.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground pl-8">visitorContext.userId</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Your internal user ID.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground pl-8">visitorContext.userName</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Display name shown in dashboard.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground pl-8">visitorContext.userEmail</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Email for escalation follow-up.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground pl-8">visitorContext.userPhone</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Phone for escalation follow-up.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground pl-8">visitorContext.pageUrl</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Page where the chat originated.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground pl-8">visitorContext.pageTitle</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">string</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">No</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">Human-readable page name for analytics.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-4">
          <DocHeading level="h3" id="example-curl">Example — curl</DocHeading>
          <CodeBlock code={curlExample} language="bash" />
        </div>

        <div className="space-y-4">
          <DocHeading level="h3" id="example-fetch">Example — JavaScript fetch</DocHeading>
          <CodeBlock code={fetchExample} language="javascript" />
        </div>

        {/* Response */}
        <div className="space-y-3">
          <DocHeading level="h3" id="response-format">Response format</DocHeading>
          <p className="text-sm text-muted-foreground">
            The response is a Server-Sent Events (SSE) stream with{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">Content-Type: text/event-stream</code>.
            Each event contains a JSON object.
          </p>
          <CodeBlock code={responseExample} language="text" />
        </div>
      </section>

      {/* Streaming section */}
      <section className="space-y-4">
        <DocHeading level="h2" id="streaming">Streaming — two approaches</DocHeading>

        <div className="space-y-2">
          <DocHeading level="h3" id="streaming-vercel-sdk">Option A — Vercel AI SDK (recommended)</DocHeading>
          <p className="text-sm text-muted-foreground">
            If you use React, the{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">useChat</code> hook from{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">@ai-sdk/react</code> handles
            streaming, state management, and error handling automatically.
          </p>
          <CodeBlock code={useChatExample} language="typescript" />
        </div>

        <div className="space-y-2">
          <DocHeading level="h3" id="streaming-raw">Option B — Raw ReadableStream</DocHeading>
          <p className="text-sm text-muted-foreground">
            For non-React backends or custom clients, use the raw{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">fetch</code> approach shown
            in the curl example above. Read the stream line by line, parse each{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">data: </code> line as JSON,
            and extract <code className="font-mono text-xs bg-muted px-1 rounded">delta</code> from
            chunks where <code className="font-mono text-xs bg-muted px-1 rounded">type === &quot;text-delta&quot;</code>.
          </p>
        </div>
      </section>

      {/* Try it widget */}
      <section className="space-y-4">
        <DocHeading level="h2" id="try-it">Try it</DocHeading>
        <p className="text-sm text-muted-foreground">
          Test the API directly from this page. Enter your Bot ID and API key — no code required.
        </p>
        <ApiTester />
      </section>

      <WasHelpful />
      <DocNav
        prev={{ title: 'Embed Guide', href: '/docs/embed' }}
        next={{ title: 'Visitor Tracking', href: '/docs/visitor-tracking' }}
      />
    </article>
  )
}
