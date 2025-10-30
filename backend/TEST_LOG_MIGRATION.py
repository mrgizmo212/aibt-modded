"""
Test Script: Log Migration Status
Verifies current state of log migration
Run BEFORE fixing
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from services import get_model_logs, get_supabase

print("=" * 80)
print("LOG MIGRATION STATUS TEST")
print("=" * 80)
print("\nChecking current log migration state...\n")

async def test_log_migration():
    admin_id = "4aa394de-571f-4fde-9484-9ef0b572e9f9"
    
    # Test each migrated model
    models = [
        (8, 'claude-4.5-sonnet'),
        (9, 'deepseek-deepseek-v3.2-exp'),
        (10, 'google-gemini-2.5-pro'),
        (11, 'minimax-minimax-m1'),
        (12, 'openai-gpt-4.1'),
        (13, 'openai-gpt-5'),
        (14, 'qwen3-max')
    ]
    
    total_jsonl = 0
    total_db = 0
    
    print("Model-by-Model Analysis:")
    print("-" * 80)
    
    for model_id, signature in models:
        # Count JSONL logs
        jsonl_count = 0
        log_dir = Path(__file__).parent / "data" / "agent_data" / signature / "log"
        
        if log_dir.exists():
            for date_dir in log_dir.iterdir():
                if date_dir.is_dir():
                    log_file = date_dir / "log.jsonl"
                    if log_file.exists():
                        with open(log_file, 'r', encoding='utf-8') as f:
                            jsonl_count += sum(1 for line in f if line.strip())
        
        # Count DB logs
        try:
            result = await get_model_logs(model_id, admin_id)
            db_count = result.get('total_entries', 0)
        except:
            db_count = 0
        
        success_rate = (db_count / jsonl_count * 100) if jsonl_count > 0 else 0
        
        status = "✅" if success_rate > 90 else "❌"
        
        print(f"{status} {signature}")
        print(f"   JSONL: {jsonl_count} entries")
        print(f"   Database: {db_count} entries")
        print(f"   Success: {success_rate:.1f}%")
        
        total_jsonl += jsonl_count
        total_db += db_count
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    overall_success = (total_db / total_jsonl * 100) if total_jsonl > 0 else 0
    
    print(f"\nTotal JSONL Logs: {total_jsonl}")
    print(f"Total DB Logs: {total_db}")
    print(f"Overall Success Rate: {overall_success:.1f}%")
    print(f"Missing: {total_jsonl - total_db} log entries")
    
    if overall_success < 90:
        print(f"\n❌ LOG MIGRATION INCOMPLETE")
        print(f"   Only {overall_success:.1f}% of logs migrated")
        print(f"   {total_jsonl - total_db} entries missing")
        print(f"\n   Impact: Users cannot see AI reasoning for {total_jsonl - total_db} decisions")
        print(f"\n   Next: Run FIX_LOG_MIGRATION.py to fix and re-migrate")
        return False
    else:
        print(f"\n✅ LOG MIGRATION COMPLETE")
        print(f"   {overall_success:.1f}% success rate")
        return True

# Run test
result = asyncio.run(test_log_migration())

print("\n" + "=" * 80)
if not result:
    sys.exit(1)  # Exit with error code if migration incomplete
else:
    sys.exit(0)  # Success

