# Chatbot SaaS — Claude Project Brain

## What we're building
Multi-tenant SaaS where users create, configure, and embed AI chatbots.
Stack: Next.js 16.1 (App Router, Turbopack default) · Supabase · OpenAI GPT-4o · shadcn/ui · Framer Motion · TypeScript

---

## Project structure
app/
  (auth)/login, /register         → Supabase Auth pages
  (dashboard)/bots/               → Bot CRUD, embed panel
  api/chat/route.ts               → Authenticated streaming chat (JWT, dashboard use)
  api/embed/[botId]/chat/         → Embed iframe chat (no auth, botId only)
  api/public/v1/[botId]/chat/     → Public endpoint (API key auth, customer backends)
  embed/[botId]/page.tsx          → Public iframe target (no auth)
components/
  ui/                             → shadcn only, never customise these files
  chat/                           → ChatWindow, MessageBubble, ChatInput
  bot-builder/                    → PersonaForm, EmbedPanel
lib/
  supabase/client.ts              → browser Supabase client
  supabase/server.ts              → server Supabase client (cookies)
  openai.ts                       → OpenAI init
  bot-engine.ts                   → builds system prompt from bot DB row
  api-key.ts                      → generate, hash, validate API keys
types/index.ts                    → ALL shared types live here
types/database.ts                 → Supabase generated types
supabase/migrations/              → raw SQL only, never edit DB manually

---

## Non-negotiable rules
1. Server Components by default. Add "use client" only when you need state, hooks, or motion.
2. Every DB write goes through RLS — never use service role key on the client.
3. API keys: SHA-256 hash stored in DB, raw key shown to user exactly once.
4. /embed/[botId] is a public route — zero auth, minimal JS, must work in an iframe.
5. Streaming uses Vercel AI SDK: streamText server-side, useChat client-side.
6. All TypeScript types go in types/index.ts — no inline type declarations in components.
7. Never install a library without checking if shadcn or Vercel AI SDK already covers it.
8. Framer Motion only in Client Components. Keep animations to fade + slide, max 300ms.
9. Error handling: always return typed errors from API routes, never throw raw strings.
10. When in doubt about a pattern, check docs/MEMORY.md before inventing something new.
11. Next.js 16 specifics:
    - Turbopack is the default — never add --turbopack to npm scripts
    - Route params (params, searchParams) are now async — always await them
    - Use proxy.ts instead of middleware.ts if edge middleware is needed

---

## Database tables (quick ref)
bots         → id, user_id, name, slug, persona, welcome_message, avatar_url, primary_color, allowed_domains[], is_active
api_keys     → id, user_id, bot_id, key_hash, label, last_used_at
chat_sessions→ id, bot_id, visitor_id, started_at
chat_messages→ id, session_id, role('user'|'assistant'), content, created_at

---

## API response shape (always use this)
Success: { data: T }
Error:   { error: { code: string, message: string } }

---

## Key decisions
- Embed: iframe-first. /embed/[botId] is the iframe target. JS snippet wraps it.
- No RAG in v1 — persona is pure system prompt text only
- Multi-tenancy via user_id + RLS, not separate schemas
- API versioning: /api/public/v1/[botId]/chat from day one
- API key format: cb_live_<32 random chars>
- Slug is globally unique, human-readable, used in embed URLs

---

## How to work with me
- Always read this file at the start of every session
- Check docs/TASKS.md to know current milestone
- Check docs/MEMORY.md before any architectural decision
- "give me the full file" = output complete file, no truncation
- "show me the diff" = output only changed section

---

## Multi-agent setup (use for M2+ parallel work)

Agents in .claude/agents/:
- frontend-dev  → components/, app/(dashboard)/, app/(auth)/, app/embed/
- backend-dev   → app/api/, lib/
- db-architect  → supabase/migrations/, types/database.ts
- code-reviewer → read-only, reviews any file, run after features complete

### When to use parallel agents
Spawn parallel agents ONLY when tasks touch different folders.
Example — building analytics feature:
  "Use frontend-dev and backend-dev in parallel:
   frontend-dev: build the analytics dashboard page and charts
   backend-dev: build the /api/analytics route and data aggregation
   They touch different folders so can run simultaneously."

### When NOT to use parallel agents
- Tasks that share the same files (merge conflict risk)
- Tasks where B depends on output from A (run sequentially)
- Simple single-file changes (just do it directly)

### Sequential chains (always in this order)
db-architect → backend-dev → frontend-dev → code-reviewer

### How to invoke
Just describe the task naturally and mention the agents:
"Use backend-dev agent to build X and frontend-dev agent to build Y in parallel"
Or for review: "Use code-reviewer agent to review the files we just built"
