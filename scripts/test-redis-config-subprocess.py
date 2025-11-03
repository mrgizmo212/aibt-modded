"""
Test 3: Verify Redis Config Works Across Subprocesses
Tests that config written by parent can be read by subprocess (like MCP tools)
This is THE CRITICAL TEST that reproduces the production bug
"""

import sys
import os
import subprocess
sys.path.insert(0, './backend')

from utils.general_tools import write_config_value, get_config_value


def test_subprocess_communication():
    """Test cross-process config (parent writes, subprocess reads)"""
    print("=" * 80)
    print("TEST 3: Subprocess Config Communication (THE CRITICAL TEST)")
    print("=" * 80)
    print()
    
    # Set model ID
    os.environ["CURRENT_MODEL_ID"] = "test-model-subprocess"
    
    print("📝 Step 1: Parent process writes config")
    print("-" * 80)
    
    # Write config in parent process
    write_config_value("SIGNATURE", "test-subprocess-signature")
    write_config_value("TODAY_DATE", "2025-11-03")
    write_config_value("IF_TRADE", True)
    
    print("  ✅ Parent wrote SIGNATURE='test-subprocess-signature'")
    print("  ✅ Parent wrote TODAY_DATE='2025-11-03'")
    print("  ✅ Parent wrote IF_TRADE=True")
    print()
    
    print("🔄 Step 2: Subprocess reads config (simulates MCP tool)")
    print("-" * 80)
    
    # Create subprocess that tries to read config
    subprocess_code = """
import sys
import os
sys.path.insert(0, './backend')

# Subprocess must have same CURRENT_MODEL_ID
os.environ["CURRENT_MODEL_ID"] = "test-model-subprocess"

from utils.general_tools import get_config_value

# Try to read config
signature = get_config_value("SIGNATURE")
today_date = get_config_value("TODAY_DATE")
if_trade = get_config_value("IF_TRADE")

print(f"  Subprocess read SIGNATURE: {signature}")
print(f"  Subprocess read TODAY_DATE: {today_date}")
print(f"  Subprocess read IF_TRADE: {if_trade}")

# Check if values match
if signature == "test-subprocess-signature" and today_date == "2025-11-03" and if_trade == True:
    print("  ✅ All values match!")
    sys.exit(0)
else:
    print("  ❌ Values don't match!")
    sys.exit(1)
"""
    
    result = subprocess.run(
        [sys.executable, "-c", subprocess_code],
        capture_output=True,
        text=True,
        env=os.environ.copy()
    )
    
    # Print subprocess output
    print(result.stdout)
    if result.stderr:
        print("  Subprocess stderr:", result.stderr)
    print()
    
    print("✅ Step 3: Verify subprocess could read config")
    print("-" * 80)
    
    if result.returncode == 0:
        print("  ✅ Subprocess successfully read config from Redis!")
        print("  ✅ This proves cross-process communication works!")
        print()
        print("=" * 80)
        print("✅ TEST 3 PASSED: Subprocess config works! (BUG IS FIXED)")
        print("=" * 80)
        return True
    else:
        print("  ❌ Subprocess could not read config")
        print("  ❌ This means MCP tools would fail with SIGNATURE error")
        print()
        print("=" * 80)
        print("❌ TEST 3 FAILED: Subprocess config doesn't work")
        print("=" * 80)
        return False


if __name__ == "__main__":
    try:
        success = test_subprocess_communication()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST 3 FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
