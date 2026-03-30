'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import SimulatorControls from '@/components/simulator/SimulatorControls'
import FakeWebsitePreview from '@/components/simulator/FakeWebsitePreview'
import RequestInspector from '@/components/simulator/RequestInspector'
import type { Bot, SimulatorConfig, RequestInspectorData } from '@/types/index'

const DEFAULT_CONFIG: SimulatorConfig = {
  botId: '',
  botName: '',
  welcomeMessage: null,
  apiKey: '',
  visitor: {
    enabled: false,
    visitorId: 'test-user-001',
    name: 'Test User',
    email: 'test@chartwell.com',
    phone: '416-555-0100',
  },
  pageLabel: 'Home',
  pagePath: '/',
  pageTitle: 'Home — Chartwell',
  customUrl: '',
}

export default function SimulatorPage() {
  const [bots, setBots] = useState<Pick<Bot, 'id' | 'name' | 'slug' | 'welcome_message'>[]>([])
  const [botsLoading, setBotsLoading] = useState(true)
  const [botsError, setBotsError] = useState<string | null>(null)

  const [activeConfig, setActiveConfig] = useState<SimulatorConfig>(DEFAULT_CONFIG)
  const [resetKey, setResetKey] = useState(0)
  const [lastRequest, setLastRequest] = useState<RequestInspectorData | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/bots')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error.message)
        setBots(json.data ?? [])
      })
      .catch((e) => setBotsError(e.message ?? 'Failed to load bots'))
      .finally(() => setBotsLoading(false))
  }, [])

  // Pre-select first bot once loaded
  useEffect(() => {
    if (bots.length > 0 && !activeConfig.botId) {
      const first = bots[0]
      setActiveConfig((c) => ({
        ...c,
        botId: first.id,
        botName: first.name,
        welcomeMessage: first.welcome_message,
      }))
    }
  }, [bots]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = useCallback((config: SimulatorConfig) => {
    setActiveConfig(config)
  }, [])

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  const handleQuickMessage = useCallback((text: string) => {
    setPendingMessage(text)
  }, [])

  const handlePendingConsumed = useCallback(() => {
    setPendingMessage(null)
  }, [])

  return (
    <div className="flex flex-col h-full gap-4 min-h-0">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shrink-0">
        <AlertCircle className="size-4 mt-0.5 shrink-0 text-amber-600" />
        <p>
          <span className="font-semibold">Heads up:</span> Conversations on this page create real
          analytics data. Use this to test your bot and verify analytics are working.
        </p>
      </div>

      {botsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shrink-0">
          {botsError}
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel — 35% */}
        <div className="w-[35%] shrink-0 flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            {botsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <SimulatorControls
                bots={bots}
                config={activeConfig}
                onApply={handleApply}
                onReset={handleReset}
                onQuickMessage={handleQuickMessage}
              />
            )}
          </div>

          <RequestInspector data={lastRequest} />
        </div>

        {/* Right panel — 65% */}
        <div className="flex-1 min-h-0">
          <FakeWebsitePreview
            config={activeConfig}
            onRequest={setLastRequest}
            resetKey={resetKey}
            onQuickMessage={handleQuickMessage}
            pendingMessage={pendingMessage}
            onPendingConsumed={handlePendingConsumed}
          />
        </div>
      </div>
    </div>
  )
}
