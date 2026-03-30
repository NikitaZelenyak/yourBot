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
import KbDeleteButton from '@/components/knowledge-base/KbDeleteButton'

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
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-medium">No knowledge bases yet</p>
        <p className="text-sm text-muted-foreground">
          Create a knowledge base to give your bots custom knowledge
        </p>
        <Button asChild>
          <Link href="/knowledge-bases/new">Create knowledge base</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Knowledge Bases</h1>
        <Button asChild>
          <Link href="/knowledge-bases/new">Create knowledge base</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {kbs.map((kb) => {
          const stats = statsMap[kb.id] ?? { total: 0, ready: 0, processing: 0, failed: 0 }
          return (
            <Card key={kb.id}>
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
                  <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {stats.ready} ready
                  </Badge>
                )}
                {stats.processing > 0 && (
                  <Badge className="border-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {stats.processing} processing
                  </Badge>
                )}
                {stats.failed > 0 && (
                  <Badge className="border-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
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
          )
        })}
      </div>
    </div>
  )
}
