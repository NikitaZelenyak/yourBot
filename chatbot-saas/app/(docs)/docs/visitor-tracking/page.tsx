import DocHeading from '@/components/docs/DocHeading'
import CodeBlock from '@/components/docs/CodeBlock'
import DocNav from '@/components/docs/DocNav'
import WasHelpful from '@/components/docs/WasHelpful'

const anonymousExample = `<!-- Nothing to configure — just add the embed snippet -->
<script>
  window.ChatbotConfig = { botId: 'your-bot-id' }
</script>
<script src="https://yourbot.ai/embed.js" async></script>

// Each visitor gets a random session ID automatically.
// Conversations appear in analytics as "Anonymous visitor".`

const identifiedEmbedExample = `<!-- When resident logs in, their session is available -->
<script>
  // Pull from whatever session system your site uses
  const resident = window.__RESIDENT_SESSION__ || {}

  window.ChatbotConfig = {
    botId: 'your-bot-id',
    userId:    resident.id    || undefined,
    userName:  resident.name  || undefined,
    userEmail: resident.email || undefined,
    userPhone: resident.phone || undefined,
  }
</script>
<script src="https://yourbot.ai/embed.js" async></script>`

const identifiedApiExample = `// Server-side: attach visitor context to every API call
const response = await fetch(
  'https://yourbot.ai/api/public/v1/YOUR_BOT_ID/chat',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer cb_live_xxxx',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: conversation,
      visitorContext: {
        userId:    currentUser.id,
        userName:  currentUser.fullName,
        userEmail: currentUser.email,
        userPhone: currentUser.phone,
        pageUrl:   req.headers.referer,
        pageTitle: 'Resident Portal',
      }
    }),
  }
)`

const chartwellExample = `// Chartwell example — resident logged into chartwell.com
// Your backend already has the resident in session

app.post('/api/chat', async (req, res) => {
  const resident = req.session.resident  // your existing auth session

  const response = await fetch(
    'https://yourbot.ai/api/public/v1/CHARTWELL_BOT_ID/chat',
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.YOURBOT_API_KEY}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: req.body.messages,
        visitorContext: {
          userId:    String(resident.residentId),
          userName:  resident.fullName,
          userEmail: resident.email,
          userPhone: resident.phone,
          pageUrl:   req.body.pageUrl,
          pageTitle: req.body.pageTitle,
        }
      })
    }
  )

  // Pipe the streaming response back to your client
  response.body.pipe(res)
})`

export default function VisitorTrackingPage() {
  return (
    <article className="space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-border">
        <DocHeading level="h1" id="visitor-tracking">Visitor Tracking</DocHeading>
        <p className="text-muted-foreground text-base leading-relaxed">
          Every chatbot conversation is tracked automatically. Optionally enrich each session
          with real visitor identity so conversations are attributed to known users in
          your analytics dashboard.
        </p>
      </div>

      {/* Pattern 1: Anonymous */}
      <section className="space-y-4">
        <DocHeading level="h2" id="anonymous">Pattern 1 — Anonymous visitors (default)</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No configuration required. The chatbot works out of the box for every visitor.
          Each session is assigned a random UUID as the visitor ID. Conversations appear
          in analytics as{' '}
          <span className="text-foreground font-medium">&ldquo;Anonymous visitor&rdquo;</span>.
        </p>
        <CodeBlock code={anonymousExample} language="javascript" />
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">When to use this:</strong>{' '}
            Public-facing pages where visitors are not logged in, or when you don&apos;t need
            to link conversations to specific people.
          </p>
        </div>
      </section>

      {/* Pattern 2: Identified */}
      <section className="space-y-5">
        <DocHeading level="h2" id="identified">Pattern 2 — Identified visitors</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When a visitor is logged into your site, you know who they are. Pass their profile
          data through the <code className="font-mono text-xs bg-muted px-1 rounded">ChatbotConfig</code> or
          the <code className="font-mono text-xs bg-muted px-1 rounded">visitorContext</code> API field.
          Conversations in the analytics dashboard will show their name, email, and ID.
        </p>

        <div className="space-y-3">
          <DocHeading level="h3" id="identified-embed">Via embed snippet</DocHeading>
          <CodeBlock code={identifiedEmbedExample} language="html" />
        </div>

        <div className="space-y-3">
          <DocHeading level="h3" id="identified-api">Via REST API</DocHeading>
          <CodeBlock code={identifiedApiExample} language="javascript" />
        </div>
      </section>

      {/* Chartwell example */}
      <section className="space-y-4">
        <DocHeading level="h2" id="real-world">Real-world example</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When a resident logs into your portal, you can pass their profile to the chatbot
          so every conversation is attributed to them in your analytics dashboard.
          This example shows a Node.js backend acting as a proxy.
        </p>
        <CodeBlock code={chartwellExample} language="javascript" />
      </section>

      {/* What data is stored */}
      <section className="space-y-4">
        <DocHeading level="h2" id="data-stored">What data is stored</DocHeading>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Field</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Stored</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Used for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['userId', 'Yes', 'Linking sessions to your user in analytics'],
                ['userName', 'Yes', 'Display in session replay and escalation view'],
                ['userEmail', 'Yes', 'Escalation follow-up contact'],
                ['userPhone', 'Yes', 'Escalation follow-up contact'],
                ['pageUrl', 'Yes', 'Top Pages analytics, session context'],
                ['pageTitle', 'Yes', 'Human-readable page name in analytics'],
                ['Message content', 'Yes', 'Session replay, AI topic analysis'],
              ].map(([field, stored, used]) => (
                <tr key={field}>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{field}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{stored}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Privacy note */}
      <section className="space-y-3">
        <DocHeading level="h2" id="privacy">Privacy</DocHeading>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-800 dark:bg-blue-950/20 space-y-2">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Data handling note</p>
          <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-blue-500 shrink-0" />
              Visitor data is stored in your Supabase database — you own it.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-blue-500 shrink-0" />
              Data is used only for analytics display and escalation follow-up — never shared or sold.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-blue-500 shrink-0" />
              AI analysis (intent, sentiment, topics) runs on message content only — never on PII fields.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 rounded-full bg-blue-500 shrink-0" />
              You can delete any session or visitor data directly from your Supabase dashboard.
            </li>
          </ul>
        </div>
      </section>

      <WasHelpful />
      <DocNav
        prev={{ title: 'REST API', href: '/docs/api' }}
        next={{ title: 'Analytics & Data', href: '/docs/analytics' }}
      />
    </article>
  )
}
