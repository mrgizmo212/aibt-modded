"""
Bug Verification Script
Tests to CONFIRM the identified bugs exist
Run this BEFORE fixing to document the issues
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from services import get_latest_position, get_model_logs
from utils.price_tools import get_open_prices
from dotenv import load_dotenv
load_dotenv()

print("=" * 70)
print("AIBT BUG VERIFICATION SCRIPT")
print("=" * 70)
print("\nTesting identified bugs...\n")

bug_count = 0
pass_count = 0

# ============================================================================
# BUG 1: Portfolio Value Calculation
# ============================================================================

print("BUG 1: Portfolio Value Calculation")
print("-" * 70)

# Test with claude-4.5-sonnet (Model ID 8)
# We know it has:
# - Cash: $18.80
# - Holdings: NVDA:11, MSFT:3, AAPL:4, AMZN:2, AVGO:4, etc.

try:
    import asyncio
    
    async def test_portfolio_value():
        # Admin user ID (from our tests)
        admin_id = "4aa394de-571f-4fde-9484-9ef0b572e9f9"
        
        position = await get_latest_position(8, admin_id)
        
        print(f"Model: {position['model_name']}")
        print(f"Cash: ${position['cash']}")
        print(f"Total Value (current): ${position['total_value']}")
        
        # Count stocks
        positions_dict = position['positions']
        stock_count = sum(1 for symbol, shares in positions_dict.items() 
                         if symbol != 'CASH' and shares > 0)
        
        total_shares = sum(shares for symbol, shares in positions_dict.items() 
                          if symbol != 'CASH' and shares > 0)
        
        print(f"Stock positions: {stock_count} different stocks")
        print(f"Total shares held: {total_shares}")
        
        # The bug: total_value should NOT equal cash if we have stocks!
        if position['total_value'] == position['cash'] and total_shares > 0:
            print("\n❌ BUG CONFIRMED: total_value equals cash despite holding stocks!")
            print(f"   Expected: > ${position['cash']} (should include stock value)")
            print(f"   Actual: ${position['total_value']} (only cash)")
            print(f"   Impact: Leaderboard, metrics, all calculations are wrong!")
            return 1  # Bug found
        else:
            print("\n✅ PASS: Portfolio value includes stocks")
            return 0  # No bug
    
    result = asyncio.run(test_portfolio_value())
    if result == 1:
        bug_count += 1
    else:
        pass_count += 1
    
except Exception as e:
    print(f"\n❌ ERROR testing portfolio value: {e}")
    bug_count += 1

# ============================================================================
# BUG 2: Log Migration
# ============================================================================

print("\n\nBUG 2: Log Migration Success Rate")
print("-" * 70)

try:
    # Count logs in database
    async def test_log_migration():
        admin_id = "4aa394de-571f-4fde-9484-9ef0b572e9f9"
        
        # Check logs for claude-4.5-sonnet (should have 37 from migration)
        logs_result = await get_model_logs(8, admin_id, None)
        db_log_count = logs_result['total_entries']
        
        print(f"Model: claude-4.5-sonnet")
        print(f"Logs in database: {db_log_count}")
        
        # Check JSONL file
        jsonl_log_count = 0
        log_dir = Path(__file__).parent / "data" / "agent_data" / "claude-4.5-sonnet" / "log"
        
        if log_dir.exists():
            for date_dir in log_dir.iterdir():
                if date_dir.is_dir():
                    log_file = date_dir / "log.jsonl"
                    if log_file.exists():
                        with open(log_file, 'r') as f:
                            jsonl_log_count += sum(1 for line in f if line.strip())
        
        print(f"Logs in JSONL files: {jsonl_log_count}")
        
        success_rate = (db_log_count / jsonl_log_count * 100) if jsonl_log_count > 0 else 0
        print(f"Migration success rate: {success_rate:.1f}%")
        
        if success_rate < 90:
            print(f"\n❌ BUG CONFIRMED: Log migration failed!")
            print(f"   Expected: ~{jsonl_log_count} logs migrated")
            print(f"   Actual: {db_log_count} logs migrated")
            print(f"   Missing: {jsonl_log_count - db_log_count} log entries")
            print(f"   Impact: Users cannot see AI reasoning logs!")
            return 1  # Bug found
        else:
            print(f"\n✅ PASS: Log migration successful ({success_rate:.1f}%)")
            return 0  # No bug
    
    result = asyncio.run(test_log_migration())
    if result == 1:
        bug_count += 1
    else:
        pass_count += 1
    
except Exception as e:
    print(f"\n❌ ERROR testing log migration: {e}")
    bug_count += 1

# ============================================================================
# BUG 3: Performance Metrics Accuracy
# ============================================================================

print("\n\nBUG 3: Performance Metrics (Based on Wrong total_value)")
print("-" * 70)

try:
    from utils.result_tools import calculate_all_metrics
    
    metrics = calculate_all_metrics("claude-4.5-sonnet")
    
    print(f"Model: claude-4.5-sonnet")
    print(f"Cumulative Return: {metrics.get('cumulative_return', 0):.4f} ({metrics.get('cumulative_return', 0)*100:.2f}%)")
    print(f"Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.4f}")
    print(f"Max Drawdown: {metrics.get('max_drawdown', 0):.4f} ({metrics.get('max_drawdown', 0)*100:.2f}%)")
    
    portfolio_values = metrics.get('portfolio_values', {})
    if portfolio_values:
        dates = sorted(portfolio_values.keys())
        initial = portfolio_values[dates[0]]
        final = portfolio_values[dates[-1]]
        
        print(f"\nInitial Value: ${initial:,.2f}")
        print(f"Final Value: ${final:,.2f}")
        
        # If final value is suspiciously low (< $100) but we have stocks, metrics are wrong
        if final < 100:
            print(f"\n⚠️  WARNING: Final value suspiciously low!")
            print(f"   This suggests portfolio value calculation is broken")
            print(f"   Metrics are likely incorrect!")
            bug_count += 1
        else:
            print(f"\n✅ PASS: Portfolio values seem reasonable")
            pass_count += 1
    
except Exception as e:
    print(f"\n❌ ERROR testing metrics: {e}")
    bug_count += 1

# ============================================================================
# BUG 4: Data Duplication
# ============================================================================

print("\n\nBUG 4: Data Duplication Check")
print("-" * 70)

data_copies = 0
data_locations = []

# Check if data exists in multiple places
backend_data = Path(__file__).parent / "data" / "agent_data"
if backend_data.exists():
    model_count = len(list(backend_data.iterdir()))
    data_locations.append(f"aibt/backend/data/agent_data ({model_count} models)")
    data_copies += 1

# Note: We can't check aitrtader from here, but document the issue
print("Data found in:")
for loc in data_locations:
    print(f"  - {loc}")

print("\nKnown data locations:")
print("  - aitrtader/data/agent_data (original)")
print("  - aibt/backend/data/agent_data (copy)")
print("  - Supabase PostgreSQL (migrated)")

if data_copies > 0:
    print(f"\n⚠️  WARNING: Data exists in {data_copies + 2} places (including aitrtader + DB)")
    print("   This creates synchronization issues!")
    print("   Recommendation: Pick single source of truth")
    bug_count += 1

# ============================================================================
# RESULTS
# ============================================================================

print("\n" + "=" * 70)
print("BUG VERIFICATION RESULTS")
print("=" * 70)

total_tests = bug_count + pass_count
print(f"\nTotal Tests: {total_tests}")
print(f"❌ Bugs Confirmed: {bug_count}")
print(f"✅ Tests Passed: {pass_count}")

if bug_count > 0:
    print(f"\n🔴 {bug_count} CRITICAL BUGS CONFIRMED!")
    print("\nBugs to fix:")
    print("1. Portfolio value calculation (only shows cash)")
    print("2. Log migration (only 6% success)")
    print("3. Performance metrics (based on wrong values)")
    print("4. Data duplication (3 copies of same data)")
    print("\nRun FIX_BUGS.py after reviewing these issues.")
else:
    print("\n✅ No bugs found! Platform is working correctly.")

print("\n" + "=" * 70)

