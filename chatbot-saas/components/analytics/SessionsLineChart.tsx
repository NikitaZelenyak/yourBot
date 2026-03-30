'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { DailyMetrics } from '@/types'

type Props = {
  data: DailyMetrics[]
  primaryColor?: string
}

function shortDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

export default function SessionsLineChart({ data, primaryColor = '#6366f1' }: Props) {
  const chartData = data.map((m) => ({ date: shortDate(m.date), sessions: m.total_sessions }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v, 'Sessions']} />
        <Line
          type="monotone"
          dataKey="sessions"
          stroke={primaryColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
