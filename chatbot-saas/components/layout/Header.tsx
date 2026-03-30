'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const pageTitles: Record<string, string> = {
  '/bots': 'Bots',
  '/knowledge-bases': 'Knowledge Bases',
  '/settings': 'Settings',
}

function getTitle(pathname: string): string {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path)) return title
  }
  return 'Dashboard'
}

export default function Header({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const title = getTitle(pathname)
  const initial = userEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="h-14 shrink-0 flex items-center border-b bg-background/95 backdrop-blur-sm px-6 gap-4 z-10">
      <AnimatePresence mode="wait">
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="font-semibold text-foreground flex-1 text-[15px]"
        >
          {title}
        </motion.h1>
      </AnimatePresence>

      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <span className="text-xs font-bold text-white">{initial}</span>
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">
          {userEmail}
        </span>
      </div>
    </header>
  )
}
