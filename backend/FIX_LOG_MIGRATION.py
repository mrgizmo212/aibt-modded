"""
Fix Script: Log Migration
Fixes null timestamp issue and re-migrates all logs
Run AFTER TEST_LOG_MIGRATION.py confirms the issue
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from supabase import create_client
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables FIRST!
load_dotenv()

print("=" * 80)
print("LOG MIGRATION FIX & RE-MIGRATION")
print("=" * 80)

# Verify env vars loaded
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ ERROR: Environment variables not loaded!")
    print(f"   SUPABASE_URL: {'✅ Set' if supabase_url else '❌ Missing'}")
    print(f"   SUPABASE_SERVICE_ROLE_KEY: {'✅ Set' if supabase_key else '❌ Missing'}")
    print("\n   Make sure backend/.env file exists with Supabase credentials")
    sys.exit(1)

print(f"✅ Environment loaded")
print(f"   Supabase URL: {supabase_url}")

# Supabase client
supabase = create_client(supabase_url, supabase_key)

print("\nStep 1: Clear existing incomplete logs")
print("-" * 80)

try:
    # Delete all logs to start fresh
    result = supabase.table("logs").delete().neq("id", 0).execute()
    print(f"✅ Cleared existing logs")
except Exception as e:
    print(f"⚠️  Could not clear logs: {e}")
    print("   Continuing anyway...")

print("\nStep 2: Re-migrate logs with null timestamp handling")
print("-" * 80)

data_dir = Path(__file__).parent / "data" / "agent_data"
total_migrated = 0
total_errors = 0

models = [
    (8, 'claude-4.5-sonnet'),
    (9, 'deepseek-deepseek-v3.2-exp'),
    (10, 'google-gemini-2.5-pro'),
    (11, 'minimax-minimax-m1'),
    (12, 'openai-gpt-4.1'),
    (13, 'openai-gpt-5'),
    (14, 'qwen3-max')
]

for model_id, signature in models:
    print(f"\nMigrating {signature}...")
    
    log_dir = data_dir / signature / "log"
    
    if not log_dir.exists():
        print(f"  ⚠️  No log directory found")
        continue
    
    model_logs = []
    
    # Read all log files for this model
    for date_dir in log_dir.iterdir():
        if not date_dir.is_dir():
            continue
        
        date_str = date_dir.name
        log_file = date_dir / "log.jsonl"
        
        if not log_file.exists():
            continue
        
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                
                try:
                    data = json.loads(line)
                    
                    # Handle null timestamps - THIS IS THE FIX
                    timestamp = data.get("timestamp")
                    if not timestamp:
                        # Generate timestamp from date
                        timestamp = f"{date_str}T12:00:00.000000"
                    
                    model_logs.append({
                        "model_id": model_id,
                        "date": date_str,
                        "timestamp": timestamp,  # ✅ FIXED: Never null
                        "signature": data.get("signature", signature),
                        "messages": data.get("new_messages", {})
                    })
                    
                except Exception as e:
                    total_errors += 1
                    print(f"  ⚠️  Parse error: {e}")
    
    # Batch insert
    if model_logs:
        try:
            # Insert in batches of 100
            batch_size = 100
            for i in range(0, len(model_logs), batch_size):
                batch = model_logs[i:i+batch_size]
                supabase.table("logs").insert(batch).execute()
            
            print(f"  ✅ Migrated {len(model_logs)} log entries")
            total_migrated += len(model_logs)
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            total_errors += 1

# Summary
print("\n" + "=" * 80)
print("RE-MIGRATION COMPLETE")
print("=" * 80)

print(f"\nTotal Logs Migrated: {total_migrated}")
print(f"Errors: {total_errors}")

if total_migrated > 300:
    print(f"\n✅ SUCCESS: {total_migrated} logs migrated!")
    print(f"\nNext: Run VERIFY_LOG_MIGRATION.py to confirm")
else:
    print(f"\n⚠️  Only {total_migrated} logs migrated")
    print(f"   Expected: ~359")

print("\n" + "=" * 80)

