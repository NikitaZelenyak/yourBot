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
import { Bot } from 'lucide-react'
import { AnimatedGrid, AnimatedItem, FadeIn } from '@/components/motion/AnimatedGrid'

export default async function BotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bots } = await supabase
    .from('bots')
    .select('id, name, slug, primary_color, is_active, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (!bots || bots.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="size-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold">No bots yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first chatbot in minutes
          </p>
        </div>
        <Button asChild>
          <Link href="/bots/new">Create your first bot</Link>
        </Button>
      </FadeIn>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <FadeIn className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your bots</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{bots.length} bot{bots.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button asChild>
          <Link href="/bots/new">Create new bot</Link>
        </Button>
      </FadeIn>

      <AnimatedGrid className="grid gap-4 sm:grid-cols-2">
        {bots.map((bot) => (
          <AnimatedItem key={bot.id}>
            <Card className="group h-full shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="size-3.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-card"
                      style={{ backgroundColor: bot.primary_color }}
                    />
                    <CardTitle className="truncate text-base">{bot.name}</CardTitle>
                  </div>
                  <Badge
                    variant={bot.is_active ? 'default' : 'outline'}
                    className={bot.is_active ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15' : ''}
                  >
                    {bot.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">/embed/{bot.slug}</p>
              </CardHeader>
              <CardContent />
              <CardFooter className="gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/bots/${bot.id}`}>Edit</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/bots/${bot.id}/embed`}>Embed</Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="ml-auto text-muted-foreground">
                  <Link href={`/bots/${bot.id}/test`}>Test chat →</Link>
                </Button>
              </CardFooter>
            </Card>
          </AnimatedItem>
        ))}
      </AnimatedGrid>
    </div>
  )
}
