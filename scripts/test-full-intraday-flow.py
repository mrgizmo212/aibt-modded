"""
COMPREHENSIVE INTRADAY FLOW TEST

Traces the complete data flow from Polygon → Aggregation → Upstash → Supabase
Shows EXACTLY what's happening at each step to find the bug.
"""

import os
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("COMPREHENSIVE INTRADAY FLOW TEST")
print("=" * 80)
print()

# Test parameters
MODEL_ID = 169
DATE = "2025-10-15"
SYMBOL = "AAPL"
SESSION = "regular"

print(f"Testing Parameters:")
print(f"  Model ID: {MODEL_ID}")
print(f"  Date: {DATE}")
print(f"  Symbol: {SYMBOL}")
print(f"  Session: {SESSION}")
print()

# ============================================================================
# STEP 1: FETCH FROM POLYGON PROXY
# ============================================================================

print("=" * 80)
print("STEP 1: FETCH FROM POLYGON PROXY")
print("=" * 80)
print()

from intraday_loader import fetch_all_trades_for_session

async def test_fetch_trades():
    print(f"Fetching trades for {SYMBOL} on {DATE}...")
    
    trades = await fetch_all_trades_for_session(SYMBOL, DATE, SESSION)
    
    print(f"\n✅ Fetched {len(trades):,} trades from Polygon")
    
    if len(trades) > 0:
        # Show first trade
        first_trade = trades[0]
        print(f"\nFirst Trade:")
        print(f"  Timestamp (nano): {first_trade.get('participant_timestamp')}")
        print(f"  Price: ${first_trade.get('price')}")
        print(f"  Size: {first_trade.get('size')}")
        
        # Convert timestamp to readable format
        ts_nano = first_trade.get('participant_timestamp')
        ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
        print(f"  Time (UTC): {ts_utc}")
        print(f"  Time (EDT): {ts_utc - timedelta(hours=4)}")
        
        # Show last trade
        last_trade = trades[-1]
        ts_nano_last = last_trade.get('participant_timestamp')
        ts_utc_last = datetime.fromtimestamp(ts_nano_last / 1e9, tz=timezone.utc)
        print(f"\nLast Trade:")
        print(f"  Time (UTC): {ts_utc_last}")
        print(f"  Time (EDT): {ts_utc_last - timedelta(hours=4)}")
        print(f"  Price: ${last_trade.get('price')}")
    else:
        print(f"❌ No trades fetched!")
        return []
    
    return trades

# ============================================================================
# STEP 2: AGGREGATE TO MINUTE BARS
# ============================================================================

print("\n" + "=" * 80)
print("STEP 2: AGGREGATE TO MINUTE BARS")
print("=" * 80)
print()

from intraday_loader import aggregate_to_minute_bars

async def test_aggregation(trades):
    if not trades:
        print("⚠️  Skipping - no trades to aggregate")
        return []
    
    print(f"Aggregating {len(trades):,} trades to minute bars...")
    
    bars = aggregate_to_minute_bars(trades)
    
    print(f"\n✅ Created {len(bars)} minute bars")
    
    if len(bars) > 0:
        # Show first bar
        first_bar = bars[0]
        ts_ms = first_bar['timestamp']
        ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
        
        print(f"\nFirst Bar:")
        print(f"  Timestamp (ms): {ts_ms}")
        print(f"  Time (UTC): {ts_utc.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Time (EDT raw): {(ts_utc - timedelta(hours=4)).strftime('%H:%M')}")
        print(f"  Open: ${first_bar['open']}")
        print(f"  Close: ${first_bar['close']}")
        print(f"  Volume: {first_bar['volume']}")
        
        # Show last bar
        last_bar = bars[-1]
        ts_ms_last = last_bar['timestamp']
        ts_utc_last = datetime.fromtimestamp(ts_ms_last / 1000, tz=timezone.utc)
        
        print(f"\nLast Bar:")
        print(f"  Time (UTC): {ts_utc_last.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Time (EDT raw): {(ts_utc_last - timedelta(hours=4)).strftime('%H:%M')}")
        print(f"  Close: ${last_bar['close']}")
        
        # Show bar distribution
        print(f"\nBar Distribution:")
        hours = {}
        for bar in bars:
            ts = datetime.fromtimestamp(bar['timestamp'] / 1000, tz=timezone.utc)
            ts_edt = ts - timedelta(hours=4)
            hour = ts_edt.strftime('%H')
            hours[hour] = hours.get(hour, 0) + 1
        
        for hour in sorted(hours.keys()):
            print(f"  {hour}:XX - {hours[hour]} bars")
    
    return bars

# ============================================================================
# STEP 3: CACHE IN UPSTASH REDIS
# ============================================================================

print("\n" + "=" * 80)
print("STEP 3: CACHE IN UPSTASH REDIS")
print("=" * 80)
print()

from intraday_loader import cache_intraday_bars

async def test_caching(bars):
    if not bars:
        print("⚠️  Skipping - no bars to cache")
        return 0
    
    print(f"Caching {len(bars)} bars in Redis...")
    print(f"  Model ID: {MODEL_ID}")
    print(f"  Date: {DATE}")
    print(f"  Symbol: {SYMBOL}")
    print()
    
    # This will use our timezone conversion code
    cached = await cache_intraday_bars(MODEL_ID, DATE, SYMBOL, bars)
    
    print(f"\n✅ cache_intraday_bars() returned: {cached}")
    print(f"   Claimed to cache {cached} out of {len(bars)} bars")
    
    return cached

