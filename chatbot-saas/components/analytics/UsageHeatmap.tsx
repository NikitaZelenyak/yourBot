'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = { botId: string }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

type HeatCell = { day: number; hour: number; count: number }

export default function UsageHeatmap({ botId }: Props) {
  const [cells, setCells] = useState<HeatCell[]>([])
  const [loading, setLoading] = useState(true)
  const [maxCount, setMaxCount] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        // Fetch last 30 days of sessions for heatmap
        const res = await fetch(`/api/analytics/${botId}/conversations?limit=100`)
        const json = await res.json()
        if (!json.data) return

        const map = new Map<string, number>()
        for (const session of json.data.sessions ?? []) {
          const dt = new Date(session.started_at)
          const key = `${dt.getDay()}-${dt.getHours()}`
          map.set(key, (map.get(key) ?? 0) + 1)
        }

        const built: HeatCell[] = []
        let max = 1
        for (const [key, count] of map.entries()) {
          const [day, hour] = key.split('-').map(Number)
          built.push({ day, hour, count })
          if (count > max) max = count
        }

        setCells(built)
        setMaxCount(max)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [botId])

  if (loading) {
    return <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }

  function cellCount(day: number, hour: number) {
    return cells.find((c) => c.day === day && c.hour === hour)?.count ?? 0
  }

  function intensity(count: number) {
    if (count === 0) return 0
    return count / maxCount
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex pl-8 mb-0.5">
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <div
              key={h}
              className="text-[9px] text-muted-foreground"
              style={{ width: `${(3 / 24) * 100}%`, textAlign: 'center' }}
            >
              {h}:00
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <span className="text-[10px] text-muted-foreground w-7 shrink-0 text-right pr-1">{day}</span>
            {HOURS.map((hour) => {
              const count = cellCount(dayIdx, hour)
              const alpha = intensity(count)
              return (
                <div
                  key={hour}
                  title={count > 0 ? `${day} ${hour}:00 — ${count} sessions` : undefined}
                  className="flex-1 h-4 rounded-[2px] cursor-default"
                  style={{
                    backgroundColor: `rgba(99,102,241,${alpha > 0 ? Math.max(0.1, alpha) : 0})`,
                    border: '1px solid rgba(99,102,241,0.1)',
                  }}
                />
              )
            })}
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 0.2, 0.5, 0.8, 1].map((a) => (
            <div
              key={a}
              className="size-3 rounded-[2px]"
              style={{ backgroundColor: `rgba(99,102,241,${a > 0 ? Math.max(0.1, a) : 0})`, border: '1px solid rgba(99,102,241,0.15)' }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  )
}
