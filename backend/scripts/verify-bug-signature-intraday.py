"""
Verify Bug: SIGNATURE Missing in Intraday Trading

This script reproduces the bug where SIGNATURE is not set during intraday trading,
causing buy/sell tools to fail.

Expected Result: Bug confirmed - SIGNATURE not accessible in subprocess
"""

import os
import sys

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def test_signature_missing():
    """Test that SIGNATURE is missing without the fix"""
    print("=" * 80)
    print("VERIFY BUG: SIGNATURE Missing in Intraday Trading")
    print("=" * 80)
    
    # Simulate intraday trading initialization (before fix)
    model_id = 999
    signature = "test-model-signature"
    
    print(f"\n1️⃣  Setting up test environment...")
    print(f"   Model ID: {model_id}")
    print(f"   Signature: {signature}")
    
    # Set model ID for isolation
    os.environ["CURRENT_MODEL_ID"] = str(model_id)
    
    # Check if SIGNATURE is accessible (BEFORE fix - should fail)
    print(f"\n2️⃣  Checking SIGNATURE availability...")
    
    from utils.general_tools import get_config_value
    
    signature_value = get_config_value("SIGNATURE")
    
    if signature_value is None:
        print(f"   ✅ BUG CONFIRMED: SIGNATURE is None")
        print(f"   This is why buy/sell tools fail!")
        print(f"\n📋 Error that would occur:")
        print(f"   ValueError: SIGNATURE environment variable is not set")
        return True
    else:
        print(f"   ❌ Bug NOT reproduced: SIGNATURE = {signature_value}")
        print(f"   (This means SIGNATURE was set elsewhere)")
        return False

def test_tools_fail_without_signature():
    """Test that buy/sell tools fail without SIGNATURE"""
    print(f"\n3️⃣  Testing buy tool without SIGNATURE...")
    
    # Don't set SIGNATURE
    os.environ["CURRENT_MODEL_ID"] = "999"
    
    try:
        from mcp_services.tool_trade import buy
        
        # This should fail
        result = buy("AAPL", 10)
        
        print(f"   ❌ Buy succeeded unexpectedly: {result}")
        return False
        
    except ValueError as e:
        if "SIGNATURE" in str(e):
            print(f"   ✅ BUG CONFIRMED: {e}")
            return True
        else:
            print(f"   ⚠️  Different error: {e}")
            return False
    except Exception as e:
        print(f"   ⚠️  Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("SIGNATURE BUG VERIFICATION")
    print("=" * 80)
    
    test1_passed = test_signature_missing()
    test2_passed = test_tools_fail_without_signature()
    
    print("\n" + "=" * 80)
    print("RESULTS")
    print("=" * 80)
    print(f"Test 1 (SIGNATURE missing): {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Test 2 (Tools fail): {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        print("\n✅ BUG CONFIRMED 100%")
        print("   SIGNATURE is not set during intraday trading")
        print("   This causes buy/sell tools to fail")
        print("   AI decisions default to HOLD")
    else:
        print("\n⚠️  Bug not fully reproduced")
        print("   Check if SIGNATURE is being set somewhere else")
    
    print("=" * 80)

