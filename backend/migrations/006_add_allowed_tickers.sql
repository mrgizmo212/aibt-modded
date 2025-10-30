-- Add allowed_tickers column to models table
-- This will enable user-selectable stock universes for each model

-- Add column
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS allowed_tickers JSONB;

-- Add comment
COMMENT ON COLUMN public.models.allowed_tickers IS 'Optional: Array of stock tickers this model is allowed to trade. If null, trades all NASDAQ 100.';

-- Example usage:
-- UPDATE models SET allowed_tickers = '["AAPL", "GOOGL", "MSFT", "META", "AMZN"]'::jsonb WHERE id = 1;


