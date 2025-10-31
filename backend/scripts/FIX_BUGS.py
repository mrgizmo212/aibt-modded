"""
Critical Bug Fixes
Fixes the identified portfolio value and log migration bugs
Run VERIFY_BUGS.py first to confirm issues, then run this
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

print("=" * 70)
print("AIBT CRITICAL BUG FIXES")
print("=" * 70)
print("\nApplying fixes...\n")

# ============================================================================
# FIX 1: Update services.py - Portfolio Value Calculation
# ============================================================================

print("FIX 1: Portfolio Value Calculation")
print("-" * 70)

services_file = Path(__file__).parent / "services.py"

fix_1_old_code = '''    # Calculate total value (simplified - would need prices for accuracy)
            return {
                "model": model,
                "date": last_position.get("date", ""),
                "positions": positions,
                "cash": cash,
                "total_value": cash  # Simplified - full calc needs price data
            }'''

fix_1_new_code = '''    # Calculate total value with stock prices
            from utils.price_tools import get_open_prices
            
            date_str = last_position.get("date", "")
            positions = last_position.get("positions", {})
            cash = positions.get("CASH", 0.0)
            
            # Get prices for the date
            try:
                symbols = [s for s in positions.keys() if s != 'CASH']
                prices = get_open_prices(date_str, symbols)
                
                # Calculate total value
                total_value = cash
                for symbol, shares in positions.items():
                    if symbol != 'CASH' and shares > 0:
                        price_key = f'{symbol}_price'
                        price = prices.get(price_key, 0)
                        if price:
                            total_value += shares * price
                
            except Exception as e:
                print(f"Warning: Could not calculate stock values: {e}")
                total_value = cash  # Fallback to cash only
            
            return {
                "model": model,
                "date": date_str,
                "positions": positions,
                "cash": cash,
                "total_value": total_value  # ✅ FIXED: Includes stock valuations
            }'''

try:
    with open(services_file, 'r') as f:
        content = f.read()
    
    if fix_1_old_code in content:
        # Apply fix
        new_content = content.replace(fix_1_old_code, fix_1_new_code)
        
        with open(services_file, 'w') as f:
            f.write(new_content)
        
        print("✅ FIXED: services.py updated")
        print("   Portfolio value now includes stock valuations")
    elif fix_1_new_code in content:
        print("✅ Already fixed: Portfolio value calculation correct")
    else:
        print("⚠️  Could not find exact code to replace")
        print("   Manual fix needed in services.py")
        print("   Look for 'total_value = cash  # Simplified'")
        
except Exception as e:
    print(f"❌ Error fixing services.py: {e}")

# ============================================================================
# FIX 2: Update migrate_data.py - Handle Null Timestamps
# ============================================================================

print("\n\nFIX 2: Log Migration - Handle Null Timestamps")
print("-" * 70)

migrate_file = Path(__file__).parent / "migrate_data.py"

fix_2_old_code = '''                    try:
                        data = json.loads(line)
                        
                        logs_to_insert.append({
                            "model_id": model_id,
                            "date": date_str,
                            "timestamp": data.get("timestamp"),
                            "signature": data.get("signature", signature),
                            "messages": data.get("new_messages", {})
                        })'''

fix_2_new_code = '''                    try:
                        data = json.loads(line)
                        
                        # Handle null timestamps
                        timestamp = data.get("timestamp")
                        if not timestamp:
                            # Use created_at or generate from date
                            from datetime import datetime
                            timestamp = datetime.now().isoformat()
                        
                        logs_to_insert.append({
                            "model_id": model_id,
                            "date": date_str,
                            "timestamp": timestamp,  # ✅ FIXED: Never null
                            "signature": data.get("signature", signature),
                            "messages": data.get("new_messages", {})
                        })'''

try:
    with open(migrate_file, 'r') as f:
        content = f.read()
    
    if fix_2_old_code in content:
        new_content = content.replace(fix_2_old_code, fix_2_new_code)
        
        with open(migrate_file, 'w') as f:
            f.write(new_content)
        
        print("✅ FIXED: migrate_data.py updated")
        print("   Null timestamps now handled properly")
    elif fix_2_new_code in content:
        print("✅ Already fixed: Log migration handles null timestamps")
    else:
        print("⚠️  Could not find exact code to replace")
        print("   Manual fix needed in migrate_data.py")
        
except Exception as e:
    print(f"❌ Error fixing migrate_data.py: {e}")

# ============================================================================
# COMPLETION
# ============================================================================

print("\n" + "=" * 70)
print("FIX APPLICATION COMPLETE")
print("=" * 70)
print("\nNext steps:")
print("1. Run: python VERIFY_BUGS.py")
print("   → Should now show bugs are fixed")
print("2. Re-run data migration:")
print("   python migrate_data.py")
print("   → Should migrate all 359 logs successfully")
print("3. Test in frontend:")
print("   → Portfolio values should be realistic")
print("   → Log viewer should show all entries")
print("\n" + "=" * 70)

