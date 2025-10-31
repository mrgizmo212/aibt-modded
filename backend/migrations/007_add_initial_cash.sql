-- Add initial_cash column to models table
-- Allows users to customize starting capital per model

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS initial_cash DECIMAL(12,2) DEFAULT 10000.00;

-- Add comment
COMMENT ON COLUMN public.models.initial_cash IS 'Starting capital for this model in dollars. Defaults to $10,000.';

-- Update existing models to have default value
UPDATE public.models SET initial_cash = 10000.00 WHERE initial_cash IS NULL;

