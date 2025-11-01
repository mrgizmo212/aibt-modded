#!/usr/bin/env python3
"""
Diagnostic: Trace the COMPLETE data flow to find where bars are lost

Checks:
1. What the proxy returns (raw trades)
2. What aggregation produces (minute bars)  
3. What gets cached in Redis
4. What can be retrieved from Redis

Compares all steps to find the bottleneck
"""

import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from intraday_loader import fetch_all_trades_for_session, aggregate_to_minute_bars, cache_intraday_bars
from utils.redis_client import redis_client

async def main():
    """
    Trace complete flow for a real trading session
    """
    
    print("=" * 80)
    print("🔍 COMPLETE CACHE FLOW DIAGNOSTIC")
    print("=" * 80)
    print()
    
    # Configuration - use recent trading day
    symbol = "IBM"
    date = "2025-10-30"  # Wednesday (definitely a trading day)
    session = "regular"
    model_id = 999  # Test model ID
    
    print(f"📋 Test Configuration:")
    print(f"   Symbol: {symbol}")
    print(f"   Date: {date}")
    print(f"   Session: {session}")
    print(f"   Model ID: {model_id}")
    print()
    
    # ========================================================================
    # STEP 1: Fetch trades from proxy
    # ========================================================================
    print("=" * 80)
    print("STEP 1: Fetch Trades from Proxy")
    print("=" * 80)
    
    trades = await fetch_all_trades_for_session(symbol, date, session)
    
    if not trades:
        print("❌ NO TRADES RETURNED FROM PROXY")
        print()
        print("🔍 This could mean:")
        print("   1. Date is non-trading day (weekend/holiday)")
        print("   2. Symbol invalid")
        print("   3. Proxy authentication issue")
        print("   4. Date in future or too far past")
        return
    
    print(f"\n✅ Proxy returned {len(trades):,} trades")
    
    # Show time coverage
    if trades:
        first_ts = trades[0].get('participant_timestamp', 0) // 1_000_000
        last_ts = trades[-1].get('participant_timestamp', 0) // 1_000_000
        
        first_dt = datetime.fromtimestamp(first_ts / 1000, tz=timezone.utc) - timedelta(hours=4)
        last_dt = datetime.fromtimestamp(last_ts / 1000, tz=timezone.utc) - timedelta(hours=4)
        
        print(f"   Time coverage: {first_dt.strftime('%H:%M')} - {last_dt.strftime('%H:%M')} ET")
    
    # ========================================================================
    # STEP 2: Aggregate to minute bars
    # ========================================================================
    print()
    print("=" * 80)
    print("STEP 2: Aggregate to Minute Bars")
    print("=" * 80)
    
    bars = aggregate_to_minute_bars(trades)
    
    if not bars:
        print("❌ NO BARS CREATED FROM TRADES")
        print("   This is a BUG in aggregate_to_minute_bars()")
        return
    
    print(f"\n✅ Aggregated to {len(bars)} minute bars")
    
    # Show time coverage
    if bars:
        first_bar = bars[0]
        last_bar = bars[-1]
        
        first_ts = datetime.fromtimestamp(first_bar['timestamp'] / 1000, tz=timezone.utc) - timedelta(hours=4)
        last_ts = datetime.fromtimestamp(last_bar['timestamp'] / 1000, tz=timezone.utc) - timedelta(hours=4)
        
        print(f"   Time coverage: {first_ts.strftime('%H:%M')} - {last_ts.strftime('%H:%M')} ET")
        print(f"   First bar: {first_ts.strftime('%H:%M')} - O:{first_bar['open']:.2f} H:{first_bar['high']:.2f} L:{first_bar['low']:.2f} C:{first_bar['close']:.2f} V:{first_bar['volume']:,}")
        print(f"   Last bar:  {last_ts.strftime('%H:%M')} - O:{last_bar['open']:.2f} H:{last_bar['high']:.2f} L:{last_bar['low']:.2f} C:{last_bar['close']:.2f} V:{last_bar['volume']:,}")
    
    # ========================================================================
    # STEP 3: Cache in Redis
    # ========================================================================
    print()
    print("=" * 80)
    print("STEP 3: Cache in Redis")
    print("=" * 80)
    
    cached_count = await cache_intraday_bars(model_id, date, symbol, bars)
    
    print(f"\n📊 Caching Results:")
    print(f"   Bars aggregated: {len(bars)}")
    print(f"   Bars cached: {cached_count}")
    print(f"   Loss: {len(bars) - cached_count} bars")
    
    if cached_count < len(bars):
        print(f"\n⚠️  PROBLEM: {len(bars) - cached_count} bars failed to cache!")
        print("   This is the bottleneck!")
    
    # ========================================================================
    # STEP 4: Verify retrieval from Redis
    # ========================================================================
    print()
    print("=" * 80)
    print("STEP 4: Verify Retrieval from Redis")
    print("=" * 80)
    
    from intraday_loader import get_minute_bar_from_cache
    from trading.intraday_agent import _get_session_minutes
    
    # Get expected minutes
    expected_minutes = _get_session_minutes(date, session)
    
    print(f"   Expected minutes: {len(expected_minutes)}")
    print(f"   First: {expected_minutes[:5]}")
    print(f"   Last: {expected_minutes[-5:]}")
    print()
    
    # Try to retrieve each minute
    found = 0
    missing = []
    
    for minute in expected_minutes:
        bar = await get_minute_bar_from_cache(model_id, date, symbol, minute)
        if bar:
            found += 1
        else:
            missing.append(minute)
    
    print(f"📊 Retrieval Results:")
    print(f"   Expected: {len(expected_minutes)} minutes")
    print(f"   Found in Redis: {found} bars")
    print(f"   Missing: {len(missing)} bars")
    print(f"   Success rate: {(found / len(expected_minutes) * 100):.1f}%")
    
    # ========================================================================
    # STEP 5: Analyze the gap
    # ========================================================================
    print()
    print("=" * 80)
    print("STEP 5: Gap Analysis")
    print("=" * 80)
    print()
    
    # Which minutes have bars from aggregation?
    bar_minutes = set()
    for bar in bars:
        ts_utc = datetime.fromtimestamp(bar['timestamp'] / 1000, tz=timezone.utc)
        ts_et = ts_utc - timedelta(hours=4)  # EDT
        minute_str = ts_et.strftime('%H:%M')
        bar_minutes.add(minute_str)
    
    # Which minutes are we expecting?
    expected_set = set(expected_minutes)
    
    # Gap = expected but not in aggregated bars
    gap_minutes = expected_set - bar_minutes
    
    print(f"🎯 THE GAP:")
    print(f"   Expected minutes: {len(expected_set)}")
    print(f"   Minutes with trades: {len(bar_minutes)}")
    print(f"   Gap (no trades): {len(gap_minutes)} minutes")
    print()
    
    if gap_minutes:
        gap_list = sorted(list(gap_minutes))
        print(f"   Missing minutes (first 20):")
        for m in gap_list[:20]:
            print(f"      {m}")
        
        # Check for patterns
        if len(gap_list) > 20:
            print(f"      ... and {len(gap_list) - 20} more")
        
        # Time range analysis
        print()
        print(f"   Time Distribution:")
        morning = [m for m in gap_list if m < '12:00']
        lunch = [m for m in gap_list if '12:00' <= m < '14:00']
        afternoon = [m for m in gap_list if m >= '14:00']
        
        print(f"      Morning (9:30-12:00): {len(morning)} missing")
        print(f"      Lunch (12:00-14:00): {len(lunch)} missing")
        print(f"      Afternoon (14:00-16:00): {len(afternoon)} missing")
    
    # ========================================================================
    # CONCLUSION
    # ========================================================================
    print()
    print("=" * 80)
    print("🎯 DIAGNOSIS")
    print("=" * 80)
    print()
    
    if len(gap_minutes) == 0:
        print("✅ NO GAPS: All expected minutes have trades!")
        print("   Problem is elsewhere (Redis caching or retrieval)")
    elif len(gap_minutes) < 10:
        print("✅ NORMAL: Few missing minutes (< 3%) is expected")
        print("   IBM occasionally has quiet minutes")
    elif len(gap_minutes) > 50:
        print("⚠️  ABNORMAL: Too many missing minutes for IBM")
        print()
        print("   Possible causes:")
        print("   1. Wrong date (weekend, holiday, or future date)")
        print("   2. Proxy not returning complete data")
        print("   3. Time range issue in proxy request")
        print("   4. IBM was halted this day")
    else:
        print("⚠️  MODERATE GAP: 10-50 missing minutes")
        print("   Could be legitimate (low volume periods)")
        print("   Or could indicate data issue")
    
    print()
    print("=" * 80)
    
    # Cleanup test data from Redis
    print("\n🧹 Cleaning up test data from Redis...")
    # (Redis TTL will auto-expire in 2 hours anyway)

if __name__ == "__main__":
    asyncio.run(main())

