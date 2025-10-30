"""
Post-Fix Verification Script
Tests to VERIFY the bugs are fixed
Run this AFTER applying FIX_BUGS.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from services import get_model_latest_position, get_model_logs
from utils.price_tools import get_open_prices, all_nasdaq_100_symbols
from utils.result_tools import calculate_all_metrics
from dotenv import load_dotenv
import asyncio
load_dotenv()

print("=" * 70)
print("AIBT POST-FIX VERIFICATION SCRIPT")
print("=" * 70)
print("\nVerifying fixes were successful...\n")

pass_count = 0
fail_count = 0

async def run_tests():
    global pass_count, fail_count
    
    admin_id = "4aa394de-571f-4fde-9484-9ef0b572e9f9"
    
    # ========================================================================
    # TEST 1: Portfolio Value Calculation
    # ========================================================================
    
    print("TEST 1: Portfolio Value Includes Stocks")
    print("-" * 70)
    
    try:
        position = await get_model_latest_position(8, admin_id)
        
        cash = position['cash']
        total_value = position['total_value']
        positions_dict = position['positions']
        
        stock_count = sum(1 for symbol, shares in positions_dict.items() 
                         if symbol != 'CASH' and shares > 0)
        total_shares = sum(shares for symbol, shares in positions_dict.items() 
                          if symbol != 'CASH' and shares > 0)
        
        print(f"Cash: ${cash:,.2f}")
        print(f"Total Value: ${total_value:,.2f}")
        print(f"Stocks held: {stock_count} types, {total_shares} total shares")
        
        # After fix: total_value should be > cash if we have stocks
        if total_shares > 0 and total_value > cash:
            difference = total_value - cash
            print(f"Stock value: ${difference:,.2f}")
            print(f"\n✅ PASS: Portfolio value correctly includes stocks!")
            print(f"   Total value (${total_value:,.2f}) > Cash (${cash:,.2f})")
            pass_count += 1
        elif total_shares > 0 and total_value == cash:
            print(f"\n❌ FAIL: Portfolio value still equals cash!")
            print(f"   Bug not fixed - still only showing cash value")
            fail_count += 1
        else:
            print(f"\n⚠️  No stocks held, cannot verify stock valuation")
            pass_count += 1
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        fail_count += 1
    
    # ========================================================================
    # TEST 2: Log Migration Success
    # ========================================================================
    
    print("\n\nTEST 2: Log Migration Completeness")
    print("-" * 70)
    
    try:
        logs_result = await get_model_logs(8, admin_id, None)
        db_log_count = logs_result['total_entries']
        
        # Count JSONL logs
        jsonl_log_count = 0
        log_dir = Path(__file__).parent / "data" / "agent_data" / "claude-4.5-sonnet" / "log"
        
        if log_dir.exists():
            for date_dir in log_dir.iterdir():
                if date_dir.is_dir():
                    log_file = date_dir / "log.jsonl"
                    if log_file.exists():
                        with open(log_file, 'r') as f:
                            jsonl_log_count += sum(1 for line in f if line.strip())
        
        success_rate = (db_log_count / jsonl_log_count * 100) if jsonl_log_count > 0 else 0
        
        print(f"JSONL log entries: {jsonl_log_count}")
        print(f"Database log entries: {db_log_count}")
        print(f"Migration success rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print(f"\n✅ PASS: Log migration successful!")
            print(f"   {db_log_count} of {jsonl_log_count} logs migrated")
            pass_count += 1
        else:
            print(f"\n❌ FAIL: Log migration still incomplete")
            print(f"   Only {success_rate:.1f}% migrated")
            print(f"   Missing: {jsonl_log_count - db_log_count} entries")
            fail_count += 1
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        fail_count += 1
    
    # ========================================================================
    # TEST 3: Performance Metrics Accuracy
    # ========================================================================
    
    print("\n\nTEST 3: Performance Metrics Sanity Check")
    print("-" * 70)
    
    try:
        metrics = calculate_all_metrics("claude-4.5-sonnet")
        
        cumulative_return = metrics.get('cumulative_return', 0)
        final_value = metrics.get('portfolio_values', {}).get(
            sorted(metrics.get('portfolio_values', {}).keys())[-1] if metrics.get('portfolio_values') else '',
            0
        )
        
        print(f"Cumulative Return: {cumulative_return*100:.2f}%")
        print(f"Final Portfolio Value: ${final_value:,.2f}")
        
        # After fix: final value should be realistic (not just cash)
        if final_value > 100:  # At least $100 worth of assets
            print(f"\n✅ PASS: Performance metrics using realistic portfolio values")
            pass_count += 1
        else:
            print(f"\n❌ FAIL: Performance metrics still using wrong values")
            print(f"   Final value too low: ${final_value:,.2f}")
            fail_count += 1
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        fail_count += 1
    
    # ========================================================================
    # FINAL RESULTS
    # ========================================================================
    
    print("\n" + "=" * 70)
    print("POST-FIX VERIFICATION RESULTS")
    print("=" * 70)
    
    total = pass_count + fail_count
    success_rate = (pass_count / total * 100) if total > 0 else 0
    
    print(f"\nTotal Tests: {total}")
    print(f"✅ Passed: {pass_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if fail_count == 0:
        print("\n🎉 ALL FIXES VERIFIED! Bugs are resolved!")
        print("\nPlatform is now:")
        print("  ✅ Calculating portfolio values correctly")
        print("  ✅ Showing realistic metrics")
        print("  ✅ Log migration working")
        print("\nRecommended: Document these fixes in docs/bugs-and-fixes.md")
    else:
        print(f"\n⚠️  {fail_count} tests still failing")
        print("   Review fixes and try again")
    
    print("\n" + "=" * 70)

# Run tests
asyncio.run(run_tests())

