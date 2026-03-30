'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TopicCluster } from '@/types'

type Props = { botId: string; botName: string }

type TopicsData = {
  topics: TopicCluster[]
  computed_date: string | null
}

function TrendIcon({ trend }: { trend: TopicCluster['trend'] }) {
  if (trend === 'rising') return <TrendingUp className="size-3.5 text-emerald-600" />
  if (trend === 'falling') return <TrendingDown className="size-3.5 text-red-500" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function trendLabel(trend: TopicCluster['trend']) {
  if (trend === 'rising') return 'Rising'
  if (trend === 'falling') return 'Falling'
  return 'Stable'
}

function trendClass(trend: TopicCluster['trend']) {
  if (trend === 'rising') return 'text-emerald-600'
  if (trend === 'falling') return 'text-red-500'
  return 'text-muted-foreground'
}

export default function TopicClusters({ botId, botName }: Props) {
  const [data, setData] = useState<TopicsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/${botId}/topics`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data) })
      .finally(() => setLoading(false))
  }, [botId])

  const topics = data?.topics ?? []
  const totalQuestions = topics.reduce((s, t) => s + t.question_count, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/analytics/${botId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-3.5" /> {botName}
          </Button>
        </Link>
        <h2 className="text-xl font-bold">Topic Clusters</h2>
      </div>

      {/* Summary */}
      {!loading && topics.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{topics.length} topics</span> identified
          from{' '}
          <span className="font-semibold text-foreground">{totalQuestions} conversations</span>
          {data?.computed_date && (
            <span>
              {' '}
              — last analyzed{' '}
              {new Date(data.computed_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </p>
      )}

      {/* Empty state */}
      {!loading && topics.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-lg font-semibold">No topic clusters yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Topic analysis runs nightly. Check back tomorrow after your first conversations.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading…
        </div>
      )}

      {/* Topic cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <Card key={topic.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-4 pb-4 flex flex-col gap-2.5">
              {/* Label + count */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-bold leading-snug">{topic.topic_label}</p>
                <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                  {topic.question_count}
                </Badge>
              </div>

              {/* Trend */}
              <div className={cn('flex items-center gap-1 text-xs', trendClass(topic.trend))}>
                <TrendIcon trend={topic.trend} />
                {trendLabel(topic.trend)}
              </div>

              {/* Sample questions */}
              {topic.sample_questions && topic.sample_questions.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {topic.sample_questions.slice(0, 3).map((q, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-snug">
                      &ldquo;{q}&rdquo;
                    </li>
                  ))}
                </ul>
              )}

              {/* View conversations link */}
              <Link
                href={`/analytics/${botId}/conversations?topic=${encodeURIComponent(topic.topic_label)}`}
                className="text-xs text-primary hover:underline mt-auto pt-1"
              >
                View conversations
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
