'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bot, BarChart3, BookOpen, Settings, Zap, LogOut, Loader2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Bots', href: '/bots', icon: Bot },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Knowledge Bases', href: '/knowledge-bases', icon: BookOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-indigo-500/30">
          <Zap className="size-[15px] text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sidebar-foreground tracking-tight text-[15px]">
          YourBot
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        {navItems.map((item, i) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    isActive
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                  )}
                />
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-dot"
                    className="ml-auto size-1.5 rounded-full bg-sidebar-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Documentation link */}
      <div className="px-2 pb-1">
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground transition-colors"
        >
          <FileText className="size-4 shrink-0 text-sidebar-foreground/40" />
          Documentation
        </a>
      </div>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40 hover:bg-white/5 hover:text-sidebar-foreground/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {signingOut ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <LogOut className="size-4 shrink-0" />
          )}
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
