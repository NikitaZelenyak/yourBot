import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import KbDeleteButton from '@/components/knowledge-base/KbDeleteButton'
import { AnimatedGrid, AnimatedItem, FadeIn } from '@/components/motion/AnimatedGrid'

export default async function KnowledgeBasesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: kbs } = await supabase
    .from('knowledge_bases')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const kbIds = (kbs ?? []).map((kb) => kb.id)
  const { data: docs } = kbIds.length
    ? await supabase.from('kb_documents').select('kb_id, status').in('kb_id', kbIds)
    : { data: [] }

  type Stats = { total: number; ready: number; processing: number; failed: number }
  const statsMap: Record<string, Stats> = {}
  for (const doc of docs ?? []) {
    if (!statsMap[doc.kb_id]) statsMap[doc.kb_id] = { total: 0, ready: 0, processing: 0, failed: 0 }
    statsMap[doc.kb_id].total++
    if (doc.status === 'ready') statsMap[doc.kb_id].ready++
    else if (doc.status === 'processing') statsMap[doc.kb_id].processing++
    else if (doc.status === 'failed') statsMap[doc.kb_id].failed++
  }

  if (!kbs || kbs.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="size-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold">No knowledge bases yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a knowledge base to give your bots custom knowledge
          </p>
        </div>
        <Button asChild>
          <Link href="/knowledge-bases/new">Create knowledge base</Link>
        </Button>
      </FadeIn>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <FadeIn className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Bases</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{kbs.length} knowledge base{kbs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild>
          <Link href="/knowledge-bases/new">Create knowledge base</Link>
        </Button>
      </FadeIn>

      <AnimatedGrid className="grid gap-4 sm:grid-cols-2">
        {kbs.map((kb) => {
          const stats = statsMap[kb.id] ?? { total: 0, ready: 0, processing: 0, failed: 0 }
          return (
            <AnimatedItem key={kb.id}>
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-base">{kb.name}</CardTitle>
                  {kb.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{kb.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {stats.total} document{stats.total !== 1 ? 's' : ''}
                  </Badge>
                  {stats.ready > 0 && (
                    <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {stats.ready} ready
                    </Badge>
                  )}
                  {stats.processing > 0 && (
                    <Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {stats.processing} processing
                    </Badge>
                  )}
                  {stats.failed > 0 && (
                    <Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {stats.failed} failed
                    </Badge>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/knowledge-bases/${kb.id}`}>Manage</Link>
                  </Button>
                  <KbDeleteButton kbId={kb.id} kbName={kb.name} />
                </CardFooter>
              </Card>
            </AnimatedItem>
          )
        })}
      </AnimatedGrid>
    </div>
  )
}
