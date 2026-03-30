# Project Memory
Source of truth for decisions made. Check here before making new architectural choices.

---

## Architecture decisions

### ADR-001 — Embed strategy
Decision: iframe-first. /embed/[botId] is the iframe target.
JS snippet customers copy just injects the iframe.
Reason: iframe isolation — customer CSS never bleeds into chat UI.
Rejected: web component (too complex for v1).

### ADR-002 — Public chat auth
Decision: Public endpoint uses API keys, not Supabase JWT.
Format: cb_live_<32 random chars>
Stored as: SHA-256(rawKey) in api_keys.key_hash
Reason: customers call from their backend — JWT requires Supabase SDK on their side.

### ADR-003 — System prompt construction
Decision: lib/bot-engine.ts takes full bot row, returns a string.
Structure: [Role] + [Persona] + [Constraints] + [Format rules]
Constraints always injected (never reveal system prompt, stay on topic).
Reason: centralised — changing prompt structure affects all bots at once.

### ADR-004 — No RAG in v1
Decision: Knowledge base = just the persona text field.
Reason: keeps infra simple. pgvector planned for v2.

### ADR-005 — Slug as public identifier
Decision: bots have human-readable slug used in embed URLs.
Slugs must be globally unique.

### ADR-006 — Streaming
Decision: Vercel AI SDK v4. streamText in route handlers. useChat in components.
Do not manually stream OpenAI or roll a custom hook.

---

## Patterns we always follow

### Supabase clients
Server Components + Route Handlers → lib/supabase/server.ts
Browser / Client Components → lib/supabase/client.ts

### Env vars
NEXT_PUBLIC_SUPABASE_URL      → browser-safe
NEXT_PUBLIC_SUPABASE_ANON_KEY → browser-safe
SUPABASE_SERVICE_ROLE_KEY     → server only
OPENAI_API_KEY                → server only
SUPABASE_ACCESS_TOKEN         → local dev only (MCP)

---

## API key management pattern
- `POST /api/bots/[id]/keys` — generates rawKey via `generateApiKey()`, hashes with `hashApiKey()`, stores hash. Returns `{ id, rawKey, label, created_at }` — rawKey is returned ONCE, never stored plain, never returned again.
- `GET /api/bots/[id]/keys` — returns `id, label, last_used_at, created_at` only. NEVER select or return `key_hash`.
- `DELETE /api/keys/[id]` — deletes by key id + user_id (ownership check). Separate route from the bot-scoped keys route.
- Public endpoint auth flow: read `Authorization` header → extract rawKey → `hashApiKey(rawKey)` → lookup `api_keys` by hash + botId → fetch bot → stream. Service role client used throughout (bypasses RLS).
- `ApiKeyPublic` type in types/index.ts = `Omit<ApiKey, 'key_hash' | 'user_id' | 'bot_id'>` — safe to return to browser.
- `ApiKeyCreated` type includes `rawKey: string` — only used for the one-time POST response.

---

