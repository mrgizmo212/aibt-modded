-- Add global settings table for system-wide AI configuration
-- This allows admins to set default parameters for all users

CREATE TABLE IF NOT EXISTS public.global_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.global_settings IS 'System-wide configuration settings for AI models';
COMMENT ON COLUMN public.global_settings.setting_key IS 'Unique identifier for the setting (e.g., default_model_parameters)';
COMMENT ON COLUMN public.global_settings.setting_value IS 'JSON value of the setting';

-- Insert default global settings
INSERT INTO public.global_settings (setting_key, setting_value, description) VALUES
('default_model_parameters', '{
    "temperature": 0.7,
    "max_tokens": 4000,
    "top_p": 0.9,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
}'::jsonb, 'Default AI model parameters for all users'),

('gpt5_parameters', '{
    "verbosity": "high",
    "reasoning_effort": "high",
    "max_tokens": 4000
}'::jsonb, 'GPT-5 specific parameters (no temperature)'),

('reasoning_model_parameters', '{
    "reasoning_effort": "high",
    "max_tokens": 4000
}'::jsonb, 'Parameters for reasoning models (o3, o3-mini, QwQ)'),

('claude_parameters', '{
    "temperature": 0.7,
    "max_tokens": 4096,
    "top_p": 0.9,
    "top_k": 250
}'::jsonb, 'Claude model parameters'),

('gemini_parameters', '{
    "temperature": 0.8,
    "max_output_tokens": 8192,
    "top_p": 0.95,
    "top_k": 40
}'::jsonb, 'Gemini model parameters'),

('grok_parameters', '{
    "temperature": 0.7,
    "max_tokens": 4000,
    "web_search": true
}'::jsonb, 'Grok model parameters with web search')

ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON public.global_settings(setting_key);

