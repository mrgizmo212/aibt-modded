-- ============================================================================
-- MIGRATION 018: Add Conversation Summary to Chat Sessions
-- ============================================================================
-- Purpose: Store rolling summaries of long conversations
-- Date: 2025-11-03
-- ============================================================================

ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

COMMENT ON COLUMN public.chat_sessions.conversation_summary IS 'AI-generated summary of conversation history (updated when >60 messages)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running, verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'conversation_summary';

-- ============================================================================
-- END MIGRATION 018
-- ============================================================================

