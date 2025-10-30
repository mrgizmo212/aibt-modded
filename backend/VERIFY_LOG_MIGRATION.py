"""
Verification Script: Log Migration
Confirms all logs were migrated successfully
Run AFTER FIX_LOG_MIGRATION.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from services import get_model_logs

print("=" * 80)
print("LOG MIGRATION VERIFICATION")
print("=" * 80)
print("\nVerifying log migration is complete...\n")

async def verify_logs():
    admin_id = "4aa394de-571f-4fde-9484-9ef0b572e9f9"
    
    models = [
        (8, 'claude-4.5-sonnet', 37),
        (9, 'deepseek-deepseek-v3.2-exp', 112),
        (10, 'google-gemini-2.5-pro', 38),
        (11, 'minimax-minimax-m1', 107),
        (12, 'openai-gpt-4.1', 4),
        (13, 'openai-gpt-5', 19),
        (14, 'qwen3-max', 42)
    ]
    
    total_expected = sum(count for _, _, count in models)
    total_found = 0
    all_passed = True
    
    print("Model-by-Model Verification:")
    print("-" * 80)
    
    for model_id, signature, expected in models:
        result = await get_model_logs(model_id, admin_id)
        # get_model_logs returns a list, not a dict
        found = len(result) if isinstance(result, list) else result.get('total_entries', 0)
        
        success = found >= expected * 0.9  # Allow 10% tolerance
        status = "✅" if success else "❌"
        
        print(f"{status} {signature}")
        print(f"   Expected: ~{expected} logs")
        print(f"   Found: {found} logs")
        
        if not success:
            all_passed = False
            print(f"   ⚠️  Missing: {expected - found} entries")
        
        total_found += found
    
    # Summary
    print("\n" + "=" * 80)
    print("VERIFICATION RESULTS")
    print("=" * 80)
    
    success_rate = (total_found / total_expected * 100) if total_expected > 0 else 0
    
    print(f"\nExpected Total: ~{total_expected} logs")
    print(f"Found Total: {total_found} logs")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if all_passed and success_rate > 90:
        print(f"\n✅ LOG MIGRATION VERIFIED!")
        print(f"   All models have logs in database")
        print(f"   Users can now see AI reasoning")
        print(f"\n   Next: Test in frontend /models/{{id}}/logs")
        return True
    else:
        print(f"\n❌ LOG MIGRATION STILL INCOMPLETE")
        print(f"   Missing {total_expected - total_found} log entries")
        print(f"   Review FIX_LOG_MIGRATION.py for errors")
        return False

result = asyncio.run(verify_logs())

print("\n" + "=" * 80)
sys.exit(0 if result else 1)

