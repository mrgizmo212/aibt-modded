"""
TEST: Timestamp-Based Pagination as Alternative to Cursors

Instead of relying on Polygon's cursor (which gets stuck for AAPL),
this tests using the last trade's timestamp + 1 nanosecond as the
starting point for the next page.

This should work around the cursor bug entirely.
"""

import os
import sys
import asyncio
import httpx
from pathlib import Path
from datetime import datetime, timezone

backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

from config import settings

print("=" * 80)
print("TIMESTAMP-BASED PAGINATION TEST")
print("=" * 80)
print()

DATE = "2025-10-21"
SESSION = "regular"


def _get_session_timestamp_range(date: str, session: str):
    """Calculate timestamp range"""
    year, month, day = map(int, date.split("-"))
    et_offset = -4
    
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


async def fetch_with_timestamp_pagination(symbol: str, max_pages: int = 10):
    """
    Fetch trades using timestamp-based pagination
    
    Strategy:
    1. Fetch page with timestamp.gte = start
    2. Get last trade's timestamp
    3. Next page: timestamp.gte = last_timestamp + 1 nanosecond
    4. Repeat until we reach end_timestamp or get empty results
    """
    print(f"\n{'=' * 80}")
    print(f"TESTING: {symbol} with Timestamp Pagination")
    print(f"{'=' * 80}\n")
    
    start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    all_trades = []
    current_start = start_nano
    page = 1
    
    async with httpx.AsyncClient() as client:
        while page <= max_pages and current_start < end_nano:
            print(f"📄 Page {page}")
            print("-" * 80)
            
            params = {
                "timestamp.gte": current_start,
                "timestamp.lte": end_nano,
                "limit": 50000,
                "order": "asc"
            }
            
            print(f"Requesting: timestamp.gte = {current_start}")
            
            response = await client.get(
                url,
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                print(f"❌ Request failed: {response.status_code}")
                break
            
            data = response.json()
            
            if "data" in data and "results" in data["data"]:
                trades = data["data"]["results"]
                
                if not trades:
                    print("✅ No more trades (empty page)")
                    break
                
                print(f"Trades: {len(trades):,}")
                
                # Log timestamps
                first_ts = trades[0].get('participant_timestamp', 0)
                last_ts = trades[-1].get('participant_timestamp', 0)
                
                first_dt = datetime.fromtimestamp(first_ts / 1e9, tz=timezone.utc)
                last_dt = datetime.fromtimestamp(last_ts / 1e9, tz=timezone.utc)
                
                print(f"First trade: {first_dt.strftime('%H:%M:%S.%f')}")
                print(f"Last trade:  {last_dt.strftime('%H:%M:%S.%f')}")
                
                # Calculate unique minutes
                unique_minutes = set()
                for t in trades:
                    ts_nano = t.get('participant_timestamp', 0)
                    ts_ms = ts_nano // 1_000_000
                    minute_ms = (ts_ms // 60000) * 60000
                    unique_minutes.add(minute_ms)
                
                print(f"Unique minutes: {len(unique_minutes)}")
                
                all_trades.extend(trades)
                
                # CRITICAL: Set next start to AFTER last trade
                # Add 1 nanosecond to avoid fetching same trade again
                current_start = last_ts + 1
                
                print(f"Next start: {current_start}")
                print(f"Progress: {((current_start - start_nano) / (end_nano - start_nano) * 100):.2f}% through session")
                print()
                
                page += 1
            else:
                print("❌ No data in response")
                break
    
    # Analysis
    print(f"\n{'=' * 80}")
    print(f"RESULTS: {symbol}")
    print(f"{'=' * 80}\n")
    
    print(f"Pages fetched: {page - 1}")
    print(f"Total trades: {len(all_trades):,}")
    
    # Calculate unique minutes
    all_unique_minutes = set()
    for t in all_trades:
        ts_nano = t.get('participant_timestamp', 0)
        ts_ms = ts_nano // 1_000_000
        minute_ms = (ts_ms // 60000) * 60000
        all_unique_minutes.add(minute_ms)
    
    print(f"Unique minutes: {len(all_unique_minutes)}")
    
    if all_trades:
        first_overall = datetime.fromtimestamp(all_trades[0]['participant_timestamp'] / 1e9, tz=timezone.utc)
        last_overall = datetime.fromtimestamp(all_trades[-1]['participant_timestamp'] / 1e9, tz=timezone.utc)
        print(f"Time range: {first_overall.strftime('%H:%M:%S')} - {last_overall.strftime('%H:%M:%S')}")
    
    return all_trades, len(all_unique_minutes)


async def main():
    print("Testing AAPL with timestamp-based pagination...")
    aapl_trades, aapl_minutes = await fetch_with_timestamp_pagination("AAPL", max_pages=10)
    
    print("\n\n")
    
    print("Testing IBM with timestamp-based pagination...")
    ibm_trades, ibm_minutes = await fetch_with_timestamp_pagination("IBM", max_pages=10)
    
    # Comparison
    print(f"\n\n{'=' * 80}")
    print("FINAL COMPARISON")
    print(f"{'=' * 80}\n")
    
    print(f"AAPL:")
    print(f"  Total trades: {len(aapl_trades):,}")
    print(f"  Unique minutes: {aapl_minutes}")
    
    print(f"\nIBM:")
    print(f"  Total trades: {len(ibm_trades):,}")
    print(f"  Unique minutes: {ibm_minutes}")
    
    print(f"\n{'=' * 80}")
    print("CONCLUSION")
    print(f"{'=' * 80}\n")
    
    if aapl_minutes > 100:
        print("✅ SUCCESS! Timestamp-based pagination works for AAPL!")
        print(f"   Got {aapl_minutes} minutes of data (expected ~200+)")
        print()
        print("Recommendation:")
        print("  Replace cursor-based pagination with timestamp-based pagination")
        print("  in backend/intraday_loader.py")
    elif aapl_minutes > 20:
        print("⚠️  PARTIAL SUCCESS")
        print(f"   Got {aapl_minutes} minutes (better than 6, but less than expected 200+)")
        print("   May need to increase max_pages or investigate further")
    else:
        print("❌ FAILED")
        print(f"   Only got {aapl_minutes} minutes (same as cursor-based)")
        print("   The issue might be more fundamental")
    
    print(f"\n{'=' * 80}")


# Run
asyncio.run(main())