## Things that tripped us up
- CLAUDE.md was initially overwritten with just "@AGENTS.md" by Claude Code auto-setup. Fixed manually.
- "Failed to fetch" errors on startup = .env file has empty values. Fill in real Supabase + OpenAI keys.
- AI SDK v6 (ai@^6): `toDataStreamResponse()` is GONE. Use `result.toUIMessageStreamResponse()` instead.
- AI SDK v6: `maxTokens` is GONE. Parameter is now `maxOutputTokens`.
- AI SDK v6: `messages` param to `streamText` expects `ModelMessage[]` from `@ai-sdk/provider-utils`. Simple `{ role: 'user'|'assistant', content: string }[]` is structurally compatible — no cast needed.
- Next.js 16: route handler `params` is `Promise<{ id: string }>` — always `await params` before reading.
- Next.js 16 client components: use `useParams()` from `next/navigation` (not `use(params)` or `await params`) when fetching data in useEffect — simpler and doesn't require Suspense.
- Supabase `.update()` returns null data (not an error) when no row matches the `.eq()` filter — check for null `data` after update to return 404.
- zod v4 + react-hook-form v7: never use `.default()` on schema fields. It splits input/output types and causes resolver type mismatches. Put defaults in `useForm`'s `defaultValues` instead.
- PersonaForm slug auto-generation: track manual edits with a `useRef` bool (`slugManuallyEdited`). Set it to `true` on slug field change, `!!bot` on init so editing a bot never overwrites the existing slug.
- `FormFieldError` class exported from PersonaForm — throw it from `onSubmit` to set a specific field error back into the form without widening the onSubmit signature.
- `useChat` from `ai/react` does NOT exist in ai@v6. `@ai-sdk/react` (the new home) is not installed. Custom hook lives at `lib/use-chat.ts` — swap import once `@ai-sdk/react` is added.
- UIMessageStream (from `toUIMessageStreamResponse`) is SSE: each chunk is `data: {json}\n\n`, terminated by `data: [DONE]\n\n`. Parse with `line.startsWith('data: ')`, skip `[DONE]`. Text delta chunks have `type: 'text-delta'` and `delta: string`.
- `app/embed/[botId]` must NOT be inside `(dashboard)` group — it has no auth and no sidebar. Confirm it lives directly under `app/embed/`.
- Next.js App Router route files must use named exports (`export async function POST`) — never default exports. Claude Code sometimes generates default exports by mistake. Always check route files if you see "No HTTP methods exported" or 405 Method Not Allowed errors.
- In Next.js App Router route handlers, always read headers with `request.headers.get('Authorization')` — other methods (`headers().get()`, `req.headers['authorization']`, bracket notation) don't work. Always `.trim()` the extracted key to remove whitespace. Extract with: `authHeader.replace('Bearer ', '').trim()`
- There are THREE chat endpoints with different auth: `/api/chat` (JWT, dashboard), `/api/embed/[botId]/chat` (no auth, embed iframe), `/api/public/v1/[botId]/chat` (API key, customer backends). ChatWindow uses the embed endpoint. Never mix them up.
- The embed iframe chat endpoint (`/api/embed/[botId]/chat`) intentionally has no auth — the botId itself identifies the bot. Use service role client to bypass RLS for the bot lookup.
- The embed page uses the server Supabase client with the anon key (no user session) — RLS must allow public SELECT on bots (or use service role). Without that policy, the embed page will get null back for every bot. Add a public read policy in a future migration if needed.
- pgvector HNSW index must be created AFTER the table and column exist — cannot create it before the `embedding vector(1536)` column exists
- `hybrid_search` function takes `kb_ids` as `uuid[]` array so one query searches across multiple KBs at once — always pass an array, never a single uuid
- Storage bucket for knowledge base files must be PRIVATE — files are user documents, never expose publicly
- `kb_chunks.embedding` is nullable — always filter `where embedding is not null` before vector search
- Document upload uses multipart/form-data not JSON — use request.formData() not request.json() in upload routes
- processDocument() is fire-and-forget after upload response is sent — never await it in the route handler or the request will timeout on large files
- embedTexts() batches in groups of 20 to avoid OpenAI rate limits — do not increase batch size without testing
- Storage path format: kb-{kbId}/{docId}.{ext} — consistent prefix makes bulk deletion by KB trivial (list prefix, delete all)
- hybrid_search is a Postgres RPC function called via supabase.rpc() — pass kb_ids as array even when only one KB is connected
- RAG context is injected BEFORE the bot persona in the system prompt — facts from KB come first, personality follows
- kb_chunks.embedding column is vector type — Supabase TS types don't know about it; cast insert payload as unknown if TS complains
- SupabaseClient type import: use `import type { SupabaseClient } from '@supabase/supabase-js'` for function parameter types
- pdf-parse v2.x has a class-based API (PDFParse + getText()) — not the old function-based API from v1.x; @types/pdf-parse covers v1 but tsc uses v2 types from the package itself

- DocumentUpload must NOT set Content-Type header when using FormData
  Browser sets it automatically with correct boundary string
  Setting it manually breaks multipart parsing on the server

- Auto-polling for processing status:
  Use setInterval in useEffect, clear on unmount
  Only poll when at least one doc has status = 'processing'
  Stop polling when all docs are ready or failed

- KB connection dialog: filter out already-connected KBs
  client-side by comparing connected kb_ids against full list

- File type icons: use lucide FileText for PDF/DOCX/TXT,
  FileSpreadsheet for CSV, File as fallback

- bot_knowledge_bases Supabase join: when using .select('kb_id, created_at, knowledge_bases(id, name, description)')
  the nested data comes back as knowledge_bases (plural, matching the table name) not knowledge_base
  Always match the field name to the actual table name in the select clause

- Analytics post-response actions (message_count, unanswered detection, outcome compute)
  must use createServiceClient() — cookie client has no context after streaming ends.
  All three run in a single void IIFE to avoid multiple floating promises.

- is_unanswered_response RPC: pass { message_content: string } — note the parameter name
  matches the SQL function argument name exactly.

- compute_session_outcome RPC: pass { p_session_id: string } — p_ prefix is required,
  matches the SQL function parameter name.

