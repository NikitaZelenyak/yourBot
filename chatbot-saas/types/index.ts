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
