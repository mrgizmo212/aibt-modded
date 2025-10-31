-- Migration 008: Add Intraday Trading Support
-- Adds minute_time column to track intraday trades vs daily trades

-- Add minute_time column to positions table
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS minute_time TIME;

-- Add comment
COMMENT ON COLUMN public.positions.minute_time IS 'Time of intraday trade (HH:MM:SS). NULL for daily trades.';

-- Add index for efficient intraday trade queries
CREATE INDEX IF NOT EXISTS idx_positions_intraday 
ON public.positions(model_id, date, minute_time) 
WHERE minute_time IS NOT NULL;

-- Example queries after migration:
-- Get all intraday trades for a model on a date:
--   SELECT * FROM positions 
--   WHERE model_id = 26 AND date = '2025-10-27' AND minute_time IS NOT NULL
--   ORDER BY minute_time;
--
-- Get all daily trades (existing behavior):
--   SELECT * FROM positions
--   WHERE model_id = 26 AND minute_time IS NULL
--   ORDER BY date;

