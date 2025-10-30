-- Add missing columns to models table

-- Add description column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.models ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add is_active column if missing  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.models ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

