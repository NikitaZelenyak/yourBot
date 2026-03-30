'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import DocHeading from '@/components/docs/DocHeading'
import DocNav from '@/components/docs/DocNav'
import WasHelpful from '@/components/docs/WasHelpful'

type FaqItem = {
  id: string
  question: string
  answer: React.ReactNode
}

const faqs: FaqItem[] = [
  {
    id: 'get-bot-id',
    question: 'How do I get my Bot ID?',
    answer: (
      <p>
        Go to the{' '}
        <Link href="/bots" className="text-primary hover:underline">Bots</Link>
        {' '}page in your dashboard, open a bot, and click the{' '}
        <strong>Embed</strong> tab. Your Bot ID is shown there. It&apos;s also the last segment of your
        embed URL: <code className="font-mono text-xs bg-muted px-1 rounded">yourbot.ai/embed/[botId]</code>.
      </p>
    ),
  },
  {
    id: 'customize-appearance',
    question: 'Can I customize the chat widget appearance?',
    answer: (
      <div className="space-y-2">
        <p>
          Yes. Set <code className="font-mono text-xs bg-muted px-1 rounded">primaryColor</code>,{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">position</code>,{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">width</code>, and{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">height</code> in your{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">ChatbotConfig</code> object.
          The bot&apos;s persona, welcome message, and avatar are configured in the dashboard.
        </p>
        <p>
          See the{' '}
          <Link href="/docs/embed#customization" className="text-primary hover:underline">
            Customization section
          </Link>
          {' '}of the Embed Guide for all options.
        </p>
      </div>
    ),
  },
  {
    id: 'bot-doesnt-know',
    question: "What happens when the bot doesn't know the answer?",
    answer: (
      <div className="space-y-2">
        <p>
          The bot responds honestly — it says something like &ldquo;I&apos;m not sure&rdquo; or &ldquo;I don&apos;t have
          that information&rdquo;. After two such responses in a session, an escalation form appears
          so the visitor can request a callback.
        </p>
        <p>
          The unanswered question is also logged in your{' '}
          <Link href="/analytics" className="text-primary hover:underline">analytics dashboard</Link>
          {' '}so you can see which questions the bot is missing and update your knowledge base.
        </p>
      </div>
    ),
  },
  {
    id: 'knowledge-base',
    question: "How do I add content to my bot's knowledge base?",
    answer: (
      <div className="space-y-2">
        <p>
          Go to{' '}
          <Link href="/knowledge-bases" className="text-primary hover:underline">Knowledge Bases</Link>
          {' '}in the dashboard. Create a knowledge base, then upload documents (PDF, DOCX, CSV, or TXT).
          The documents are automatically chunked and indexed.
        </p>
        <p>
          Then connect the knowledge base to your bot from the bot&apos;s settings page.
          The bot will use the documents to answer questions immediately.
        </p>
      </div>
    ),
  },
  {
    id: 'data-security',
    question: 'Is conversation data secure?',
    answer: (
      <div className="space-y-2">
        <p>
          Yes. All data is stored in your Supabase instance with Row Level Security (RLS)
          enabled — only your account can access your bots and conversations.
          API keys are stored as SHA-256 hashes (never as plain text).
          Data is never shared with third parties.
        </p>
        <p>
          For enterprise security requirements, contact us about self-hosted deployment options.
        </p>
      </div>
    ),
  },
  {
    id: 'multiple-bots-same-kb',
    question: 'Can multiple bots use the same knowledge base?',
    answer: (
      <p>
        Yes. You can connect one knowledge base to multiple bots from each bot&apos;s settings page.
        Changes to the knowledge base (new documents, deletions) apply to all connected bots
        immediately.
      </p>
    ),
  },
  {
    id: 'test-before-live',
    question: 'How do I test my bot before going live?',
    answer: (
      <div className="space-y-2">
        <p>
          Open any bot in the dashboard and click the{' '}
          <strong>Test</strong> tab. This opens a live chat preview directly in the dashboard —
          you can have a full conversation with the bot, and you&apos;ll see which knowledge base
          chunks it used to answer each question (RAG debug mode).
        </p>
        <p>
          You can also use the{' '}
          <Link href="/docs/api#try-it" className="text-primary hover:underline">
            Try it widget
          </Link>
          {' '}on the API docs page to test the REST API with your key and bot ID.
        </p>
      </div>
    ),
  },
  {
    id: 'languages',
    question: 'What languages does the bot support?',
    answer: (
      <p>
        The bot uses GPT-4o under the hood, which supports over 50 languages.
        Simply write your bot&apos;s persona in the target language, or instruct it to
        respond in the same language as the visitor.
        Documents in your knowledge base can be in any language.
      </p>
    ),
  },
  {
    id: 'token-counting',
    question: 'How are tokens counted for billing?',
    answer: (
      <div className="space-y-2">
        <p>
          Each chat request consumes tokens for the system prompt, conversation history,
          and knowledge base context (if connected), plus the model&apos;s response.
          Longer personas, more conversation history, and larger KB contexts use more tokens.
        </p>
        <p>
          Usage limits and billing are managed in the dashboard under Settings.
          The current plan details and soft usage limits are visible in the sidebar.
        </p>
      </div>
    ),
  },
  {
    id: 'export-data',
    question: 'Can I export conversation data?',
    answer: (
      <div className="space-y-2">
        <p>
          Yes. Go to{' '}
          <Link href="/analytics" className="text-primary hover:underline">Analytics</Link>
          {' '}→ select a bot → Conversations. Use the export button to download a CSV
          of all sessions and messages for the selected date range.
        </p>
        <p>
          For full data access, you can also query your Supabase database directly using
          the <code className="font-mono text-xs bg-muted px-1 rounded">chat_sessions</code> and{' '}
          <code className="font-mono text-xs bg-muted px-1 rounded">chat_messages</code> tables.
        </p>
      </div>
    ),
  },
]

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        {item.question}
        <ChevronDown
          className={cn('size-4 text-muted-foreground shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed space-y-2 border-t border-border bg-muted/10 pt-4">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <article className="space-y-10">
      {/* Header */}
      <div className="space-y-3 pb-2 border-b border-border">
        <DocHeading level="h1" id="faq">Frequently Asked Questions</DocHeading>
        <p className="text-muted-foreground text-base leading-relaxed">
          Quick answers to the most common integration and usage questions.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map(item => (
          <FaqAccordion key={item.id} item={item} />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        Still have questions?{' '}
        <Link href="/docs" className="text-primary hover:underline">
          Browse the full documentation
        </Link>{' '}
        or contact us at{' '}
        <a href="mailto:support@yourbot.ai" className="text-primary hover:underline">
          support@yourbot.ai
        </a>.
      </div>

      <WasHelpful />
      <DocNav
        prev={{ title: 'Analytics & Data', href: '/docs/analytics' }}
      />
    </article>
  )
}
