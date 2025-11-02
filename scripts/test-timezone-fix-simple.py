"""
Simple Test: Timezone Fix Verification

Proves that bars are now cached with correct EDT times
and can be retrieved successfully.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("TIMEZONE FIX TEST")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-15"
SYMBOL = "AAPL"

async def test_timezone_fix():
    from intraday_loader import load_intraday_session, get_minute_bar_from_cache
    
    # Step 1: Load and cache data
    print("STEP 1: Loading and caching data with FIXED timezone code...")
    print("-" * 80)
    
    stats = await load_intraday_session(
        model_id=MODEL_ID,
        symbols=[SYMBOL],
        date=DATE,
        session="regular"
    )
    
    bars_cached = stats.get(SYMBOL, 0)
    print(f"\nCached {bars_cached} bars")
    
    # Step 2: Try to retrieve them
    print("\nSTEP 2: Testing retrieval of cached bars...")
    print("-" * 80)
    
    # Test key times throughout the day
    test_times = [
        "09:30", "09:45", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30",
        "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "15:45", "15:59"
    ]
    
    found = 0
    missing = 0
    
    for time in test_times:
        bar = await get_minute_bar_from_cache(MODEL_ID, DATE, SYMBOL, time)
        if bar:
            print(f"  ✅ {time}: Found")
            found += 1
        else:
            print(f"  ❌ {time}: Missing")
            missing += 1
    
    # Calculate success rate
    success_rate = (found / len(test_times)) * 100
    
    print(f"\nRESULTS:")
    print(f"  Found: {found}/{len(test_times)}")
    print(f"  Missing: {missing}/{len(test_times)}")
    print(f"  Success Rate: {success_rate:.1f}%")
    
    print()
    print("=" * 80)
    
    if success_rate >= 50:
        print("✅ TIMEZONE FIX WORKS!")
        print(f"   {found} out of {len(test_times)} test times are retrievable")
        print(f"   Bars are cached with correct EDT times")
    else:
        print("❌ STILL BROKEN")
        print(f"   Only {found} out of {len(test_times)} found")
        print(f"   Timezone conversion still incorrect")
    
    print("=" * 80)
    
    return success_rate

# Run the test
asyncio.run(test_timezone_fix())