# ============================================================================
# STEP 4: RETRIEVE FROM CACHE
# ============================================================================

print("\n" + "=" * 80)
print("STEP 4: RETRIEVE FROM CACHE")
print("=" * 80)
print()

from intraday_loader import get_minute_bar_from_cache
from trading.intraday_agent import _get_session_minutes

async def test_retrieval(cached_count):
    print(f"Testing retrieval of {cached_count} cached bars...")
    print()
    
    # Get expected minutes
    expected_minutes = _get_session_minutes(DATE, SESSION)
    print(f"Expected {len(expected_minutes)} minutes for {SESSION} session")
    print(f"  First 5: {expected_minutes[:5]}")
    print(f"  Last 5: {expected_minutes[-5:]}")
    print()
    
    # Try to retrieve all expected minutes
    found = []
    missing = []
    
    print(f"Retrieving all {len(expected_minutes)} expected minutes...")
    for idx, minute in enumerate(expected_minutes):
        bar = await get_minute_bar_from_cache(MODEL_ID, DATE, SYMBOL, minute)
        
        if bar:
            found.append((minute, bar))
            if len(found) <= 5 or idx >= len(expected_minutes) - 5:
                print(f"  ✅ {minute}: Found (close: ${bar.get('close')})")
        else:
            missing.append(minute)
            if len(missing) <= 10:
                print(f"  ❌ {minute}: Missing")
    
    print(f"\n📊 Retrieval Results:")
    print(f"  Found: {len(found)}/{len(expected_minutes)} ({(len(found)/len(expected_minutes)*100):.1f}%)")
    print(f"  Missing: {len(missing)}/{len(expected_minutes)}")
    
    if len(found) < cached_count:
        print(f"\n⚠️  MISMATCH DETECTED:")
        print(f"  Cached: {cached_count} bars")
        print(f"  Retrieved: {len(found)} bars")
        print(f"  Lost: {cached_count - len(found)} bars!")
        print(f"\n  This means bars are being cached with WRONG keys!")
    
    return found, missing

# ============================================================================
# STEP 5: CHECK SUPABASE DATABASE
# ============================================================================

print("\n" + "=" * 80)
print("STEP 5: CHECK SUPABASE DATABASE")
print("=" * 80)
print()

from supabase import create_client
from config import settings

async def check_database():
    print(f"Checking what's in Supabase for model {MODEL_ID}...")
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # Check latest run
    runs = supabase.table("trading_runs")\
        .select("*")\
        .eq("model_id", MODEL_ID)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    
    if runs.data:
        run = runs.data[0]
        print(f"\n✅ Latest Run:")
        print(f"  Run #: {run['run_number']}")
        print(f"  Status: {run['status']}")
        print(f"  Trading Mode: {run['trading_mode']}")
        print(f"  Total Trades: {run['total_trades']}")
        print(f"  Final Value: ${run['final_portfolio_value']}")
        
        # Check positions for this run
        positions = supabase.table("positions")\
            .select("*")\
            .eq("run_id", run['id'])\
            .execute()
        
        print(f"\n  Positions: {len(positions.data) if positions.data else 0}")
        if positions.data:
            for pos in positions.data[:5]:
                print(f"    {pos.get('minute_time', pos.get('date'))}: {pos.get('action_type')} {pos.get('symbol')} @ ${pos.get('cash'):.2f}")
    else:
        print(f"❌ No runs found for model {MODEL_ID}")

# ============================================================================
# RUN ALL TESTS
# ============================================================================

async def run_all_tests():
    try:
        # Step 1: Fetch
        trades = await test_fetch_trades()
        
        # Step 2: Aggregate
        bars = await test_aggregation(trades)
        
        # Step 3: Cache
        cached = await test_caching(bars)
        
        # Step 4: Retrieve
        found, missing = await test_retrieval(cached)
        
        # Step 5: Database
        await check_database()
        
        # Final Summary
        print()
        print("=" * 80)
        print("FINAL DIAGNOSIS")
        print("=" * 80)
        print()
        print(f"Polygon Proxy → {len(trades):,} trades")
        print(f"Aggregation → {len(bars)} minute bars")
        print(f"Upstash Cache → {cached} bars claimed cached")
        print(f"Retrieval → {len(found)} bars actually retrievable")
        print()
        
        if len(found) < cached:
            print(f"🐛 BUG FOUND!")
            print(f"   {cached} bars claimed cached")
            print(f"   Only {len(found)} are retrievable")
            print(f"   {cached - len(found)} bars LOST!")
            print()
            print(f"Likely causes:")
            print(f"  1. Timezone conversion creating wrong cache keys")
            print(f"  2. Upstash accepting but not storing")
            print(f"  3. Cache keys don't match retrieval keys")
        elif len(found) == cached:
            print(f"✅ Perfect match! All {cached} bars are retrievable!")
        
        print()
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

# Execute
asyncio.run(run_all_tests())

