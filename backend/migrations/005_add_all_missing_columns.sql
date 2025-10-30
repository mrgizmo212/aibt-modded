-- Add ALL missing columns to complete the schema
-- Run this to ensure tables match the migration script expectations

-- Positions table: add missing columns
DO $$
BEGIN
  -- Add cash column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'cash'
  ) THEN
    ALTER TABLE public.positions ADD COLUMN cash DECIMAL(12,2);
  END IF;
  
  -- Add action_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'action_type'
  ) THEN
    ALTER TABLE public.positions ADD COLUMN action_type TEXT CHECK (action_type IN ('buy', 'sell', 'no_trade'));
  END IF;
  
  -- Add symbol column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'symbol'
  ) THEN
    ALTER TABLE public.positions ADD COLUMN symbol TEXT;
  END IF;
  
  -- Add amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE public.positions ADD COLUMN amount INT;
  END IF;
END $$;

-- Logs table: add missing columns
DO $$
BEGIN
  -- Add signature column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'logs' AND column_name = 'signature'
  ) THEN
    ALTER TABLE public.logs ADD COLUMN signature TEXT NOT NULL DEFAULT 'unknown';
  END IF;
END $$;

-- Reload schema cache (force PostgREST to recognize new columns)
NOTIFY pgrst, 'reload schema';

