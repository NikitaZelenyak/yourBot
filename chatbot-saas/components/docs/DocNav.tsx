import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type NavPage = {
  title: string
  href: string
}

type DocNavProps = {
  prev?: NavPage
  next?: NavPage
}

export default function DocNav({ prev, next }: DocNavProps) {
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>
            <span className="block text-xs text-muted-foreground/60 mb-0.5">Previous</span>
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
        >
          <span>
            <span className="block text-xs text-muted-foreground/60 mb-0.5">Next</span>
            {next.title}
          </span>
          <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
