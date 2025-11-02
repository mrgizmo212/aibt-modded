"""
PROVE COMPLETE FIX: End-to-End Timestamp-Based Pagination

This simulates the ENTIRE intraday_loader.py flow with timestamp-based pagination:
1. Fetch trades using timestamp pagination (NOT cursors)
2. Client-side date filtering
3. Aggregate to minute bars
4. Show final results

This proves the fix will work when implemented in backend/intraday_loader.py
"""

import os
import sys
import asyncio
import httpx
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

from config import settings

print("=" * 80)
print("COMPLETE FIX PROOF: Timestamp-Based Pagination")
print("=" * 80)
print()

DATE = "2025-10-21"
SESSION = "regular"


def _get_session_timestamp_range(date: str, session: str):
    """Calculate timestamp range (EDT)"""
    year, month, day = map(int, date.split("-"))
    et_offset = -4  # EDT
    
    if session == "regular":
        start_hour, start_min = 9, 30
        end_hour, end_min = 16, 0
    else:
        raise ValueError(f"Invalid session: {session}")
    
    start_dt = datetime(year, month, day, start_hour - et_offset, start_min, tzinfo=timezone.utc)
    end_dt = datetime(year, month, day, end_hour - et_offset, end_min, tzinfo=timezone.utc)
    
    start_nano = int(start_dt.timestamp() * 1_000_000_000)
    end_nano = int(end_dt.timestamp() * 1_000_000_000)
    
    return start_nano, end_nano


