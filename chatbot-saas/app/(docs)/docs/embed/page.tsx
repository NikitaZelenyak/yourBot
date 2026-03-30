import DocHeading from '@/components/docs/DocHeading'
import CodeBlock from '@/components/docs/CodeBlock'
import DocNav from '@/components/docs/DocNav'
import WasHelpful from '@/components/docs/WasHelpful'
import EmbedConfigurator from '@/components/docs/EmbedConfigurator'

const iframeEmbed = `<iframe
  src="https://yourbot.ai/embed/your-bot-id"
  width="400"
  height="600"
  style="border:none; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.12);"
  title="Chat with us"
></iframe>`

const jsSnippet = `<!-- Add before </body> -->
<script>
  window.ChatbotConfig = {
    botId: 'your-bot-id'
  }
</script>
<script src="https://yourbot.ai/embed.js" async></script>`

const customizationSnippet = `window.ChatbotConfig = {
  botId: 'your-bot-id',

  // Widget position: 'bottom-right' | 'bottom-left' (default: 'bottom-right')
  position: 'bottom-right',

  // Override bot primary color (hex)
  primaryColor: '#6366f1',

  // Initial open state
  defaultOpen: false,

  // Widget size when open (pixels)
  width: 400,
  height: 600,
}`

const visitorDataSnippet = `window.ChatbotConfig = {
  botId: 'your-bot-id',
  userId: 'optional-your-user-id',
  userName: 'Optional Name',
  userEmail: 'optional@email.com',
  userPhone: 'optional-phone'
}`

const pageContextNote = `// These are captured automatically — you don't need to set them.
// pageUrl  → window.location.href
// pageTitle → document.title
//
// They appear in your analytics dashboard under "Top Pages".`

const sessionExample = `<!-- Example: passing data from your session/cookie -->
<script>
  // Pull from your own session, cookie, or window variable
  const user = window.currentUser || {}

  window.ChatbotConfig = {
    botId: 'your-bot-id',
    userId:    user.id    || undefined,
    userName:  user.name  || undefined,
    userEmail: user.email || undefined,
    userPhone: user.phone || undefined,
  }
</script>
<script src="https://yourbot.ai/embed.js" async></script>`

export default function EmbedGuidePage() {
  return (
    <article className="space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-border">
        <DocHeading level="h1" id="embed-guide">Embed Guide</DocHeading>
        <p className="text-muted-foreground text-base leading-relaxed">
          Two ways to embed the chatbot on your site: a plain iframe for custom layouts,
          or the JavaScript snippet for the floating widget experience.
        </p>
      </div>

      {/* Section 1: Basic iframe */}
      <section className="space-y-4">
        <DocHeading level="h2" id="basic-iframe">1. Basic iframe embed</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you want to embed the chat directly inside your page layout — for example, in a
          sidebar or dedicated support page — use a plain iframe pointing to the embed URL.
        </p>
        <CodeBlock code={iframeEmbed} language="html" />
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> The embed URL is{' '}
            <code className="font-mono bg-background px-1 rounded">https://yourbot.ai/embed/[botId]</code>.
            Replace <code className="font-mono bg-background px-1 rounded">[botId]</code> with
            your actual Bot ID from the dashboard.
          </p>
        </div>
      </section>

      {/* Section 2: JS snippet */}
      <section className="space-y-4" id="js-sdk">
        <DocHeading level="h2" id="js-snippet">2. JavaScript snippet (floating widget)</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The JavaScript snippet is the most common integration. It injects a floating chat
          button into the corner of your page. Visitors click to open a full conversation window.
        </p>
        <CodeBlock code={jsSnippet} language="html" />
        <p className="text-sm text-muted-foreground">
          The snippet is lightweight (under 5KB gzipped) and loads asynchronously — it never
          blocks your page render.
        </p>
      </section>

      {/* Section 3: Customization */}
      <section className="space-y-4">
        <DocHeading level="h2" id="customization">3. Customization options</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Extend the <code className="font-mono text-xs bg-muted px-1 rounded">ChatbotConfig</code> object
          with any of the options below to control the widget appearance and behavior.
        </p>
        <CodeBlock code={customizationSnippet} language="javascript" />
      </section>

      {/* Section 4: Visitor data with live editor */}
      <section className="space-y-4">
        <DocHeading level="h2" id="visitor-data">4. Passing visitor data</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When a visitor is logged into your site, you can pass their identity to the chatbot.
          This enriches your analytics dashboard — conversations are attributed to real users
          instead of anonymous session IDs.
        </p>
        <CodeBlock code={visitorDataSnippet} language="javascript" />
        <p className="text-sm text-muted-foreground">
          Use the live editor below to generate your personalised snippet. Edit the fields
          and copy the result directly into your site.
        </p>
        <EmbedConfigurator />
      </section>

      {/* Section 5: Page context */}
      <section className="space-y-4">
        <DocHeading level="h2" id="page-context">5. Page context (automatic)</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The JS snippet automatically captures{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">pageUrl</code> and{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">pageTitle</code> from
          the browser. You do not need to set these manually.
        </p>
        <CodeBlock code={pageContextNote} language="javascript" />
        <p className="text-sm text-muted-foreground">
          These values appear in the analytics dashboard under{' '}
          <strong className="text-foreground">Top Pages</strong>, showing which pages on
          your site generate the most chatbot conversations.
        </p>
      </section>

      {/* Full real-world example */}
      <section className="space-y-4">
        <DocHeading level="h2" id="real-world-example">Real-world example</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is the pattern to use when residents log in to your portal. Pull their data
          from your existing session and pass it through.
        </p>
        <CodeBlock code={sessionExample} language="html" />
      </section>

      <WasHelpful />
      <DocNav
        prev={{ title: 'Getting Started', href: '/docs' }}
        next={{ title: 'REST API', href: '/docs/api' }}
      />
    </article>
  )
}
