-- ============================================================================
-- MIGRATION 015: Multi-Conversation Support (Two-Level Conversations)
-- ============================================================================
-- Purpose: Enable general conversations + multiple conversations per model
-- Date: 2025-11-04
-- Features:
--   - General conversations (model_id = NULL)
--   - Multiple conversations per model (remove UNIQUE constraint)
--   - Active conversation tracking (is_active)
--   - Direct user ownership (user_id)
--   - Conversation summaries for long histories
-- ============================================================================

-- ============================================================================
-- STEP 1: Modify chat_sessions table structure
-- ============================================================================

-- 1A. Make model_id nullable (allow general conversations)
ALTER TABLE public.chat_sessions 
  ALTER COLUMN model_id DROP NOT NULL;

-- 1B. Remove unique constraint (allow multiple conversations per model)
ALTER TABLE public.chat_sessions 
  DROP CONSTRAINT IF EXISTS chat_sessions_model_id_run_id_key;

-- 1C. Add is_active flag (track current/active conversation)
ALTER TABLE public.chat_sessions 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 1D. Add user_id for direct ownership (no need to join through models)
ALTER TABLE public.chat_sessions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 1E. Add conversation_summary for long conversation histories (>60 messages)
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

-- Index for fetching user's active sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_active 
  ON public.chat_sessions(user_id, is_active);

-- Index for fetching user's general conversations (model_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_general
  ON public.chat_sessions(user_id) WHERE model_id IS NULL;

-- Index for fetching model-specific conversations
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_model
  ON public.chat_sessions(user_id, model_id) WHERE model_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Backfill user_id for existing sessions
-- ============================================================================

-- Populate user_id from models table for existing chat_sessions
UPDATE public.chat_sessions cs
SET user_id = m.user_id
FROM public.models m
WHERE cs.model_id = m.id
  AND cs.user_id IS NULL;

-- ============================================================================
-- STEP 4: Update RLS (Row Level Security) policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admins can view all chat sessions" ON public.chat_sessions;

-- Create new policies that handle both general and model-specific conversations
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (
    -- Direct ownership via user_id
    user_id = auth.uid()
    OR
    -- Ownership via model (for backward compatibility)
    (
      model_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.models
        WHERE models.id = chat_sessions.model_id
        AND models.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    (
      model_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.models
        WHERE models.id = chat_sessions.model_id
        AND models.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all chat sessions" ON public.chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 5: Add foreign key constraint for user_id
-- ============================================================================

-- Add foreign key constraint if not already added in step 1D
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_sessions_user_id_fkey' 
    AND table_name = 'chat_sessions'
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD CONSTRAINT chat_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.chat_sessions.model_id IS 'Model ID (NULL for general conversations)';
COMMENT ON COLUMN public.chat_sessions.user_id IS 'Direct user ownership (UUID) for general conversations';
COMMENT ON COLUMN public.chat_sessions.is_active IS 'Whether this is the currently active conversation';
COMMENT ON COLUMN public.chat_sessions.conversation_summary IS 'AI-generated summary of conversation (for histories >60 messages)';

-- ============================================================================
-- STEP 7: VERIFICATION QUERIES (Run these after migration to verify)
-- ============================================================================

-- Check that columns were added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'chat_sessions' 
-- ORDER BY ordinal_position;

-- Check that indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'chat_sessions';

-- Check that policies were updated
-- SELECT policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'chat_sessions';

-- ============================================================================
-- END MIGRATION 015
-- ============================================================================

