'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

type Props = {
  positive: number
  neutral: number
  negative: number
}

const COLORS = ['#10b981', '#94a3b8', '#ef4444']
const LABELS = ['Positive', 'Neutral', 'Negative']

export default function SentimentPieChart({ positive, neutral, negative }: Props) {
  const data = [
    { name: 'Positive', value: positive },
    { name: 'Neutral', value: neutral },
    { name: 'Negative', value: negative },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
        No sentiment data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={COLORS[LABELS.indexOf(entry.name)] ?? '#94a3b8'}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v, 'Sessions']} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
