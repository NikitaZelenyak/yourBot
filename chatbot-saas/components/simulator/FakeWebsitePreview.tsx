'use client'

import ChatWidget from './ChatWidget'
import FakePageContent from './FakePageContent'
import type { SimulatorConfig, RequestInspectorData } from '@/types/index'

interface FakeWebsitePreviewProps {
  config: SimulatorConfig
  onRequest: (data: RequestInspectorData) => void
  resetKey: number
  onQuickMessage: (text: string) => void
  pendingMessage: string | null
  onPendingConsumed: () => void
}

export default function FakeWebsitePreview({
  config,
  onRequest,
  resetKey,
  pendingMessage,
  onPendingConsumed,
}: FakeWebsitePreviewProps) {
  const displayUrl = `https://chartwell.com${config.pagePath === 'custom' ? config.customUrl || '/' : config.pagePath}`
  const resolvedPath = config.pagePath === 'custom' ? config.customUrl || '/' : config.pagePath

  const visitorContext = config.visitor.enabled
    ? {
        userId: config.visitor.visitorId || undefined,
        userName: config.visitor.name || undefined,
        userEmail: config.visitor.email || undefined,
        userPhone: config.visitor.phone || undefined,
      }
    : null

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Fake browser bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-400" />
          <span className="size-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-2">
          <div className="bg-white border border-gray-200 rounded-full px-3 py-0.5 text-xs text-gray-500 font-mono truncate">
            {displayUrl}
          </div>
        </div>
      </div>

      {/* Fake website chrome */}
      <div className="bg-white flex-1 flex flex-col relative overflow-hidden">
        {/* Fake header */}
        <header className="border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded bg-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-bold text-gray-800 text-sm">Chartwell Retirement Residences</span>
          </div>
          <nav className="flex items-center gap-4">
            {['Home', 'Living Options', 'Pricing', 'Contact'].map((item) => (
              <span key={item} className="text-xs text-gray-500 cursor-default select-none">
                {item}
              </span>
            ))}
          </nav>
        </header>

        {/* Page content */}
        <FakePageContent pagePath={resolvedPath} pageTitle={config.pageTitle} />

        {/* Chat widget overlay */}
        {config.botId && config.apiKey && (
          <ChatWidget
            botId={config.botId}
            botName={config.botName}
            welcomeMessage={config.welcomeMessage}
            apiKey={config.apiKey}
            visitorContext={visitorContext}
            pageUrl={displayUrl}
            pageTitle={config.pageTitle}
            onRequest={onRequest}
            resetKey={resetKey}
            pendingMessage={pendingMessage}
            onPendingConsumed={onPendingConsumed}
          />
        )}

        {!config.botId && (
          <div className="absolute bottom-4 right-4 bg-gray-100 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-400 max-w-[200px] text-center">
            Select a bot and enter an API key to enable the chat widget
          </div>
        )}
      </div>
    </div>
  )
}
