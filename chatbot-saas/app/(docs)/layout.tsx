import Link from 'next/link'
import { Zap, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DocsSidebar from '@/components/docs/DocsSidebar'

export const metadata = {
  title: 'Documentation — YourBot',
  description: 'Integration guides, API reference, and embed documentation for YourBot.',
}

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  // Optionally show "Back to Dashboard" if logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/docs" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow shadow-indigo-500/30">
              <Zap className="size-[13px] text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground tracking-tight text-sm">YourBot</span>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm text-muted-foreground">Docs</span>
          </Link>

          {user && (
            <Link
              href="/bots"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="size-4" />
              Back to Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex gap-10">
          <DocsSidebar />
          <main className="flex-1 min-w-0 max-w-3xl">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
