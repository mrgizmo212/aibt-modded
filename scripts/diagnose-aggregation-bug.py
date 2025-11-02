"""
DIAGNOSE: Aggregation Bug

Finds why 50k AAPL trades → 6 bars
but 50k IBM trades → 264 bars
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
print("AGGREGATION BUG DIAGNOSTIC")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-21"
SESSION = "regular"

from intraday_loader import fetch_all_trades_for_session, aggregate_to_minute_bars

async def diagnose_aggregation():
    # Fetch both symbols
    print("Fetching trades for both symbols...")
    print()
    
    aapl_trades = await fetch_all_trades_for_session("AAPL", DATE, SESSION)
    ibm_trades = await fetch_all_trades_for_session("IBM", DATE, SESSION)
    
    print()
    print("=" * 80)
    print("TRADE ANALYSIS")
    print("=" * 80)
    print()
    
    print(f"AAPL: {len(aapl_trades):,} trades")
    print(f"IBM:  {len(ibm_trades):,} trades")
    print()
    
    # Analyze AAPL timestamps
    if aapl_trades:
        print("AAPL Timestamp Analysis:")
        print("-" * 80)
        
        # Get first 10 trades
        print("\nFirst 10 AAPL trades:")
        for i, trade in enumerate(aapl_trades[:10]):
            ts_nano = trade['participant_timestamp']
            ts_ms = ts_nano // 1_000_000
            minute_ms = (ts_ms // 60000) * 60000
            
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            minute_utc = datetime.fromtimestamp(minute_ms / 1000, tz=timezone.utc)
            
            print(f"  {i+1}. {ts_utc.strftime('%H:%M:%S.%f')[:15]} → Minute: {minute_utc.strftime('%H:%M')}")
        
        # Count unique minutes
        aapl_minutes = set()
        for trade in aapl_trades:
            ts_nano = trade['participant_timestamp']
            ts_ms = ts_nano // 1_000_000
            minute_ms = (ts_ms // 60000) * 60000
            aapl_minutes.add(minute_ms)
        
        print(f"\nUnique minutes in AAPL trades: {len(aapl_minutes)}")
        
        # Show minute distribution
        sorted_minutes = sorted(aapl_minutes)
        if len(sorted_minutes) > 0:
            print(f"First minute: {datetime.fromtimestamp(sorted_minutes[0]/1000, tz=timezone.utc).strftime('%H:%M')}")
            print(f"Last minute: {datetime.fromtimestamp(sorted_minutes[-1]/1000, tz=timezone.utc).strftime('%H:%M')}")
    
    print()
    
    # Analyze IBM timestamps
    if ibm_trades:
        print("IBM Timestamp Analysis:")
        print("-" * 80)
        
        # Get first 10 trades
        print("\nFirst 10 IBM trades:")
        for i, trade in enumerate(ibm_trades[:10]):
            ts_nano = trade['participant_timestamp']
            ts_ms = ts_nano // 1_000_000
            minute_ms = (ts_ms // 60000) * 60000
            
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            minute_utc = datetime.fromtimestamp(minute_ms / 1000, tz=timezone.utc)
            
            print(f"  {i+1}. {ts_utc.strftime('%H:%M:%S.%f')[:15]} → Minute: {minute_utc.strftime('%H:%M')}")
        
        # Count unique minutes
        ibm_minutes = set()
        for trade in ibm_trades:
            ts_nano = trade['participant_timestamp']
            ts_ms = ts_nano // 1_000_000
            minute_ms = (ts_ms // 60000) * 60000
            ibm_minutes.add(minute_ms)
        
        print(f"\nUnique minutes in IBM trades: {len(ibm_minutes)}")
        
        # Show minute distribution
        sorted_minutes = sorted(ibm_minutes)
        if len(sorted_minutes) > 0:
            print(f"First minute: {datetime.fromtimestamp(sorted_minutes[0]/1000, tz=timezone.utc).strftime('%H:%M')}")
            print(f"Last minute: {datetime.fromtimestamp(sorted_minutes[-1]/1000, tz=timezone.utc).strftime('%H:%M')}")
    
    # Now aggregate
    print()
    print("=" * 80)
    print("AGGREGATION TEST")
    print("=" * 80)
    print()
    
    aapl_bars = aggregate_to_minute_bars(aapl_trades)
    ibm_bars = aggregate_to_minute_bars(ibm_trades)
    
    print()
    print("=" * 80)
    print("DIAGNOSIS")
    print("=" * 80)
    print()
    
    print(f"AAPL:")
    print(f"  Trades: {len(aapl_trades):,}")
    print(f"  Unique minutes (pre-aggregation): {len(aapl_minutes) if aapl_trades else 0}")
    print(f"  Bars created: {len(aapl_bars)}")
    print()
    
    print(f"IBM:")
    print(f"  Trades: {len(ibm_trades):,}")
    print(f"  Unique minutes (pre-aggregation): {len(ibm_minutes) if ibm_trades else 0}")
    print(f"  Bars created: {len(ibm_bars)}")
    print()
    
    if len(aapl_bars) < len(aapl_minutes) if aapl_trades else 0:
        print("🚨 BUG FOUND IN AGGREGATION!")
        print(f"   AAPL has {len(aapl_minutes) if aapl_trades else 0} unique minutes in raw trades")
        print(f"   But only {len(aapl_bars)} bars created!")
        print(f"   Aggregation is losing data!")
    elif len(aapl_bars) == (len(aapl_minutes) if aapl_trades else 0):
        print("✅ Aggregation preserves all minutes")
        print("   The issue is the raw trade distribution from Polygon")
        print(f"   AAPL genuinely only has {len(aapl_minutes) if aapl_trades else 0} minutes of trading on {DATE}")
    
    print()
    print("=" * 80)

# Run
asyncio.run(diagnose_aggregation())

