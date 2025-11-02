"""
COMPARISON: AAPL vs IBM on Same Date

Finds WHY AAPL gets 6 bars but IBM gets 264 bars
when both use same date and same filtering logic.
"""

import os
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timezone

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("AAPL vs IBM COMPARISON - Find the Difference")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-21"
SESSION = "regular"

from intraday_loader import load_intraday_session

async def compare_symbols():
    # Test AAPL
    print("TEST 1: AAPL on Oct 21")
    print("-" * 80)
    
    stats_aapl = await load_intraday_session(
        model_id=MODEL_ID,
        symbols=["AAPL"],
        date=DATE,
        session=SESSION
    )
    
    aapl_bars = stats_aapl.get("AAPL", 0)
    print(f"\n✅ AAPL: {aapl_bars} bars")
    
    # Test IBM
    print("\n\nTEST 2: IBM on Oct 21")
    print("-" * 80)
    
    stats_ibm = await load_intraday_session(
        model_id=MODEL_ID,
        symbols=["IBM"],
        date=DATE,
        session=SESSION
    )
    
    ibm_bars = stats_ibm.get("IBM", 0)
    print(f"\n✅ IBM: {ibm_bars} bars")
    
    # Compare
    print("\n" + "=" * 80)
    print("COMPARISON")
    print("=" * 80)
    print()
    
    print(f"AAPL: {aapl_bars} bars")
    print(f"IBM:  {ibm_bars} bars")
    print(f"Difference: {abs(ibm_bars - aapl_bars)} bars")
    print()
    
    if aapl_bars < ibm_bars / 2:
        print("🚨 HUGE DIFFERENCE!")
        print("   AAPL has significantly fewer bars than IBM")
        print("   This suggests:")
        print("   1. AAPL trades are being filtered more aggressively")
        print("   2. Or AAPL data is genuinely sparser on this date")
        print("   3. Or there's a symbol-specific bug in our code")
        print()
        print("To investigate:")
        print("  - Check how many trades were fetched for each")
        print("  - Check how many were filtered out")
        print("  - Compare raw Polygon data quality")
    elif abs(aapl_bars - ibm_bars) < 50:
        print("✅ Similar results")
        print("   Both symbols have comparable data")
    else:
        print("⚠️  Moderate difference")
        print("   Some variation expected between symbols")
    
    print()
    print("=" * 80)

# Run
asyncio.run(compare_symbols())

