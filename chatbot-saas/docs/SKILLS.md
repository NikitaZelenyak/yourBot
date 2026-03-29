# Skills

## Frontend (React / Next.js)
- Default to Server Components. "use client" only when needed.
- Use shadcn from @/components/ui — never rebuild what shadcn has.
- Framer Motion: entrance animations only (fade + slide), never layout shifts.
- Forms: react-hook-form + zod + shadcn Form component.
- Keep components under ~150 lines. Split if larger.

## Backend (Next.js API routes)
- All routes in app/api/ using Route Handlers.
- Dashboard routes: authenticate with Supabase JWT.
- Public routes: authenticate with API key hash lookup.
- Always validate request body with zod before touching DB.
- Return { data } or { error } — never raw values.
- Streaming: use Vercel AI SDK streamText, return StreamingTextResponse.

## Supabase
- Always use typed client: createClient<Database>().
- Migrations as SQL in supabase/migrations/ — never alter via dashboard in prod.
- RLS always on. Write policy in same migration as the table.
- Use .select() with explicit columns — never SELECT *.
- Use @supabase/ssr for App Router auth helpers.

## OpenAI / AI
- Model: gpt-4o for chat. gpt-4o-mini for classification only.
- Always pass full message history from chat_messages.
- System prompt always built by lib/bot-engine.ts — never inline in route handlers.
- Max tokens: 1000. Temperature: 0.7.

## TypeScript
- All types in types/index.ts.
- Never use any. Use unknown and narrow it.
- Prefer type over interface.

## Code review checklist
[ ] No unnecessary "use client"
[ ] RLS covers any new table
[ ] Zod validation on every API route input
[ ] Types added to types/index.ts
[ ] Error states handled in UI
[ ] Loading states handled in UI
