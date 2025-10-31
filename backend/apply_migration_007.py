"""
Apply Migration 007: Add initial_cash column to models table
Allows users to customize starting capital per model
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("MIGRATION 007: Add initial_cash Column to Models")
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
migration_file = Path(__file__).parent / "migrations" / "007_add_initial_cash.sql"
with open(migration_file) as f:
    migration_sql = f.read()

print("\n🔄 Applying migration...")
print(migration_sql)
print()

try:
    # Execute migration
    result = supabase.rpc('exec_sql', {'query': migration_sql}).execute()
    print("✅ Migration 007 applied successfully!")
    print("✅ Column 'initial_cash' added to models table")
    print("\nUsers can now specify custom starting capital when creating models.")
    print("Default: $10,000")
    print("Range: $1,000 - $1,000,000")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    print("\nIf exec_sql RPC is not available, run this SQL manually in Supabase:")
    print("\n" + migration_sql)
    sys.exit(1)

print("\n" + "=" * 80)

