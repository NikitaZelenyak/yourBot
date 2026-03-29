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
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-medium">No bots yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first chatbot in minutes
        </p>
        <Button asChild>
          <Link href="/bots/new">Create your first bot</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your bots</h1>
        <Button asChild>
          <Link href="/bots/new">Create new bot</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {bots.map((bot) => (
          <Card key={bot.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: bot.primary_color }}
                  />
                  <CardTitle className="truncate">{bot.name}</CardTitle>
                </div>
                <Badge variant={bot.is_active ? 'default' : 'outline'}>
                  {bot.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">/embed/{bot.slug}</p>
            </CardHeader>
            <CardContent />
            <CardFooter className="gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/bots/${bot.id}`}>Edit</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/bots/${bot.id}/embed`}>Embed</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
