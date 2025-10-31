"""
Apply Migration 008: Add Intraday Trading Support
Adds minute_time column to positions table for intraday trades
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("MIGRATION 008: Add Intraday Trading Support")
print("=" * 80)

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ ERROR: Supabase credentials not found in .env")
    sys.exit(1)

print(f"✅ Supabase URL: {supabase_url}")

# Create client
supabase = create_client(supabase_url, supabase_key)

# Read migration SQL
migration_file = Path(__file__).parent / "migrations" / "008_intraday_support.sql"
with open(migration_file) as f:
    migration_sql = f.read()

print("\n🔄 Applying migration...")
print(migration_sql)
print()

try:
    # Execute migration
    result = supabase.rpc('exec_sql', {'query': migration_sql}).execute()
    print("✅ Migration 008 applied successfully!")
    print("✅ Column 'minute_time' added to positions table")
    print("✅ Index created for efficient intraday queries")
    print("\nIntraday trading support enabled:")
    print("  - Daily trades: minute_time = NULL")
    print("  - Intraday trades: minute_time = HH:MM:SS")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    print("\nIf exec_sql RPC is not available, run this SQL manually in Supabase:")
    print("\n" + migration_sql)
    sys.exit(1)

print("\n" + "=" * 80)

