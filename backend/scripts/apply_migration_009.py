"""
Apply Migration 009: Add model_parameters and default_ai_model columns
Run this to add AI model configuration storage
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Get Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ ERROR: Missing Supabase credentials in .env file")
    exit(1)

# Create client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# SQL to execute
migration_sql = """
-- Add model_parameters configuration to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS model_parameters JSONB;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS default_ai_model TEXT;

-- Add comments
COMMENT ON COLUMN public.models.model_parameters IS 'JSON configuration for AI model parameters (temperature, verbosity, reasoning_effort, etc.)';
COMMENT ON COLUMN public.models.default_ai_model IS 'Default AI model ID to use for trading (e.g., openai/gpt-5-pro)';
"""

print("🔄 Applying Migration 009: Add model configuration columns...")

try:
    # Execute via Supabase SQL Editor method
    # Note: Direct execution may not work, use Supabase Dashboard
    print("📌 Please use Supabase Dashboard SQL Editor:")
    print()
    print("1. Go to: https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Click 'SQL Editor'")
    print("4. Run this SQL:")
    print()
    print(migration_sql)
    print()
    print("✅ This will add:")
    print("   - model_parameters (JSONB) - Store AI config per model")
    print("   - default_ai_model (TEXT) - Default AI selection")
except Exception as e:
    print(f"Error: {str(e)}")

