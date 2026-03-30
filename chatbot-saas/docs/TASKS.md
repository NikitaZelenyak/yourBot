# Tasks

## M1 COMPLETE
Full flow working: bot creation → embed → public API → API key auth.

### All M1 tasks done
- [x] lib/supabase/client.ts and server.ts
- [x] lib/openai.ts
- [x] lib/bot-engine.ts
- [x] lib/api-key.ts
- [x] types/index.ts shared types
- [x] Supabase migration (supabase/migrations/001_init.sql)
- [x] Generate TypeScript types → types/database.ts
- [x] Auth pages (login + register)
- [x] Dashboard layout with auth guard
- [x] Sidebar
- [x] Bot list page
- [x] app/api/chat/route.ts (authenticated streaming)
- [x] app/api/bots/route.ts (GET + POST)
- [x] app/api/bots/[id]/route.ts (GET + PATCH)
- [x] Bot create/edit form (PersonaForm)
- [x] app/embed/[botId]/page.tsx (public iframe UI)
- [x] ChatWindow, MessageBubble, ChatInput components
- [x] EmbedPanel (iframe + JS snippet generator)
- [x] app/(dashboard)/bots/[id]/embed/page.tsx
- [x] app/api/embed/[botId]/chat/route.ts (embed iframe chat, no auth)
- [x] app/api/public/v1/[botId]/chat/route.ts (public API key endpoint)
- [x] app/api/bots/[id]/keys/route.ts (GET + POST)
- [x] app/api/keys/[id]/route.ts (DELETE)
- [x] API key generation UI (ApiKeyManager component on edit bot page)
- [x] Multi-agent setup (.claude/agents/ + CLAUDE.md routing rules)

---

## M2 — Growth features (next milestone)
Agent assignments for each feature:

### Analytics dashboard
- db-architect: add analytics events table + migration
- backend-dev: /api/analytics route, aggregate message counts per bot
- frontend-dev: analytics page with charts (use recharts)

### Bot avatar upload
- db-architect: ensure avatar_url column exists (it does — already in bots table)
- backend-dev: /api/bots/[id]/avatar upload route using Supabase Storage
- frontend-dev: avatar upload component in PersonaForm

### Usage limits (soft limits, no billing yet)
- backend-dev: count messages per user per day, add limit check to chat routes
- frontend-dev: usage indicator in dashboard sidebar

### Conversation history for returning visitors
- db-architect: no schema change needed (chat_sessions + chat_messages exist)
- backend-dev: /api/sessions route to load previous sessions
- frontend-dev: session selector in embed UI

### Knowledge Base (RAG) — schema done
- [x] Knowledge base schema (migration 002)
- [x] pgvector + HNSW index
- [x] Hybrid search SQL function
- [x] Storage bucket: knowledge-base-files (create manually if needed)
- [x] TypeScript types updated

### Knowledge Base (RAG) — backend done
- [x] lib/document-processor.ts (parse pdf/docx/csv/txt + chunk)
- [x] lib/embeddings.ts (OpenAI text-embedding-3-small, batch 20)
- [x] lib/process-document.ts (async pipeline: download → parse → chunk → embed → store)
- [x] app/api/knowledge-bases/route.ts (GET list, POST create)
- [x] app/api/knowledge-bases/[id]/route.ts (GET, PATCH, DELETE with storage cleanup)
- [x] app/api/knowledge-bases/[id]/documents/route.ts (GET list, POST upload)
- [x] app/api/knowledge-bases/[id]/documents/[docId]/route.ts (DELETE)
- [x] app/api/bots/[id]/knowledge-bases/route.ts (GET, POST connect, DELETE disconnect)
- [x] RAG injection in public chat route (/api/public/v1/[botId]/chat)
- [x] RAG injection in authenticated chat route (/api/chat)

### Knowledge Base (RAG) — frontend done
- [x] Knowledge base list page
- [x] Create knowledge base page
- [x] Knowledge base detail page (manage docs)
- [x] DocumentUpload component (drag and drop)
- [x] Bot page updated with KB connection UI
- [x] Sidebar updated with Knowledge Bases link
- [x] M2 Knowledge Base feature COMPLETE

---

### RAG debug tooling — done
- [x] RAG debug panel (components/chat/DebugPanel.tsx)
- [x] Bot test page (/bots/[id]/test)
- [x] Debug API endpoint (/api/chat/debug)
- [x] ChatWindow supports dashboard preview mode (apiEndpoint, extraBody, onDebugInfo, ref/sendMessage)

---

---

## M3 Analytics — database layer

### Schema and migration
- [x] Migration 003_analytics.sql (applied as 004_analytics.sql — 003 was already taken by storage_bucket)
- [x] session_analytics table
- [x] topic_clusters table
- [x] daily_metrics table
- [x] unanswered_questions table
- [x] escalations table
- [x] chat_sessions updated with analytics columns
- [x] Helper SQL functions (is_unanswered_response, compute_session_outcome)
- [x] bot_analytics_summary view
- [x] vercel.json cron config
- [x] TypeScript types updated (types/index.ts + types/database.ts regenerated)

## M3 Analytics — backend layer

- [x] Chat routes updated with visitor context
- [x] Outcome detection + unanswered question logging
- [x] Escalation endpoint
- [x] All analytics API routes
- [x] Daily cron job with AI analysis pipeline

## M3 Analytics — frontend layer

- [x] Analytics overview page (/analytics) — Server Component, shows all bots
- [x] Single bot dashboard (/analytics/[botId]) — Client Component with date range picker
- [x] Sessions line chart, outcome bar chart, sentiment pie chart, usage heatmap
- [x] Top pages table with tooltip for long URLs
- [x] Conversations list (/analytics/[botId]/conversations) — filters, pagination, export stub
- [x] Session replay (/analytics/[botId]/conversations/[sessionId]) — metadata + thread
- [x] Unanswered questions tracker (/analytics/[botId]/unanswered) — tabs + status updates
- [x] Topic clusters view (/analytics/[botId]/topics) — grid of cards with trend indicators
- [x] Escalation widget in embed — inline form after unanswered responses
- [x] Sidebar updated with Analytics link (after Bots, before Knowledge Bases)

---

## M3 Documentation — COMPLETE

- [x] /docs layout (app/(docs)/layout.tsx) — public, no auth required
- [x] Getting started page (app/(docs)/docs/page.tsx)
- [x] Embed guide with live config editor (app/(docs)/docs/embed/page.tsx)
- [x] REST API reference with Try it widget (app/(docs)/docs/api/page.tsx)
- [x] Visitor tracking guide (app/(docs)/docs/visitor-tracking/page.tsx)
- [x] Analytics guide (app/(docs)/docs/analytics/page.tsx)
- [x] FAQ (app/(docs)/docs/faq/page.tsx)
- [x] Reusable components: CodeBlock, DocHeading, DocNav, WasHelpful, DocsSidebar, EmbedConfigurator, ApiTester
- [x] Sidebar updated with Documentation link (opens /docs in new tab)
- [x] M3 COMPLETE

---

## Simulator — COMPLETE

- [x] Simulator page (/simulator)
- [x] Fake website preview with page switching
- [x] Real API integration in simulator
- [x] Visitor identity testing
- [x] Request inspector
- [x] Sidebar link

---

## Backlog (M3+)
- [ ] Billing (Stripe)
- [ ] Bot templates
- [ ] Knowledge base / pgvector
- [ ] Rate limiting on /api/embed/[botId]/chat
- [ ] Public RLS policy for bots table (embed page currently uses service role as workaround)
- [ ] PATCH /api/escalations/[id] endpoint for updating escalation status from session replay
