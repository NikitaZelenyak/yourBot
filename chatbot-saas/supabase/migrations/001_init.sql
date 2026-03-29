-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Bots table
create table bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  persona text,
  welcome_message text,
  avatar_url text,
  primary_color text not null default '#6366f1',
  allowed_domains text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- API keys table
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  bot_id uuid references bots(id) on delete cascade not null,
  key_hash text unique not null,
  label text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Chat sessions table
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade not null,
  visitor_id text,
  started_at timestamptz not null default now()
);

-- Chat messages table
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table bots enable row level security;
create policy "owners only" on bots for all using (auth.uid() = user_id);

alter table api_keys enable row level security;
create policy "owners only" on api_keys for all using (auth.uid() = user_id);

alter table chat_sessions enable row level security;
create policy "public insert" on chat_sessions for insert with check (true);
create policy "bot owner read" on chat_sessions for select
  using (bot_id in (select id from bots where user_id = auth.uid()));

alter table chat_messages enable row level security;
create policy "public insert" on chat_messages for insert with check (true);
create policy "session owner read" on chat_messages for select
  using (session_id in (
    select cs.id from chat_sessions cs
    join bots b on b.id = cs.bot_id
    where b.user_id = auth.uid()
  ));

-- Updated_at trigger for bots
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger bots_updated_at
  before update on bots
  for each row execute function update_updated_at();
