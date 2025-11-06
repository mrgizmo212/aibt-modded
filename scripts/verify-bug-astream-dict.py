"""
BUG-017: Variable name collision - 'model' overwrites ChatOpenAI instance

This script verifies that line 2053 in backend/main.py overwrites
the LangChain ChatOpenAI model object with a dictionary, causing
the astream() call to fail.

Expected: Line 2009 creates ChatOpenAI object, line 2135 uses it
Actual: Line 2053 overwrites with dict, line 2135 fails with 'dict has no attribute astream'
"""

import re

def test_variable_name_collision():
    """Test that 'model' variable is being overwritten"""
    
    with open('/workspace/backend/main.py', 'r') as f:
        content = f.read()
        lines = content.split('\n')
    
    # Find line 2009: model = ChatOpenAI(**params)
    line_2009 = lines[2008] if len(lines) > 2008 else ""
    assert 'model = ChatOpenAI(' in line_2009, f"Line 2009 doesn't create ChatOpenAI: {line_2009}"
    print("✅ Line 2009: Creates ChatOpenAI model object")
    
    # Find line 2053: model = model_data.data[0]
    line_2053 = lines[2052] if len(lines) > 2052 else ""
    
    # BUG CHECK: Is 'model' being overwritten?
    if 'model = model_data.data[0]' in line_2053:
        print(f"❌ BUG CONFIRMED: Line 2053 overwrites 'model' variable: {line_2053.strip()}")
        bug_exists = True
    elif 'model_config = model_data.data[0]' in line_2053 or 'model_info = model_data.data[0]' in line_2053:
        print(f"✅ Line 2053: Uses different variable name (bug fixed): {line_2053.strip()}")
        bug_exists = False
    else:
        print(f"⚠️ Line 2053 unexpected: {line_2053.strip()}")
        bug_exists = False
    
    # Find line 2135: async for chunk in model.astream(messages):
    line_2135 = lines[2134] if len(lines) > 2134 else ""
    assert 'model.astream(messages)' in line_2135, f"Line 2135 doesn't call model.astream: {line_2135}"
    print(f"✅ Line 2135: Calls model.astream(messages)")
    
    # Verify references to model data use correct variable
    # Find lines 2056-2090 where model data is used
    model_data_usage_lines = []
    for i in range(2055, 2090):  # Lines 2056-2090
        if i < len(lines):
            line = lines[i]
            if re.search(r"model\.get\(", line):
                model_data_usage_lines.append((i+1, line.strip()))
    
    print(f"\n📋 Found {len(model_data_usage_lines)} lines using model.get() for configuration:")
    for line_num, line_content in model_data_usage_lines[:3]:
        print(f"   Line {line_num}: {line_content[:80]}...")
    
    if bug_exists:
        print("\n" + "="*80)
        print("❌ BUG CONFIRMED: Variable 'model' is overwritten with dict")
        print("="*80)
        print("Flow:")
        print("  1. Line 2009: model = ChatOpenAI(...)  # ✅ Creates LangChain object")
        print("  2. Line 2053: model = model_data.data[0]  # ❌ OVERWRITES with dict!")
        print("  3. Line 2135: async for chunk in model.astream(...)  # ❌ FAILS - dict has no astream()")
        print("\nFix: Rename line 2053 to use different variable name (model_config, model_info, etc.)")
        return False
    else:
        print("\n" + "="*80)
        print("✅ BUG FIXED: Variable names don't collide")
        print("="*80)
        return True

if __name__ == "__main__":
    try:
        success = test_variable_name_collision()
        if not success:
            exit(1)
        else:
            print("\n✅ ALL TESTS PASSED - Bug is fixed!")
            exit(0)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        exit(1)