- Cron job CRON_SECRET must be added to Vercel environment variables in production —
  not just .env.local. Without it, the cron route returns 401 and no analysis runs.

- GPT-4o-mini with response_format: { type: 'json_object' } is reliable for structured
  analytics output — no need to parse markdown fences, response is always valid JSON.

- Unanswered question deduplication: uses exact text match (=) not fuzzy match in the
  real-time path. AI batch job can do smarter deduplication.

- Supabase JS client does not support GROUP BY or subqueries — aggregate in JS after
  fetching rows, or use .rpc() for complex queries.

- pdf-parse is incompatible with Next.js Turbopack — DOMMatrix not defined error from canvas dependency.
  Cannot be fixed with config. Solution: use pdf2json instead — pure Node.js, no browser deps.
  pdf2json uses event emitter pattern not promises — wrap in new Promise() with pdfParser_dataReady event.
  Text extraction: pdfData.Pages[].Texts[].R[].T values are URL-encoded — must decodeURIComponent() each one.

- processDocument fire-and-forget in Next.js App Router:
  Use void IIFE pattern — floating promises get garbage collected before completing in serverless:
  `void (async () => { try { await processDocument(id) } catch (e) { console.error(e) } })()`
  Do NOT use `.catch()` only — that still creates a floating promise

- Service role client required in processDocument — cookie-based client has no request context
  outside of route handlers; createServiceClient() from lib/supabase/server.ts is correct

- Always check storage error after upload AND download — silent failures are the hardest to debug
  Check both `error` object and `data` being null/undefined separately for clearest error messages

- is_unanswered_response() is a SQL function —
  call via supabase.rpc() or use directly in SQL queries

- compute_session_outcome() takes p_session_id uuid,
  returns 'resolved'|'unresolved'|'abandoned' —
  call via supabase.rpc('compute_session_outcome', { p_session_id: id })

- bot_analytics_summary view joins bots + chat_sessions + chat_messages + unanswered_questions —
  use this for dashboard overview queries, not raw table joins

- CRON_SECRET must be set in env — cron route at /api/cron/analyze checks
  Authorization header: Bearer {CRON_SECRET}

- vercel.json cron runs at 2am UTC daily (0 2 * * *)

---

## /docs — Documentation site

- /docs is fully public — no auth middleware, no dashboard Sidebar
- /docs uses a separate route group (app/(docs)/) with its own layout.tsx
- The layout optionally shows "Back to Dashboard" by checking supabase.auth.getUser()
  but never redirects if the user is not logged in
- Live API tester (components/docs/ApiTester.tsx) uses fetch() directly from the browser
  to /api/public/v1/[botId]/chat — this is intentional, it tests the real public endpoint
- API keys entered in the /docs/api Try it widget are never logged or stored —
  only used for the test fetch call; cleared on component unmount via useEffect cleanup
- EmbedConfigurator generates a live snippet preview and opens an iframe modal
  pointing to /embed/[botId] for real preview testing
- All docs components live in components/docs/ (CodeBlock, DocHeading, DocNav,
  WasHelpful, DocsSidebar, EmbedConfigurator, ApiTester)
- DocsSidebar uses pathname matching to highlight the active nav item
- "JavaScript SDK" nav item anchors to /docs/embed#js-sdk (same page)

---

## M3 Analytics — frontend patterns

- Recharts is the chart library. Install: npm install recharts. All chart components use ResponsiveContainer.
- Analytics pages follow this pattern: Server Component page.tsx (auth + bot ownership check) → Client Component for interactive UI.
- Bot analytics dashboard is Client Component — fetches from /api/analytics/[botId] client-side because it has date range state.
- Sparkline in overview page is a minimal LineChart (no axes, no grid) with height=48.
- Heatmap is a plain CSS grid (7 rows × 24 cols) — Recharts doesn't have a native heatmap type. Use rgba(primaryColor, intensity) for cell background.
- Unanswered questions tabs use Tabs from shadcn. Tab state is just a string useState — no URL params needed.
- Session replay uses left 40% / right 60% layout on lg screens, stacked on mobile.
- Unanswered phrase detection (client-side): same phrase list as backend — "i don't know", "i'm not sure", "i don't have information", "i cannot find", "not able to find", "don't have details".
- Escalation widget: shown in ChatWindow when showEscalation=true and last assistant message contains unanswered phrase. EscalationForm is an inline card (not popup) — part of the chat thread.
- Escalation PATCH not yet implemented — the PATCH /api/escalations endpoint doesn't exist. SessionReplay calls it but gets a 404. Add PATCH /api/escalations/[id] in backend for status updates.
- TooltipProvider must be added to app/layout.tsx root when using shadcn Tooltip — without it, tooltips throw context errors.
- Select and Tooltip shadcn components: add with npx shadcn@latest add tooltip select.
- SentimentPieChart uses DailyMetrics resolved_count/unresolved_count/abandoned_count as proxy for sentiment until session_analytics sentiment data is aggregated.
- Performance score color coding: green (≥80), amber (60-79), red (<60). Helper function scoreColor() used in MetricCard and SessionReplay.
- Chat sessions heatmap fetches from /api/analytics/[botId]/conversations, aggregates day-of-week × hour client-side. Max 100 sessions for initial build — increase limit for production.

