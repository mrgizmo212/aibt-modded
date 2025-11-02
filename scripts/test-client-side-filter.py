"""
TEST: Client-Side Date Filtering

Fetches trades using cursor (no timestamp filters for proper pagination)
Then filters trades client-side to keep only target date.
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
from intraday_loader import _get_session_timestamp_range, aggregate_to_minute_bars

print("=" * 80)
print("CLIENT-SIDE DATE FILTERING TEST")
print("=" * 80)
print()

DATE = "2025-10-15"
SYMBOL = "AAPL"
SESSION = "regular"

start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)
target_date = datetime.strptime(DATE, "%Y-%m-%d").date()

print(f"Target: {SYMBOL} on {DATE} ({SESSION})")
print(f"Timestamp range: {start_nano} to {end_nano}")
print()

async def test_client_side_filtering():
    print("STEP 1: Fetch ALL trades using cursor (no timestamp filters)")
    print("-" * 80)
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{SYMBOL}"
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    # First page - use timestamp filters to get starting point
    params = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    
    all_trades = []
    
    async with httpx.AsyncClient() as client:
        page = 1
        max_pages = 10
        
        while url and page <= max_pages:
            response = await client.get(url, headers=headers, params=params, timeout=30.0)
            
            if response.status_code != 200:
                print(f"  ❌ Page {page} failed: {response.status_code}")
                break
            
            data = response.json()
            
            if "data" in data and "results" in data["data"]:
                trades = data["data"]["results"]
                all_trades.extend(trades)
                
                print(f"  📄 Page {page}: {len(trades)} trades")
                
                # Check for next page
                next_url_str = data["data"].get("next_url")
                if next_url_str and "cursor=" in next_url_str:
                    import urllib.parse
                    parsed = urllib.parse.urlparse(next_url_str)
                    cursor = urllib.parse.parse_qs(parsed.query).get("cursor", [None])[0]
                    
                    if cursor and page < max_pages:
                        # Use cursor WITHOUT timestamp filters (for proper pagination)
                        url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{SYMBOL}"
                        params = {
                            "cursor": cursor,
                            "limit": 50000
                        }
                        page += 1
                    else:
                        break
                else:
                    break
            else:
                break
    
    print(f"\n✅ Fetched {len(all_trades):,} total trades")
    
    # STEP 2: Analyze dates
    print("\nSTEP 2: Analyze trade dates")
    print("-" * 80)
    
    dates_found = {}
    for trade in all_trades:
        ts_nano = trade.get('participant_timestamp', 0)
        if ts_nano:
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            trade_date = ts_utc.date()
            dates_found[str(trade_date)] = dates_found.get(str(trade_date), 0) + 1
    
    print(f"\nTrades by date:")
    for date_str in sorted(dates_found.keys()):
        count = dates_found[date_str]
        is_target = " ← TARGET" if date_str == str(target_date) else " ← WRONG!"
        print(f"  {date_str}: {count:,} trades{is_target}")
    
    # STEP 3: Filter client-side
    print("\nSTEP 3: Filter trades client-side")
    print("-" * 80)
    
    filtered_trades = []
    for trade in all_trades:
        ts_nano = trade.get('participant_timestamp', 0)
        if start_nano <= ts_nano <= end_nano:
            # Additional date check
            ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
            if ts_utc.date() == target_date:
                filtered_trades.append(trade)
    
    removed = len(all_trades) - len(filtered_trades)
    
    print(f"\nFiltering results:")
    print(f"  Original: {len(all_trades):,} trades")
    print(f"  Filtered: {len(filtered_trades):,} trades (correct date)")
    print(f"  Removed: {removed:,} wrong-date trades")
    
    # STEP 4: Aggregate filtered trades
    print("\nSTEP 4: Aggregate filtered trades to minute bars")
    print("-" * 80)
    
    bars = aggregate_to_minute_bars(filtered_trades)
    
    print(f"\n✅ Created {len(bars)} minute bars")
    
    # Check bar time distribution
    if bars:
        hours = {}
        for bar in bars:
            ts_utc = datetime.fromtimestamp(bar['timestamp'] / 1000, tz=timezone.utc)
            ts_edt = ts_utc.astimezone(timezone(timezone.utc.utcoffset(None) - timezone.utc.utcoffset(None) + datetime.now().astimezone().utcoffset()))
            hour = ts_edt.strftime('%H')
            hours[hour] = hours.get(hour, 0) + 1
        
        print(f"\nBars by hour (EDT):")
        for hour in sorted(hours.keys()):
            print(f"  {hour}:XX - {hours[hour]} bars")
    
    # STEP 5: Final assessment
    print("\nSTEP 5: Assessment")
    print("-" * 80)
    
    expected_bars = 390
    completeness = (len(bars) / expected_bars) * 100
    
    print(f"\nExpected: {expected_bars} bars (full regular session)")
    print(f"Got: {len(bars)} bars")
    print(f"Completeness: {completeness:.1f}%")
    
    print()
    print("=" * 80)
    
    if len(bars) >= 200:
        print("✅ CLIENT-SIDE FILTERING WORKS!")
        print(f"   {len(bars)} usable bars from filtered trades")
        print(f"   Removed {removed:,} wrong-date trades")
        print(f"   Ready for trading!")
    else:
        print(f"❌ STILL BROKEN: Only {len(bars)} bars")
        print(f"   Expected 200+ bars")
    
    print("=" * 80)
    
    return len(bars) >= 200

# Run test
success = asyncio.run(test_client_side_filtering())
print()
if success:
    print("✅ FIX VERIFIED - IMPLEMENT CLIENT-SIDE FILTERING!")
else:
    print("❌ Further debugging needed")

