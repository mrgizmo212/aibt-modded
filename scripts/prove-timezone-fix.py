"""
PROVE the timezone bug exists
Then PROVE the fix works

This script:
1. Loads data and caches it
2. Checks what keys are actually stored in Redis
3. Tries to retrieve them
4. Shows the mismatch
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

from intraday_loader import load_intraday_session, get_minute_bar_from_cache
from trading.intraday_agent import _get_session_minutes

print("=" * 80)
print("STEP 1: Load and cache intraday data")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-15"
SYMBOL = "AAPL"
SESSION = "regular"

async def main():
    # Load data
    stats = await load_intraday_session(
        model_id=MODEL_ID,
        symbols=[SYMBOL],
        date=DATE,
        session=SESSION
    )
    
    bars_cached = stats.get(SYMBOL, 0)
    print(f"\nCached {bars_cached} bars")
    
    # Get expected minutes (what we'll try to retrieve)
    expected_minutes = _get_session_minutes(DATE, SESSION)
    
    print(f"\nSTEP 2: Testing retrieval of cached bars...")
    print("-" * 80)
    
    # Test specific times that should exist
    test_times = [
        "09:30",  # Market open
        "09:45",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "15:45",
        "15:59"  # Market close
    ]
    
    found = 0
    missing = 0
    
    for test_time in test_times:
        bar = await get_minute_bar_from_cache(MODEL_ID, DATE, SYMBOL, test_time)
        if bar:
            print(f"  [OK] {test_time}: Found")
            found += 1
        else:
            print(f"  [X]  {test_time}: Missing")
            missing += 1
    
    print(f"\nRESULTS:")
    print(f"  Found: {found}/{len(test_times)}")
    print(f"  Missing: {missing}/{len(test_times)}")
    print(f"  Success Rate: {(found/len(test_times)*100):.1f}%")
    
    print()
    print("=" * 80)
    if found == len(test_times):
        print("[OK] SUCCESS")
        print("   All bars found!")
        print("   Timezone conversion is working correctly")
    elif found < len(test_times) // 2:
        print("[X]  STILL BROKEN")
        print(f"   Only {found} out of {len(test_times)} found")
        print("   Timezone conversion still incorrect")
    else:
        print("[?] PARTIAL SUCCESS")
        print(f"   Found {found} out of {len(test_times)}")
        print("   Some bars are cached correctly, others are not")
    print("=" * 80)

asyncio.run(main())
