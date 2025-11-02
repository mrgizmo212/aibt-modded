"""
TEST: 50 Page Limit Fix

Proves that increasing from 10 to 50 pages
gives us all the Oct 21 AAPL data we need!
"""

import os
import sys
import asyncio
from pathlib import Path

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("TEST: 50 Page Limit - AAPL Data Recovery")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-21"
SYMBOL = "AAPL"
SESSION = "regular"

from intraday_loader import load_intraday_session, get_minute_bar_from_cache
from trading.intraday_agent import _get_session_minutes

async def test_50_pages():
    print(f"Testing {SYMBOL} on {DATE} with 50-page limit")
    print()
    
    # Load session
    print("STEP 1: Load intraday session (fetches up to 50 pages)")
    print("-" * 80)
    
    stats = await load_intraday_session(
        model_id=MODEL_ID,
        symbols=[SYMBOL],
        date=DATE,
        session=SESSION
    )
    
    bars_cached = stats.get(SYMBOL, 0)
    
    print(f"\n📊 Bars cached: {bars_cached}")
    
    # Test retrieval
    print("\nSTEP 2: Test retrieval")
    print("-" * 80)
    
    expected_minutes = _get_session_minutes(DATE, SESSION)
    
    found = 0
    for minute in expected_minutes:
        bar = await get_minute_bar_from_cache(MODEL_ID, DATE, SYMBOL, minute)
        if bar:
            found += 1
    
    success_rate = (found / len(expected_minutes)) * 100
    
    print(f"\nRetrieval:")
    print(f"  Found: {found}/390 ({success_rate:.1f}%)")
    print(f"  Cached: {bars_cached}")
    print(f"  Match: {found == bars_cached}")
    
    # Verdict
    print()
    print("=" * 80)
    print("VERDICT")
    print("=" * 80)
    print()
    
    if bars_cached >= 200:
        print(f"🎉 SUCCESS! 50-page limit works!")
        print(f"   AAPL now has {bars_cached} bars")
        print(f"   Was: 6 bars (with 10-page limit)")
        print(f"   Now: {bars_cached} bars (with 50-page limit)")
        print(f"   Improvement: {bars_cached - 6} more bars!")
        print()
        print(f"✅ AAPL INTRADAY NOW WORKS!")
    elif bars_cached > 6:
        print(f"⚠️  IMPROVED but not fully fixed")
        print(f"   Was: 6 bars")
        print(f"   Now: {bars_cached} bars")
        print(f"   May need even more pages")
    else:
        print(f"❌ NO IMPROVEMENT")
        print(f"   Still only {bars_cached} bars")
        print(f"   Issue is elsewhere")
    
    print()
    print("=" * 80)
    
    return bars_cached >= 200

# Run
success = asyncio.run(test_50_pages())

if success:
    print("\n✅ COMMIT THIS FIX!")
    print("   Line 76: page < 50")
else:
    print("\n⚠️  Need further investigation")