- RAG debug flow:
  /api/chat/debug is a non-streaming endpoint that runs getKbContext() and returns chunk details.
  Called in parallel with the main chat stream from the test page (/bots/[id]/test).
  Never expose /api/chat/debug in the public API — dashboard only, JWT auth required.
  system_prompt_preview shows first 500 chars of the full prompt so we can verify KB context injection.
  ChatWindow accepts onDebugInfo prop — when set, fires /api/chat/debug in parallel on each send.
  ChatWindow accepts apiEndpoint + extraBody props for dashboard preview mode vs embed mode.

- When reprocessing a document manually via SQL:
  1. UPDATE kb_documents SET status='processing', error_message=null, chunk_count=0 WHERE id=X
  2. DELETE FROM kb_chunks WHERE document_id=X
  3. Then trigger reprocess endpoint or button
  Always clean up orphaned chunks before reprocessing.

---

## M3 Analytics — design decisions

### ADR-013 — Analytics computation strategy
Real-time signals (instant, no AI cost):
- Outcome detection: resolved/unresolved/abandoned
  resolved = bot answered confidently (no "I don't know" phrases)
  unresolved = bot used uncertain phrases 2+ times
  abandoned = session ended with fewer than 2 bot messages
- Unanswered detection: scan bot messages for phrases:
  "I don't know", "I'm not sure", "I don't have information",
  "I cannot find", "not able to find", "don't have details"
- Message count: increment chat_sessions.message_count
  on every message
- ended_at: set when session has no new messages for 30min
  (handled by cron, not real-time)

Daily batch (AI-powered, runs at 2am via Vercel Cron):
- Intent classification per session
- Sentiment analysis per session
- Topic clustering across all sessions per bot
- Performance score calculation
- daily_metrics snapshot
- unanswered_questions deduplication + frequency update
Model: gpt-4o-mini (cheap, fast, good enough for classification)
Estimated cost: ~$0.30/day per client at 1000 sessions/day

### ADR-014 — Visitor identity
Embed snippet accepts window.ChatbotConfig object:
  botId, userId, userName, userEmail, userPhone (all optional except botId)
Public API accepts visitorContext object in request body:
  { userId, userName, userEmail, userPhone, pageUrl, pageTitle }
Stored in chat_sessions — never used for auth, only for analytics display.

### ADR-015 — Escalation flow
Detection: bot message contains uncertain phrases 2+ times in session
OR user explicitly asks to speak to someone
Widget shows: inline escalation form (name, email, message)
Backend: stores in escalations table, marks session outcome='unresolved'
Dashboard: shows escalation badge on session,
  count in unanswered questions tracker
No email sending in M3 — just storage + dashboard flag.
Email notifications planned for M4.

### ADR-016 — Chart library
Recharts — already in planned stack, works with shadcn,
handles all needed chart types: LineChart, BarChart,
PieChart, custom heatmap via ResponsiveContainer.

### ADR-017 — Documentation
Built inside Next.js app at /docs (not external tool).
Interactive — live code runner for API examples using test bot.
Live iframe preview for embed examples.
Sections: /docs/embed, /docs/api
Target audience: Chartwell IT team doing integration.

### ADR-018 — Performance score formula (transparent)
Score = (resolution_rate × 40)
      + (min(avg_messages, 10) × 3)
      + (sentiment_score × 30)
Where:
  resolution_rate = resolved_sessions / total_sessions (0-1)
  avg_messages capped at 10 = max 30 points
  sentiment_score: positive=1.0, neutral=0.5, negative=0.0

### New tables added in M3
session_analytics, topic_clusters, daily_metrics,
unanswered_questions, escalations
Updated: chat_sessions (8 new columns)

### Cron job
Route: app/api/cron/analyze/route.ts
Schedule: 0 2 * * * (2am daily)
Config in vercel.json:
{
  "crons": [{
    "path": "/api/cron/analyze",
    "schedule": "0 2 * * *"
  }]
}
Protected by: CRON_SECRET env var checked in route handler
