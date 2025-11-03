"""
Test 1: Verify Redis Config Works in Synchronous Contexts
Tests that MCP tools (sync functions) can read/write config via Redis
"""

import sys
import os
sys.path.insert(0, './backend')

from utils.general_tools import get_config_value, write_config_value


def test_sync_read_write():
    """Test synchronous read/write (simulates MCP tool context)"""
    print("=" * 80)
    print("TEST 1: Synchronous Config Read/Write")
    print("=" * 80)
    print()
    
    # Set model ID (simulates agent_manager setting this)
    os.environ["CURRENT_MODEL_ID"] = "test-model-sync"
    
    print("📝 Step 1: Write config values (sync)")
    print("-" * 80)
    
    # Write test values
    write_config_value("SIGNATURE", "test-sync-signature")
    write_config_value("TODAY_DATE", "2025-11-03")
    write_config_value("IF_TRADE", True)
    
    print("  ✅ Wrote SIGNATURE='test-sync-signature'")
    print("  ✅ Wrote TODAY_DATE='2025-11-03'")
    print("  ✅ Wrote IF_TRADE=True")
    print()
    
    print("📖 Step 2: Read config values (sync)")
    print("-" * 80)
    
    # Read values back
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
    
    if signature == "test-sync-signature":
        print("  ✅ SIGNATURE matches")
    else:
        print(f"  ❌ SIGNATURE mismatch: expected 'test-sync-signature', got '{signature}'")
        success = False
    
    if today_date == "2025-11-03":
        print("  ✅ TODAY_DATE matches")
    else:
        print(f"  ❌ TODAY_DATE mismatch: expected '2025-11-03', got '{today_date}'")
        success = False
    
    if if_trade == True:
        print("  ✅ IF_TRADE matches")
    else:
        print(f"  ❌ IF_TRADE mismatch: expected True, got '{if_trade}'")
        success = False
    
    print()
    
    if success:
        print("=" * 80)
        print("✅ TEST 1 PASSED: Sync config read/write works!")
        print("=" * 80)
        return True
    else:
        print("=" * 80)
        print("❌ TEST 1 FAILED: Config values don't match")
        print("=" * 80)
        return False


if __name__ == "__main__":
    try:
        success = test_sync_read_write()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST 1 FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
