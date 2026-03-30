'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Getting Started', href: '/docs' },
  { label: 'Embed Guide', href: '/docs/embed' },
  { label: 'JavaScript SDK', href: '/docs/embed#js-sdk' },
  { label: 'REST API', href: '/docs/api' },
  { label: 'Visitor Tracking', href: '/docs/visitor-tracking' },
  { label: 'Analytics & Data', href: '/docs/analytics' },
  { label: 'FAQ', href: '/docs/faq' },
]

export default function DocsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0">
      <nav className="sticky top-20 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-2">
          Documentation
        </p>
        {navItems.map(item => {
          const isAnchor = item.href.includes('#')
          const basePath = item.href.split('#')[0]
          const isActive = isAnchor
            ? pathname === basePath
            : pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
