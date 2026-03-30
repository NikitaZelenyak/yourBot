'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { DailyMetrics } from '@/types'

type Props = {
  data: DailyMetrics[]
}

function shortDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

export default function OutcomeBarChart({ data }: Props) {
  const chartData = data.map((m) => ({
    date: shortDate(m.date),
    resolved: m.resolved_count,
    unresolved: m.unresolved_count,
    abandoned: m.abandoned_count,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="resolved" stackId="a" fill="#10b981" name="Resolved" radius={[0, 0, 0, 0]} />
        <Bar dataKey="unresolved" stackId="a" fill="#f59e0b" name="Unresolved" />
        <Bar dataKey="abandoned" stackId="a" fill="#ef4444" name="Abandoned" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
