'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from 'recharts'

type Props = {
  data: { value: number }[]
  color?: string
}

export default function SparklineChart({ data, color = '#6366f1' }: Props) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 11, padding: '2px 8px' }}
          itemStyle={{ color }}
          formatter={(val) => [val, 'Sessions']}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
