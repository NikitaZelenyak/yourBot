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
