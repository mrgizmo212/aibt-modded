-- Add missing columns to profiles table if they don't exist
-- Run this to ensure all columns are present

-- Add display_name if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- Add avatar_url if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add updated_at if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Now create profiles for existing users
INSERT INTO public.profiles (id, email, role, display_name)
SELECT 
  id, 
  email,
  CASE 
    WHEN email = 'adam@truetradinggroup.com' THEN 'admin'
    ELSE 'user'
  END as role,
  split_part(email, '@', 1) as display_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

