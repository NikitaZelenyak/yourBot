'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bot, BookOpen, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Bots', href: '/bots', icon: Bot },
  { label: 'Knowledge Bases', href: '/knowledge-bases', icon: BookOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-card">
      <div className="px-4 py-5">
        <span className="text-sm font-semibold">YourBot</span>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted',
                pathname.startsWith(item.href)
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <Separator />
      <div className="px-2 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}
