-- ============================================================================
-- MIGRATION 014: Chat System for System Agent
-- ============================================================================
-- Purpose: Enable conversational strategy building and analysis
-- Date: 2025-10-31
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_id INT REFERENCES public.trading_runs(id) ON DELETE CASCADE,
  
  session_title TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  
  UNIQUE(model_id, run_id)  -- One chat session per run
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  
  -- Tool usage tracking (what tools did AI use to answer)
  tool_calls JSONB,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_session ON public.chat_messages(session_id, timestamp);
CREATE INDEX idx_chat_timestamp ON public.chat_messages(timestamp DESC);
CREATE INDEX idx_chat_sessions_model ON public.chat_sessions(model_id);
CREATE INDEX idx_chat_sessions_run ON public.chat_sessions(run_id);

-- Comments
COMMENT ON TABLE public.chat_sessions IS 'Chat conversations between user and system agent (strategy analysis)';
COMMENT ON TABLE public.chat_messages IS 'Individual messages in chat conversations';
COMMENT ON COLUMN public.chat_messages.tool_calls IS 'Tools AI used to answer (for transparency)';

-- ============================================================================
-- ROW LEVEL SECURITY (Multi-User Isolation)
-- ============================================================================

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_sessions policies
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = chat_sessions.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = chat_sessions.model_id
      AND models.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.models
      WHERE models.id = chat_sessions.model_id
      AND models.user_id = auth.uid()
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

-- chat_messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.models m ON m.id = cs.model_id
      WHERE cs.id = chat_messages.session_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.models m ON m.id = cs.model_id
      WHERE cs.id = chat_messages.session_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE cs.id = chat_messages.session_id
      AND p.role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running, verify:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('chat_sessions', 'chat_messages');
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('chat_sessions', 'chat_messages');

-- ============================================================================
-- END MIGRATION 014
-- ============================================================================

