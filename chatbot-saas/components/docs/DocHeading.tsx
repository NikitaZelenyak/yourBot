'use client'

import { Link } from 'lucide-react'
import { cn } from '@/lib/utils'

type HeadingLevel = 'h1' | 'h2' | 'h3'

type DocHeadingProps = {
  level?: HeadingLevel
  id: string
  children: React.ReactNode
  className?: string
}

export default function DocHeading({ level = 'h2', id, children, className }: DocHeadingProps) {
  function handleClick() {
    const url = new URL(window.location.href)
    url.hash = id
    window.history.pushState({}, '', url.toString())
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const Tag = level

  const sizeMap: Record<HeadingLevel, string> = {
    h1: 'text-3xl font-bold tracking-tight text-foreground',
    h2: 'text-xl font-semibold text-foreground',
    h3: 'text-base font-semibold text-foreground',
  }

  return (
    <Tag
      id={id}
      className={cn('group flex items-center gap-2 scroll-mt-20', sizeMap[level], className)}
    >
      {children}
      <button
        onClick={handleClick}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        aria-label="Copy anchor link"
      >
        <Link className="size-4" />
      </button>
    </Tag>
  )
}
