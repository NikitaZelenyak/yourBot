-- Enable pgvector extension
create extension if not exists vector;

-- Knowledge bases (containers owned by user)
create table knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents uploaded to a knowledge base
create table kb_documents (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid references knowledge_bases(id) on delete cascade not null,
  filename text not null,
  file_type text not null,
  storage_path text not null,
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'failed')),
  chunk_count int not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

-- Processed chunks with pgvector embeddings
create table kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references kb_documents(id) on delete cascade not null,
  kb_id uuid references knowledge_bases(id) on delete cascade not null,
  content text not null,
  embedding vector(1536),
  chunk_index int not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- HNSW index for fast vector similarity search
create index kb_chunks_embedding_idx on kb_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Full text search index for hybrid search
create index kb_chunks_content_fts on kb_chunks
  using gin (to_tsvector('english', content));

-- Many-to-many: bots <-> knowledge bases
create table bot_knowledge_bases (
  bot_id uuid references bots(id) on delete cascade not null,
  kb_id uuid references knowledge_bases(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (bot_id, kb_id)
);

-- Updated_at trigger for knowledge_bases
create trigger knowledge_bases_updated_at
  before update on knowledge_bases
  for each row execute function update_updated_at();

-- RLS
alter table knowledge_bases enable row level security;
create policy "owners only" on knowledge_bases
  for all using (auth.uid() = user_id);

alter table kb_documents enable row level security;
create policy "kb owner only" on kb_documents
  for all using (
    kb_id in (select id from knowledge_bases where user_id = auth.uid())
  );

alter table kb_chunks enable row level security;
create policy "kb owner only" on kb_chunks
  for all using (
    kb_id in (select id from knowledge_bases where user_id = auth.uid())
  );

alter table bot_knowledge_bases enable row level security;
create policy "bot owner only" on bot_knowledge_bases
  for all using (
    bot_id in (select id from bots where user_id = auth.uid())
  );

-- Hybrid search function
-- Combines vector similarity + full text search
-- Returns top chunks for a given query embedding and kb_ids
create or replace function hybrid_search(
  query_embedding vector(1536),
  query_text text,
  kb_ids uuid[],
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  kb_id uuid,
  document_id uuid,
  similarity float
)
language sql
as $$
  with vector_results as (
    select
      kc.id,
      kc.content,
      kc.metadata,
      kc.kb_id,
      kc.document_id,
      1 - (kc.embedding <=> query_embedding) as similarity,
      row_number() over (order by kc.embedding <=> query_embedding) as rank
    from kb_chunks kc
    where kc.kb_id = any(kb_ids)
      and kc.embedding is not null
    order by kc.embedding <=> query_embedding
    limit match_count * 2
  ),
  fts_results as (
    select
      kc.id,
      kc.content,
      kc.metadata,
      kc.kb_id,
      kc.document_id,
      ts_rank(to_tsvector('english', kc.content),
              plainto_tsquery('english', query_text)) as similarity,
      row_number() over (
        order by ts_rank(to_tsvector('english', kc.content),
                        plainto_tsquery('english', query_text)) desc
      ) as rank
    from kb_chunks kc
    where kc.kb_id = any(kb_ids)
      and to_tsvector('english', kc.content) @@
          plainto_tsquery('english', query_text)
    limit match_count * 2
  ),
  combined as (
    select id, content, metadata, kb_id, document_id,
           similarity, 'vector' as source from vector_results
    union all
    select id, content, metadata, kb_id, document_id,
           similarity, 'fts' as source from fts_results
  ),
  deduped as (
    select distinct on (id)
      id, content, metadata, kb_id, document_id,
      max(similarity) over (partition by id) as similarity
    from combined
    order by id, similarity desc
  )
  select id, content, metadata, kb_id, document_id, similarity
  from deduped
  order by similarity desc
  limit match_count;
$$;
