"""
Apply Migration 006: Add allowed_tickers column
Run this instead of psql if you don't have PostgreSQL client installed
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
-- Add allowed_tickers column to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS allowed_tickers JSONB;

-- Add comment
COMMENT ON COLUMN public.models.allowed_tickers IS 'Optional: Array of stock tickers this model is allowed to trade. If null, trades all NASDAQ 100.';
"""

print("🔄 Applying Migration 006: Add allowed_tickers column...")

try:
    # Execute via Supabase RPC (raw SQL)
    result = supabase.rpc('exec_sql', {'query': migration_sql}).execute()
    print("✅ Migration 006 applied successfully!")
    print("✅ Column 'allowed_tickers' added to models table")
except Exception as e:
    # If RPC doesn't work, show alternative
    print("⚠️  Direct SQL execution via Python client not available.")
    print("📌 Please use Supabase Dashboard SQL Editor instead:")
    print()
    print("1. Go to: https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Click 'SQL Editor'")
    print("4. Run this SQL:")
    print()
    print(migration_sql)
    print()
    print(f"Error details: {str(e)}")

