'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type TrendDir = 'up' | 'down' | 'flat'

type Props = {
  label: string
  value: string | number
  subtext?: string
  trend?: TrendDir
  trendLabel?: string
  colorCode?: boolean // for performance score
}

function TrendIcon({ dir }: { dir: TrendDir }) {
  if (dir === 'up') return <TrendingUp className="size-3.5 text-emerald-600" />
  if (dir === 'down') return <TrendingDown className="size-3.5 text-red-500" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function scoreColor(value: number) {
  if (value >= 80) return 'text-emerald-600'
  if (value >= 60) return 'text-amber-600'
  return 'text-red-500'
}

export default function MetricCard({ label, value, subtext, trend, trendLabel, colorCode }: Props) {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value))

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <p
          className={cn(
            'text-2xl font-bold leading-none',
            colorCode && !isNaN(numValue) ? scoreColor(numValue) : 'text-foreground'
          )}
        >
          {value}
        </p>
        {(subtext || trend) && (
          <div className="flex items-center gap-1 mt-1.5">
            {trend && <TrendIcon dir={trend} />}
            {trendLabel && (
              <span
                className={cn(
                  'text-xs',
                  trend === 'up'
                    ? 'text-emerald-600'
                    : trend === 'down'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                )}
              >
                {trendLabel}
              </span>
            )}
            {subtext && !trendLabel && (
              <span className="text-xs text-muted-foreground">{subtext}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
