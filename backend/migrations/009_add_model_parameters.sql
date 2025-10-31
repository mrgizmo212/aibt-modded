-- Add model_parameters configuration to models table
-- This enables per-model AI parameter customization

-- Add column for storing model parameters
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS model_parameters JSONB;

-- Add column for default AI model selection
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS default_ai_model TEXT;

-- Add comments
COMMENT ON COLUMN public.models.model_parameters IS 'JSON configuration for AI model parameters (temperature, verbosity, reasoning_effort, etc.)';
COMMENT ON COLUMN public.models.default_ai_model IS 'Default AI model ID to use for trading (e.g., openai/gpt-5-pro)';

-- Example usage:
-- UPDATE models SET model_parameters = '{"temperature": 0.7, "verbosity": "high", "reasoning_effort": "high", "max_tokens": 4000}'::jsonb WHERE id = 1;
-- UPDATE models SET default_ai_model = 'openai/gpt-5-pro' WHERE id = 1;

