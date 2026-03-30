-- Update chat_sessions with analytics columns
alter table chat_sessions
  add column if not exists visitor_id_custom text,
  add column if not exists visitor_name text,
  add column if not exists visitor_email text,
  add column if not exists visitor_phone text,
  add column if not exists page_url text,
  add column if not exists page_title text,
  add column if not exists ended_at timestamptz,
  add column if not exists message_count int not null default 0,
  add column if not exists outcome text
    check (outcome in ('resolved', 'unresolved', 'abandoned'));

-- AI analysis results per session (computed daily)
create table session_analytics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id)
    on delete cascade not null unique,
  bot_id uuid references bots(id) on delete cascade not null,
  intent text,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  topics text[],
  is_answered boolean,
  unanswered_questions text[],
  performance_score int check (
    performance_score >= 0 and performance_score <= 100
  ),
  analyzed_at timestamptz not null default now()
);

-- Topic clusters per bot per day
create table topic_clusters (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade not null,
  topic_label text not null,
  question_count int not null default 0,
  sample_questions text[],
  trend text check (trend in ('rising','stable','falling')),
  computed_date date not null default current_date,
  unique (bot_id, topic_label, computed_date)
);

-- Daily metrics snapshot per bot
create table daily_metrics (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade not null,
  date date not null,
  total_sessions int not null default 0,
  total_messages int not null default 0,
  avg_messages_per_session numeric not null default 0,
  resolved_count int not null default 0,
  unresolved_count int not null default 0,
  abandoned_count int not null default 0,
  resolution_rate numeric not null default 0,
  performance_score numeric not null default 0,
  unique_visitors int not null default 0,
  unique_pages int not null default 0,
  unique (bot_id, date)
);

-- Unanswered questions log (deduplicated)
create table unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade not null,
  session_id uuid references chat_sessions(id)
    on delete set null,
  question text not null,
  asked_at timestamptz not null default now(),
  page_url text,
  frequency int not null default 1,
  status text not null default 'open'
    check (status in ('open','kb_updated','ignored'))
);

-- Human escalation requests
create table escalations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id)
    on delete cascade not null,
  bot_id uuid references bots(id) on delete cascade not null,
  visitor_name text,
  visitor_email text not null,
  message text not null,
  original_question text,
  status text not null default 'pending'
    check (status in ('pending','contacted','resolved')),
  created_at timestamptz not null default now()
);

-- Indexes for analytics query performance
create index session_analytics_bot_id_idx
  on session_analytics(bot_id);
create index session_analytics_analyzed_at_idx
  on session_analytics(analyzed_at);
create index topic_clusters_bot_date_idx
  on topic_clusters(bot_id, computed_date desc);
create index daily_metrics_bot_date_idx
  on daily_metrics(bot_id, date desc);
create index unanswered_questions_bot_idx
  on unanswered_questions(bot_id, status, asked_at desc);
create index escalations_bot_idx
  on escalations(bot_id, status, created_at desc);
create index chat_sessions_bot_started_idx
  on chat_sessions(bot_id, started_at desc);
create index chat_sessions_page_url_idx
  on chat_sessions(bot_id, page_url);

-- RLS
alter table session_analytics enable row level security;
create policy "bot owner only" on session_analytics
  for all using (
    bot_id in (select id from bots where user_id = auth.uid())
  );

alter table topic_clusters enable row level security;
create policy "bot owner only" on topic_clusters
  for all using (
    bot_id in (select id from bots where user_id = auth.uid())
  );

alter table daily_metrics enable row level security;
create policy "bot owner only" on daily_metrics
  for all using (
    bot_id in (select id from bots where user_id = auth.uid())
  );

alter table unanswered_questions enable row level security;
create policy "bot owner only" on unanswered_questions
  for all using (
    bot_id in (select id from bots where user_id = auth.uid())
  );

alter table escalations enable row level security;
create policy "bot owner only" on escalations
  for all using (
    bot_id in (select id from bots where user_id = auth.uid())
  );

-- Helper function: detect unanswered phrases in bot message
create or replace function is_unanswered_response(
  message_content text
) returns boolean
language sql immutable
as $$
  select message_content ilike any(array[
    '%i don''t know%',
    '%i do not know%',
    '%i''m not sure%',
    '%i am not sure%',
    '%i don''t have information%',
    '%i do not have information%',
    '%i cannot find%',
    '%i can''t find%',
    '%not able to find%',
    '%don''t have details%',
    '%no information%',
    '%outside my knowledge%',
    '%beyond my knowledge%',
    '%unable to answer%',
    '%i''m unable%',
    '%i apologize, i don''t%'
  ]);
$$;

-- Helper function: compute outcome for a session
create or replace function compute_session_outcome(
  p_session_id uuid
) returns text
language plpgsql
as $$
declare
  v_message_count int;
  v_bot_message_count int;
  v_unanswered_count int;
begin
  select count(*) into v_message_count
  from chat_messages
  where session_id = p_session_id;

  select count(*) into v_bot_message_count
  from chat_messages
  where session_id = p_session_id
    and role = 'assistant';

  select count(*) into v_unanswered_count
  from chat_messages
  where session_id = p_session_id
    and role = 'assistant'
    and is_unanswered_response(content);

  -- Abandoned: fewer than 2 bot messages
  if v_bot_message_count < 2 then
    return 'abandoned';
  end if;

  -- Unresolved: bot failed to answer 2+ times
  if v_unanswered_count >= 2 then
    return 'unresolved';
  end if;

  return 'resolved';
end;
$$;

-- Analytics summary view (useful for dashboard queries)
create or replace view bot_analytics_summary as
select
  b.id as bot_id,
  b.name as bot_name,
  b.user_id,
  count(distinct cs.id) as total_sessions,
  count(distinct cm.id) as total_messages,
  round(avg(cs.message_count), 1) as avg_messages,
  count(distinct cs.id) filter (
    where cs.outcome = 'resolved'
  ) as resolved_sessions,
  count(distinct cs.id) filter (
    where cs.outcome = 'unresolved'
  ) as unresolved_sessions,
  count(distinct cs.id) filter (
    where cs.outcome = 'abandoned'
  ) as abandoned_sessions,
  round(
    count(distinct cs.id) filter (where cs.outcome = 'resolved')::numeric /
    nullif(count(distinct cs.id), 0) * 100, 1
  ) as resolution_rate,
  count(distinct uq.id) filter (
    where uq.status = 'open'
  ) as open_unanswered_questions,
  max(cs.started_at) as last_session_at
from bots b
left join chat_sessions cs on cs.bot_id = b.id
left join chat_messages cm on cm.session_id = cs.id
left join unanswered_questions uq on uq.bot_id = b.id
group by b.id, b.name, b.user_id;
