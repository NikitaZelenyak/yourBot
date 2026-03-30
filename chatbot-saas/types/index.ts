export type Bot = {
  id: string
  user_id: string
  name: string
  slug: string
  persona: string | null
  welcome_message: string | null
  avatar_url: string | null
  primary_color: string
  allowed_domains: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ApiKey = {
  id: string
  user_id: string
  bot_id: string
  key_hash: string
  label: string | null
  last_used_at: string | null
  created_at: string
}

// Safe version returned to the client — never includes key_hash
export type ApiKeyPublic = Omit<ApiKey, 'key_hash' | 'user_id' | 'bot_id'>

// Returned once on creation — includes the plain rawKey, shown once then gone
export type ApiKeyCreated = Pick<ApiKey, 'id' | 'label' | 'created_at'> & {
  rawKey: string
}

export type ChatSession = {
  id: string
  bot_id: string
  visitor_id: string | null
  started_at: string
}

export type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: { code: string; message: string } }

export type KnowledgeBase = {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type KbDocument = {
  id: string
  kb_id: string
  filename: string
  file_type: string
  storage_path: string
  status: 'processing' | 'ready' | 'failed'
  chunk_count: number
  error_message: string | null
  created_at: string
}

export type KbChunk = {
  id: string
  document_id: string
  kb_id: string
  content: string
  chunk_index: number
  metadata: Record<string, unknown> | null
  created_at: string
}

export type BotKnowledgeBase = {
  bot_id: string
  kb_id: string
  created_at: string
}

export type RagDebugChunk = {
  content: string
  similarity: number
  source: string
  document_id: string
}

export type RagDebugInfo = {
  kbs_searched: string[]
  chunks_found: number
  rag_used: boolean
  chunks: RagDebugChunk[]
  system_prompt_preview: string
}

export type SessionAnalytics = {
  id: string
  session_id: string
  bot_id: string
  intent: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  topics: string[] | null
  is_answered: boolean | null
  unanswered_questions: string[] | null
  performance_score: number | null
  analyzed_at: string
}

export type TopicCluster = {
  id: string
  bot_id: string
  topic_label: string
  question_count: number
  sample_questions: string[] | null
  trend: 'rising' | 'stable' | 'falling' | null
  computed_date: string
}

export type DailyMetrics = {
  id: string
  bot_id: string
  date: string
  total_sessions: number
  total_messages: number
  avg_messages_per_session: number
  resolved_count: number
  unresolved_count: number
  abandoned_count: number
  resolution_rate: number
  performance_score: number
  unique_visitors: number
  unique_pages: number
}

export type UnansweredQuestion = {
  id: string
  bot_id: string
  session_id: string | null
  question: string
  asked_at: string
  page_url: string | null
  frequency: number
  status: 'open' | 'kb_updated' | 'ignored'
}

export type Escalation = {
  id: string
  session_id: string
  bot_id: string
  visitor_name: string | null
  visitor_email: string
  message: string
  original_question: string | null
  status: 'pending' | 'contacted' | 'resolved'
  created_at: string
}

export type PageAnalytics = {
  page_url: string
  page_title: string | null
  session_count: number
  total_messages: number
  resolution_rate: number | null
}

export type ChatSessionWithAnalytics = ChatSession & {
  analytics?: SessionAnalytics
  message_count: number
  outcome: 'resolved' | 'unresolved' | 'abandoned' | null
  page_url: string | null
  page_title: string | null
  visitor_id_custom: string | null
  visitor_name: string | null
  visitor_email: string | null
  visitor_phone: string | null
  ended_at: string | null
}