async def fetch_all_trades_timestamp_pagination(
    symbol: str,
    date: str,
    session: str = "regular",
    max_pages: int = 50
) -> List[Dict[str, Any]]:
    """
    FIXED VERSION: Fetch using timestamp-based pagination
    
    This is what we'll implement in backend/intraday_loader.py
    """
    print(f"📡 Fetching {symbol} trades for {date} ({session} session)...")
    
    start_nano, end_nano = _get_session_timestamp_range(date, session)
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    all_trades = []
    current_start = start_nano
    page = 1
    
    async with httpx.AsyncClient() as client:
        while page <= max_pages and current_start < end_nano:
            params = {
                "timestamp.gte": current_start,
                "timestamp.lte": end_nano,
                "limit": 50000,
                "order": "asc"
            }
            
            response = await client.get(
                url,
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                print(f"  ❌ Request failed: {response.status_code}")
                break
            
            data = response.json()
            
            if "data" in data and "results" in data["data"]:
                trades = data["data"]["results"]
                
                if not trades:
                    print(f"  ✅ No more trades (reached end)")
                    break
                
                all_trades.extend(trades)
                
                # Show progress every 5 pages
                if page % 5 == 0 or page == 1:
                    first_dt = datetime.fromtimestamp(trades[0]['participant_timestamp'] / 1e9, tz=timezone.utc)
                    last_dt = datetime.fromtimestamp(trades[-1]['participant_timestamp'] / 1e9, tz=timezone.utc)
                    progress = ((current_start - start_nano) / (end_nano - start_nano) * 100)
                    print(f"  📄 Page {page}: {len(trades):,} trades | {first_dt.strftime('%H:%M')} - {last_dt.strftime('%H:%M')} | {progress:.1f}% complete")
                
                # CRITICAL: Advance timestamp to AFTER last trade
                last_ts = trades[-1]['participant_timestamp']
                current_start = last_ts + 1
                
                page += 1
            else:
                break
    
    print(f"  ✅ Total trades fetched: {len(all_trades):,}")
    return all_trades


def client_side_date_filter(trades: List[Dict[str, Any]], date: str, start_nano: int, end_nano: int) -> List[Dict[str, Any]]:
    """
    Client-side filtering to remove wrong-date trades
    (Same as current implementation)
    """
    print(f"  🔍 Filtering trades to match target date...")
    
    target_date = datetime.strptime(date, "%Y-%m-%d").date()
    filtered_trades = []
    wrong_date_count = 0
    
    for trade in trades:
        ts_nano = trade.get('participant_timestamp', 0)
        if start_nano <= ts_nano <= end_nano:
            # Additional date validation
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            if ts_utc.date() == target_date:
                filtered_trades.append(trade)
            else:
                wrong_date_count += 1
        else:
            wrong_date_count += 1
    
    if wrong_date_count > 0:
        print(f"  🗑️  Filtered out {wrong_date_count:,} wrong-date trades")
    
    print(f"  ✅ Clean trades: {len(filtered_trades):,} (from {date})")
    
    return filtered_trades


def aggregate_to_minute_bars(trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Aggregate trades to minute bars
    (Same as current implementation)
    """
    if not trades:
        return []
    
    sorted_trades = sorted(trades, key=lambda t: t.get('participant_timestamp', 0))
    
    minute_bars = {}
    
    for trade in sorted_trades:
        timestamp_nano = trade.get('participant_timestamp', 0)
        timestamp_ms = timestamp_nano // 1_000_000
        minute_ms = (timestamp_ms // 60000) * 60000
        
        price = trade.get('price', 0)
        size = trade.get('size', 0)
        
        if minute_ms not in minute_bars:
            minute_bars[minute_ms] = {
                'timestamp': minute_ms,
                'open': price,
                'high': price,
                'low': price,
                'close': price,
                'volume': size
            }
        else:
            bar = minute_bars[minute_ms]
            bar['high'] = max(bar['high'], price)
            bar['low'] = min(bar['low'], price)
            bar['close'] = price
            bar['volume'] += size
    
    bars = sorted(minute_bars.values(), key=lambda b: b['timestamp'])
    
    print(f"  📊 Aggregated {len(trades):,} trades → {len(bars)} minute bars")
    
    return bars


async def test_complete_flow(symbol: str):
    """
    Test the COMPLETE flow with timestamp pagination
    """
    print(f"\n{'=' * 80}")
    print(f"TESTING: {symbol} - Complete Flow")
    print(f"{'=' * 80}\n")
    
    start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)
    
    # Step 1: Fetch with timestamp pagination
    print("STEP 1: Fetch trades (timestamp-based pagination)")
    print("-" * 80)
    trades = await fetch_all_trades_timestamp_pagination(symbol, DATE, SESSION, max_pages=50)
    
    # Step 2: Client-side filtering
    print()
    print("STEP 2: Client-side date filtering")
    print("-" * 80)
    clean_trades = client_side_date_filter(trades, DATE, start_nano, end_nano)
    
    # Step 3: Aggregate to bars
    print()
    print("STEP 3: Aggregate to minute bars")
    print("-" * 80)
    bars = aggregate_to_minute_bars(clean_trades)
    
    # Show time range
    if bars:
        first_bar = bars[0]
        last_bar = bars[-1]
        
        first_dt = datetime.fromtimestamp(first_bar['timestamp'] / 1000, tz=timezone.utc)
        last_dt = datetime.fromtimestamp(last_bar['timestamp'] / 1000, tz=timezone.utc)
        
        # Convert to EDT for display
        edt_tz = timezone(timedelta(hours=-4))
        first_edt = first_dt.astimezone(edt_tz)
        last_edt = last_dt.astimezone(edt_tz)
        
        print(f"  📅 Date: {DATE}")
        print(f"  ⏰ Time range: {first_edt.strftime('%H:%M')} - {last_edt.strftime('%H:%M')} EDT")
        print(f"  📊 Total bars: {len(bars)}")
    
    return {
        'trades_fetched': len(trades),
        'trades_clean': len(clean_trades),
        'bars': len(bars),
        'bars_list': bars
    }


async def main():
    print("This proves the timestamp-based pagination fix works end-to-end")
    print()
    
    # Test AAPL
    aapl_results = await test_complete_flow("AAPL")
    
    print("\n\n")
    
    # Test IBM
    ibm_results = await test_complete_flow("IBM")
    
    # Final comparison
    print(f"\n\n{'=' * 80}")
    print("FINAL RESULTS")
    print(f"{'=' * 80}\n")
    
    print("AAPL:")
    print(f"  Trades fetched: {aapl_results['trades_fetched']:,}")
    print(f"  Trades clean: {aapl_results['trades_clean']:,}")
    print(f"  Minute bars: {aapl_results['bars']}")
    
    print()
    print("IBM:")
    print(f"  Trades fetched: {ibm_results['trades_fetched']:,}")
    print(f"  Trades clean: {ibm_results['trades_clean']:,}")
    print(f"  Minute bars: {ibm_results['bars']}")
    
    print()
    print(f"{'=' * 80}")
    print("PROOF OF FIX")
    print(f"{'=' * 80}\n")
    
    # Success criteria
    aapl_success = aapl_results['bars'] >= 200
    ibm_success = ibm_results['bars'] >= 250
    
    if aapl_success and ibm_success:
        print("✅ SUCCESS! Timestamp-based pagination fix WORKS!")
        print()
        print(f"   AAPL: {aapl_results['bars']} bars (expected 200+) ✅")
        print(f"   IBM:  {ibm_results['bars']} bars (expected 250+) ✅")
        print()
        print("🎯 This proves the fix will work when implemented in:")
        print("   backend/intraday_loader.py - fetch_all_trades_for_session()")
        print()
        print("📋 Changes needed:")
        print("   1. Replace cursor extraction logic (lines 76-96)")
        print("   2. Add timestamp advancement: current_start = last_ts + 1")
        print("   3. Loop condition: while current_start < end_nano and page < max_pages")
        print()
        print("✅ READY TO IMPLEMENT!")
    else:
        print("❌ UNEXPECTED RESULTS")
        if not aapl_success:
            print(f"   AAPL: Only {aapl_results['bars']} bars (expected 200+)")
        if not ibm_success:
            print(f"   IBM: Only {ibm_results['bars']} bars (expected 250+)")
        print()
        print("⚠️  Need further investigation before implementing")
    
    print(f"\n{'=' * 80}")


# Run
asyncio.run(main())


