-- ============================================================================
-- MIGRATION 017: Global Chat Settings
-- ============================================================================
-- Purpose: Store admin-configured global chat AI settings
-- Date: 2025-11-03
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.global_chat_settings (
  id SERIAL PRIMARY KEY,
  
  -- AI Model Configuration
  chat_model TEXT NOT NULL DEFAULT 'openai/gpt-4.1-mini',
  
  -- System Instructions (unlimited)
  chat_instructions TEXT,
  
  -- Model Parameters (full control)
  model_parameters JSONB DEFAULT '{
    "temperature": 0.30,
    "top_p": 0.90,
    "frequency_penalty": 0.00,
    "presence_penalty": 0.00,
    "max_prompt_tokens": 800000,
    "max_tokens": 32000,
    "max_completion_tokens": 32000
  }'::jsonb,
  
  -- Audit Trail
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Enforce single row (only one global config)
  CONSTRAINT single_global_config CHECK (id = 1)
);

-- Insert default configuration
INSERT INTO public.global_chat_settings (
  id, 
  chat_model, 
  chat_instructions,
  model_parameters
) VALUES (
  1,
  'openai/gpt-4.1-mini',
  'You are a helpful trading analyst. Be concise and cite evidence.',
  '{
    "temperature": 0.30,
    "top_p": 0.90,
    "frequency_penalty": 0.00,
    "presence_penalty": 0.00,
    "max_prompt_tokens": 800000,
    "max_tokens": 32000,
    "max_completion_tokens": 32000
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_global_chat_updated 
ON public.global_chat_settings(updated_at DESC);

-- RLS (Admin only)
ALTER TABLE public.global_chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view global chat settings" ON public.global_chat_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update global chat settings" ON public.global_chat_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.global_chat_settings IS 'Global AI configuration for chat system (admin-managed)';
COMMENT ON COLUMN public.global_chat_settings.chat_model IS 'AI model used for ALL chat conversations';
COMMENT ON COLUMN public.global_chat_settings.chat_instructions IS 'System instructions added to every chat session (unlimited)';
COMMENT ON COLUMN public.global_chat_settings.model_parameters IS 'All AI params: temperature, top_p, max_tokens, etc. (JSONB)';
COMMENT ON COLUMN public.global_chat_settings.updated_by IS 'Admin who last modified settings';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- After running, verify:
-- SELECT * FROM global_chat_settings;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'global_chat_settings';

-- ============================================================================
-- END MIGRATION 017
-- ============================================================================

