"""
Test 2: Verify Redis Config Works in Async Contexts
Tests that BaseAgent (async methods) can read/write config via Redis
"""

import sys
import os
import asyncio
sys.path.insert(0, './backend')

from utils.general_tools import get_config_value, write_config_value


async def test_async_read_write():
    """Test config in async context (simulates BaseAgent methods)"""
    print("=" * 80)
    print("TEST 2: Async Config Read/Write")
    print("=" * 80)
    print()
    
    # Set model ID
    os.environ["CURRENT_MODEL_ID"] = "test-model-async"
    
    print("📝 Step 1: Write config from async function")
    print("-" * 80)
    
    # Write values (sync function called from async context)
    write_config_value("SIGNATURE", "test-async-signature")
    write_config_value("TODAY_DATE", "2025-11-03")
    write_config_value("IF_TRADE", False)
    
    print("  ✅ Wrote SIGNATURE='test-async-signature'")
    print("  ✅ Wrote TODAY_DATE='2025-11-03'")
    print("  ✅ Wrote IF_TRADE=False")
    print()
    
    # Simulate async operation
    await asyncio.sleep(0.1)
    
    print("📖 Step 2: Read config from async function")
    print("-" * 80)
    
    # Read values (sync function called from async context)
    signature = get_config_value("SIGNATURE")
    today_date = get_config_value("TODAY_DATE")
    if_trade = get_config_value("IF_TRADE")
    
    print(f"  Read SIGNATURE: {signature}")
    print(f"  Read TODAY_DATE: {today_date}")
    print(f"  Read IF_TRADE: {if_trade}")
    print()
    
    print("✅ Step 3: Verify values match")
    print("-" * 80)
    
    success = True
    
    if signature == "test-async-signature":
        print("  ✅ SIGNATURE matches")
    else:
        print(f"  ❌ SIGNATURE mismatch: expected 'test-async-signature', got '{signature}'")
        success = False
    
    if today_date == "2025-11-03":
        print("  ✅ TODAY_DATE matches")
    else:
        print(f"  ❌ TODAY_DATE mismatch: expected '2025-11-03', got '{today_date}'")
        success = False
    
    if if_trade == False:
        print("  ✅ IF_TRADE matches")
    else:
        print(f"  ❌ IF_TRADE mismatch: expected False, got '{if_trade}'")
        success = False
    
    print()
    
    if success:
        print("=" * 80)
        print("✅ TEST 2 PASSED: Async config read/write works!")
        print("=" * 80)
        return True
    else:
        print("=" * 80)
        print("❌ TEST 2 FAILED: Config values don't match")
        print("=" * 80)
        return False


if __name__ == "__main__":
    try:
        success = asyncio.run(test_async_read_write())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST 2 FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
