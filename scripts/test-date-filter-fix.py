"""
TEST: Date Validation Filter Fix

CURRENT BUG: Polygon returns Oct 31 trades when we request Oct 15
PROPOSED FIX: Filter trades to only include requested date
TEST: Prove filtering works 100%
"""

import os
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timezone, timedelta

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("DATE VALIDATION FILTER FIX TEST")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-15"
SYMBOL = "AAPL"
SESSION = "regular"

from intraday_loader import fetch_all_trades_for_session, aggregate_to_minute_bars

async def test_filter_fix():
    # Fetch trades (will include wrong dates)
    print("STEP 1: Fetch trades from Polygon")
    print("-" * 80)
    
    trades = await fetch_all_trades_for_session(SYMBOL, DATE, SESSION)
    
    print(f"Fetched: {len(trades):,} trades")
    
    # Analyze dates in trades
    print("\nSTEP 2: Analyze trade dates")
    print("-" * 80)
    
    target_date = datetime.strptime(DATE, "%Y-%m-%d").date()
    
    dates_found = {}
    for trade in trades:
        ts_nano = trade.get('participant_timestamp', 0)
        if ts_nano:
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            trade_date = ts_utc.date()
            dates_found[str(trade_date)] = dates_found.get(str(trade_date), 0) + 1
    
    print(f"\nTrades by date:")
    for date_str in sorted(dates_found.keys()):
        count = dates_found[date_str]
        is_target = "(TARGET)" if date_str == str(target_date) else "(WRONG!)"
        print(f"  {date_str}: {count:,} trades {is_target}")
    
    # Filter trades to target date only
    print("\nSTEP 3: Apply date filter")
    print("-" * 80)
    
    filtered_trades = []
    wrong_date_count = 0
    
    for trade in trades:
        ts_nano = trade.get('participant_timestamp', 0)
        if ts_nano:
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            trade_date = ts_utc.date()
            
            if trade_date == target_date:
                filtered_trades.append(trade)
            else:
                wrong_date_count += 1
    
    print(f"\nFiltering results:")
    print(f"  Original trades: {len(trades):,}")
    print(f"  Filtered trades: {len(filtered_trades):,} (correct date)")
    print(f"  Removed: {wrong_date_count:,} (wrong dates)")
    
    # Aggregate filtered trades
    print("\nSTEP 4: Aggregate filtered trades")
    print("-" * 80)
    
    bars = aggregate_to_minute_bars(filtered_trades)
    
    print(f"\nAggregation result:")
    print(f"  Minute bars created: {len(bars)}")
    
    # Check bar time distribution
    hours = {}
    for bar in bars:
        ts_utc = datetime.fromtimestamp(bar['timestamp'] / 1000, tz=timezone.utc)
        ts_edt = ts_utc - timedelta(hours=4)
        hour = ts_edt.strftime('%H')
        hours[hour] = hours.get(hour, 0) + 1
    
    print(f"\nBar distribution by hour (EDT):")
    for hour in sorted(hours.keys()):
        in_session = "IN SESSION" if 9 <= int(hour) <= 15 else "OUT OF SESSION!"
        print(f"  {hour}:XX - {hours[hour]} bars ({in_session})")
    
    # Check for out-of-session bars
    out_of_session = sum(count for hour, count in hours.items() if int(hour) < 9 or int(hour) > 15)
    
    if out_of_session > 0:
        print(f"\n❌ STILL HAS {out_of_session} bars outside session hours!")
        print(f"   Filter didn't work completely")
    else:
        print(f"\n✅ ALL bars are within session hours (09:XX to 15:XX)")
        print(f"   Filter worked perfectly!")
    
    # Expected bars for full session
    print("\nSTEP 5: Completeness check")
    print("-" * 80)
    
    # Regular session has 390 minutes
    expected_bars = 390
    completeness = (len(bars) / expected_bars) * 100
    
    print(f"\nExpected: {expected_bars} bars (full regular session)")
    print(f"Got: {len(bars)} bars")
    print(f"Completeness: {completeness:.1f}%")
    
    if completeness < 50:
        print(f"\n⚠️  LOW COMPLETENESS")
        print(f"   Oct 15 has sparse data from Polygon")
        print(f"   Try a different date with more complete data")
    elif completeness >= 80:
        print(f"\n✅ GOOD COMPLETENESS")
        print(f"   Sufficient data for trading")
    else:
        print(f"\n⚠️  MODERATE COMPLETENESS")
        print(f"   Will work but AI won't have data for all minutes")
    
    print()
    print("=" * 80)
    print("CONCLUSION")
    print("=" * 80)
    print()
    
    if wrong_date_count > 0:
        print(f"✅ DATE FILTER FIX NEEDED:")
        print(f"   Add validation in fetch_all_trades_for_session()")
        print(f"   Filter out {wrong_date_count:,} wrong-date trades")
        print(f"   This will give us {len(filtered_trades):,} clean trades")
        print(f"   Resulting in {len(bars)} usable minute bars")
    else:
        print(f"✅ NO WRONG-DATE TRADES")
        print(f"   The issue is genuine data sparseness for {DATE}")
    
    print()
    print("=" * 80)

# Run test
asyncio.run(test_filter_fix())

