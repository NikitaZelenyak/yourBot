'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import SparklineChart from './SparklineChart'
import type { Bot } from '@/types'

type Props = {
  bot: Bot
  totalSessions: number
  resolutionRate: number
  performanceScore: number
  sparkData: { value: number }[]
}

function scoreColor(val: number) {
  if (val >= 80) return 'text-emerald-600'
  if (val >= 60) return 'text-amber-600'
  return 'text-red-500'
}

export default function AnalyticsBotRow({
  bot,
  totalSessions,
  resolutionRate,
  performanceScore,
  sparkData,
}: Props) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Bot info */}
          <div className="flex items-center gap-3 min-w-0 sm:w-48 shrink-0">
            <span
              className="size-3 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-card"
              style={{ backgroundColor: bot.primary_color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{bot.name}</p>
              <Badge
                variant={bot.is_active ? 'default' : 'outline'}
                className={cn(
                  'text-[10px] px-1.5 py-0 h-4 mt-0.5',
                  bot.is_active
                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200'
                    : ''
                )}
              >
                {bot.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex gap-6 flex-1 min-w-0">
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-bold">{totalSessions}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sessions</p>
            </div>
            <div className="text-center min-w-[70px]">
              <p className="text-lg font-bold">{resolutionRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolved</p>
            </div>
            <div className="text-center min-w-[70px]">
              <p className={cn('text-lg font-bold', scoreColor(performanceScore))}>
                {performanceScore}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
            </div>
          </div>

          {/* Sparkline */}
          <div className="w-32 shrink-0">
            <SparklineChart data={sparkData.length > 0 ? sparkData : [{ value: 0 }]} color={bot.primary_color} />
          </div>

          {/* Link */}
          <Link
            href={`/analytics/${bot.id}`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            View detail <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
