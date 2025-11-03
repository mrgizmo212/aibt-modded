"""
Test 4: Verify Multi-Model Isolation
Tests that different models don't interfere with each other's config
This ensures User A's model doesn't see User B's config
"""

import sys
import os
sys.path.insert(0, './backend')

from utils.general_tools import write_config_value, get_config_value


def test_multi_model_isolation():
    """Test that different models have isolated config"""
    print("=" * 80)
    print("TEST 4: Multi-Model Isolation (CRITICAL FOR MULTI-USER)")
    print("=" * 80)
    print()
    
    print("📝 Step 1: Model 26 writes config")
    print("-" * 80)
    
    # Simulate Model 26 (User A's model)
    os.environ["CURRENT_MODEL_ID"] = "26"
    write_config_value("SIGNATURE", "model-26-signature")
    write_config_value("TODAY_DATE", "2025-10-27")
    write_config_value("IF_TRADE", True)
    
    print("  ✅ Model 26 wrote SIGNATURE='model-26-signature'")
    print("  ✅ Model 26 wrote TODAY_DATE='2025-10-27'")
    print("  ✅ Model 26 wrote IF_TRADE=True")
    print()
    
    print("📝 Step 2: Model 27 writes DIFFERENT config")
    print("-" * 80)
    
    # Simulate Model 27 (User B's model)
    os.environ["CURRENT_MODEL_ID"] = "27"
    write_config_value("SIGNATURE", "model-27-signature")
    write_config_value("TODAY_DATE", "2025-10-28")
    write_config_value("IF_TRADE", False)
    
    print("  ✅ Model 27 wrote SIGNATURE='model-27-signature'")
    print("  ✅ Model 27 wrote TODAY_DATE='2025-10-28'")
    print("  ✅ Model 27 wrote IF_TRADE=False")
    print()
    
    print("📖 Step 3: Verify Model 26 config wasn't overwritten")
    print("-" * 80)
    
    # Switch back to Model 26
    os.environ["CURRENT_MODEL_ID"] = "26"
    signature_26 = get_config_value("SIGNATURE")
    date_26 = get_config_value("TODAY_DATE")
    trade_26 = get_config_value("IF_TRADE")
    
    print(f"  Model 26 reads SIGNATURE: {signature_26}")
    print(f"  Model 26 reads TODAY_DATE: {date_26}")
    print(f"  Model 26 reads IF_TRADE: {trade_26}")
    print()
    
    model_26_ok = (
        signature_26 == "model-26-signature" and
        date_26 == "2025-10-27" and
        trade_26 == True
    )
    
    if model_26_ok:
        print("  ✅ Model 26 config preserved!")
    else:
        print("  ❌ Model 26 config was overwritten by Model 27!")
        print("  ❌ This means users would see each other's data!")
    print()
    
    print("📖 Step 4: Verify Model 27 still has its own config")
    print("-" * 80)
    
    # Switch to Model 27
    os.environ["CURRENT_MODEL_ID"] = "27"
    signature_27 = get_config_value("SIGNATURE")
    date_27 = get_config_value("TODAY_DATE")
    trade_27 = get_config_value("IF_TRADE")
    
    print(f"  Model 27 reads SIGNATURE: {signature_27}")
    print(f"  Model 27 reads TODAY_DATE: {date_27}")
    print(f"  Model 27 reads IF_TRADE: {trade_27}")
    print()
    
    model_27_ok = (
        signature_27 == "model-27-signature" and
        date_27 == "2025-10-28" and
        trade_27 == False
    )
    
    if model_27_ok:
        print("  ✅ Model 27 config preserved!")
    else:
        print("  ❌ Model 27 config was corrupted!")
    print()
    
    print("✅ Step 5: Final Verification")
    print("-" * 80)
    
    if model_26_ok and model_27_ok:
        print("  ✅ Both models have isolated config!")
        print("  ✅ Multi-user deployment is SAFE!")
        print()
        print("=" * 80)
        print("✅ TEST 4 PASSED: Multi-model isolation works!")
        print("=" * 80)
        return True
    else:
        print("  ❌ Models interfere with each other!")
        print("  ❌ Multi-user deployment would have DATA COLLISIONS!")
        print()
        print("=" * 80)
        print("❌ TEST 4 FAILED: Isolation broken")
        print("=" * 80)
        return False


if __name__ == "__main__":
    try:
        success = test_multi_model_isolation()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST 4 FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
