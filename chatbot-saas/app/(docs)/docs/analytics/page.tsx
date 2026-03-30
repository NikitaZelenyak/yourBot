import Link from 'next/link'
import DocHeading from '@/components/docs/DocHeading'
import CodeBlock from '@/components/docs/CodeBlock'
import DocNav from '@/components/docs/DocNav'
import WasHelpful from '@/components/docs/WasHelpful'

const performanceFormula = `Score = (resolution_rate × 40)
      + (min(avg_messages, 10) × 3)
      + (sentiment_score × 30)

Where:
  resolution_rate = resolved_sessions / total_sessions   (0 → 1)
  avg_messages    = capped at 10, giving max 30 points
  sentiment_score = positive→1.0, neutral→0.5, negative→0.0

Maximum score: 40 + 30 + 30 = 100`

export default function AnalyticsPage() {
  return (
    <article className="space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-border">
        <DocHeading level="h1" id="analytics">Analytics & Data</DocHeading>
        <p className="text-muted-foreground text-base leading-relaxed">
          Every chatbot conversation generates rich analytics data. The dashboard gives you
          real-time session metrics, AI-powered topic analysis, and actionable insights
          on how your bot is performing.
        </p>
      </div>

      {/* Dashboard overview */}
      <section className="space-y-5">
        <DocHeading level="h2" id="available-analytics">What&apos;s in the dashboard</DocHeading>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Session replay',
              description: 'Read the full transcript of any conversation. See visitor identity, page URL, sentiment, and outcome side by side with the chat thread.',
              href: '/analytics',
            },
            {
              title: 'Conversation outcomes',
              description: 'Every session is classified as resolved, unresolved, or abandoned. Track your resolution rate over time with the sessions line chart.',
              href: '/analytics',
            },
            {
              title: 'Topic clusters',
              description: 'AI groups similar questions into topic clusters daily. See which topics are rising, stable, or falling — useful for KB updates.',
              href: '/analytics',
            },
            {
              title: 'Unanswered questions tracker',
              description: 'When the bot says "I don\'t know", the question is logged here. Sorted by frequency. Mark as resolved once you\'ve updated the knowledge base.',
              href: '/analytics',
            },
            {
              title: 'Peak usage heatmap',
              description: 'A 7-day × 24-hour grid showing when your chatbot is busiest. Use this to staff human support around peak hours.',
              href: '/analytics',
            },
            {
              title: 'Page-level analytics',
              description: 'Which pages on your site generate the most chatbot conversations? Top Pages table shows session count, messages, and resolution rate per URL.',
              href: '/analytics',
            },
          ].map(item => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <p className="font-semibold text-sm text-foreground mb-1.5">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI analysis pipeline */}
      <section className="space-y-5">
        <DocHeading level="h2" id="ai-pipeline">AI analysis pipeline</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Analytics are computed in two layers: real-time signals during the conversation,
          and a nightly AI batch job that processes all sessions from the previous day.
        </p>

        <div className="space-y-4">
          <DocHeading level="h3" id="realtime-signals">Real-time signals</DocHeading>
          <p className="text-sm text-muted-foreground">
            These metrics are computed instantly, with no AI cost:
          </p>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Signal</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">How it works</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-foreground">Outcome</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <strong className="text-foreground">Resolved</strong> — bot answered confidently (no uncertain phrases). {' '}
                    <strong className="text-foreground">Unresolved</strong> — bot used uncertain phrases 2+ times. {' '}
                    <strong className="text-foreground">Abandoned</strong> — session ended with fewer than 2 bot messages.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-foreground">Unanswered detection</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    Scans bot responses for phrases: &ldquo;I don&apos;t know&rdquo;, &ldquo;I&apos;m not sure&rdquo;,
                    &ldquo;I don&apos;t have information&rdquo;, &ldquo;I cannot find&rdquo;, etc.
                    Logged to the unanswered questions tracker immediately.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-foreground">Message count</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    Incremented on every message exchange.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <DocHeading level="h3" id="nightly-batch">Nightly AI batch (2am UTC)</DocHeading>
          <p className="text-sm text-muted-foreground">
            A cron job runs at 2am UTC daily using GPT-4o-mini to analyse all sessions from
            the previous day. This adds richer signals at minimal cost (~$0.30/day per client
            at 1,000 sessions/day):
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {[
              'Intent classification — what was the visitor trying to do?',
              'Sentiment analysis — positive, neutral, or negative conversation?',
              'Topic clustering — group similar questions across all sessions',
              'Performance score — composite metric (see formula below)',
              'Daily metrics snapshot — totals for the day written to daily_metrics table',
              'Unanswered question deduplication — merge near-identical questions and update frequency',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Performance score */}
      <section className="space-y-4">
        <DocHeading level="h2" id="performance-score">Performance score formula</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each bot receives a daily performance score out of 100. The formula is published
          here so you know exactly how it&apos;s calculated — no black box.
        </p>
        <CodeBlock code={performanceFormula} language="text" />
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-green-500" />
            80+ = Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-amber-500" />
            60–79 = Needs improvement
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-red-500" />
            &lt;60 = Review bot persona and knowledge base
          </span>
        </div>
      </section>

      {/* Escalations */}
      <section className="space-y-4">
        <DocHeading level="h2" id="escalations">Escalations</DocHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When the bot cannot answer a question — detected by 2+ uncertain responses in a session,
          or when the visitor explicitly asks to speak to someone — an escalation form appears
          in the chat widget.
        </p>
        <p className="text-sm text-muted-foreground">
          The visitor submits their name, email, and a short message. This creates an escalation
          record in your dashboard.
        </p>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Step</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">What happens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground">Bot detects uncertainty</td>
                <td className="px-4 py-2.5 text-muted-foreground">Escalation widget appears inline after the bot&apos;s response.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground">Visitor submits form</td>
                <td className="px-4 py-2.5 text-muted-foreground">Name, email, message stored. Session outcome marked &ldquo;unresolved&rdquo;.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground">Appears in dashboard</td>
                <td className="px-4 py-2.5 text-muted-foreground">Escalation badge on session, count in unanswered tracker.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground">Your team follows up</td>
                <td className="px-4 py-2.5 text-muted-foreground">Contact the visitor directly via email/phone. Mark escalation as &ldquo;contacted&rdquo; or &ldquo;resolved&rdquo;.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Email notifications for escalations are planned for a future release.
            Currently, escalations are visible in the dashboard only.
            Visit{' '}
            <Link href="/analytics" className="text-primary hover:underline">Analytics</Link>
            {' '}→ select a bot → Conversations to see escalation status.
          </p>
        </div>
      </section>

      <WasHelpful />
      <DocNav
        prev={{ title: 'Visitor Tracking', href: '/docs/visitor-tracking' }}
        next={{ title: 'FAQ', href: '/docs/faq' }}
      />
    </article>
  )
}
