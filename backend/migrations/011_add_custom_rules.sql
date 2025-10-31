-- Add custom rules and instructions to models table
-- Allows users to define custom trading behavior per model

-- Add columns
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS custom_rules TEXT;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS custom_instructions TEXT;

-- Add comments
COMMENT ON COLUMN public.models.custom_rules IS 'Custom trading rules for this model (optional). If provided, agent follows these rules.';
COMMENT ON COLUMN public.models.custom_instructions IS 'Custom instructions for this model (optional). If provided, agent follows these instructions.';

-- Examples:
-- UPDATE models SET custom_rules = 'Only trade tech stocks. Never hold more than 5 positions. Take profit at 10%.' WHERE id = 1;
-- UPDATE models SET custom_instructions = 'Focus on value investing. Prefer companies with P/E ratio under 20.' WHERE id = 1;

