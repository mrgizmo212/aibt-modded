"""
PROOF: Pagination Filter Fix

Tests BEFORE and AFTER adding timestamp filters to pagination.
Proves 100% that keeping filters on cursor requests fixes the multi-date bug.
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
print("PAGINATION FILTER FIX - PROOF TEST")
print("=" * 80)
print()

DATE = "2025-10-15"
SYMBOL = "AAPL"
SESSION = "regular"

# Calculate timestamp range
from intraday_loader import _get_session_timestamp_range

start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)

print(f"Testing {SYMBOL} on {DATE} ({SESSION} session)")
print(f"Timestamp range:")
print(f"  Start: {start_nano} ({datetime.fromtimestamp(start_nano/1e9, tz=timezone.utc)})")
print(f"  End:   {end_nano} ({datetime.fromtimestamp(end_nano/1e9, tz=timezone.utc)})")
print()

async def test_current_code():
    """Test CURRENT code (WITHOUT filters on pagination)"""
    print("=" * 80)
    print("TEST 1: CURRENT CODE (Buggy - No filters on pagination)")
    print("=" * 80)
    print()
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{SYMBOL}"
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    # First page WITH filters
    params_page1 = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    
    async with httpx.AsyncClient() as client:
        # Page 1
        response1 = await client.get(url, headers=headers, params=params_page1, timeout=30.0)
        data1 = response1.json()
        
        if "data" not in data1 or "results" not in data1["data"]:
            print("❌ No data from page 1")
            return
        
        trades_page1 = data1["data"]["results"]
        next_url = data1["data"].get("next_url")
        
        print(f"Page 1 (WITH filters):")
        print(f"  Trades: {len(trades_page1)}")
        
        if trades_page1:
            first_ts = trades_page1[0]['participant_timestamp']
            last_ts = trades_page1[-1]['participant_timestamp']
            first_dt = datetime.fromtimestamp(first_ts/1e9, tz=timezone.utc)
            last_dt = datetime.fromtimestamp(last_ts/1e9, tz=timezone.utc)
            print(f"  First: {first_dt.strftime('%Y-%m-%d %H:%M')}")
            print(f"  Last:  {last_dt.strftime('%Y-%m-%d %H:%M')}")
            print(f"  All same date: {first_dt.date() == last_dt.date()}")
        
        # Page 2 WITHOUT filters (current buggy code)
        if next_url and "cursor=" in next_url:
            import urllib.parse
            parsed = urllib.parse.urlparse(next_url)
            cursor = urllib.parse.parse_qs(parsed.query).get("cursor", [None])[0]
            
            # BUGGY: No timestamp filters!
            params_page2 = {"cursor": cursor, "limit": 50000}
            
            print(f"\nPage 2 (WITHOUT filters - BUGGY):")
            print(f"  Cursor: {cursor[:30]}...")
            print(f"  Params: {params_page2}")
            
            response2 = await client.get(url, headers=headers, params=params_page2, timeout=30.0)
            data2 = response2.json()
            
            if "data" in data2 and "results" in data2["data"]:
                trades_page2 = data2["data"]["results"]
                print(f"  Trades: {len(trades_page2)}")
                
                if trades_page2:
                    first_ts = trades_page2[0]['participant_timestamp']
                    last_ts = trades_page2[-1]['participant_timestamp']
                    first_dt = datetime.fromtimestamp(first_ts/1e9, tz=timezone.utc)
                    last_dt = datetime.fromtimestamp(last_ts/1e9, tz=timezone.utc)
                    print(f"  First: {first_dt.strftime('%Y-%m-%d %H:%M')}")
                    print(f"  Last:  {last_dt.strftime('%Y-%m-%d %H:%M')}")
                    
                    # Check if we got wrong-date data
                    target_date = datetime.strptime(DATE, "%Y-%m-%d").date()
                    wrong_dates = sum(1 for t in trades_page2 
                                     if datetime.fromtimestamp(t['participant_timestamp']/1e9, tz=timezone.utc).date() != target_date)
                    
                    if wrong_dates > 0:
                        print(f"  🚨 WRONG DATE TRADES: {wrong_dates}/{len(trades_page2)}")
                        print(f"  ❌ BUG CONFIRMED: Pagination returns wrong-date data!")
                    else:
                        print(f"  ✅ All trades from {DATE}")
    
    print()

async def test_fixed_code():
    """Test FIXED code (WITH filters on pagination)"""
    print("=" * 80)
    print("TEST 2: FIXED CODE (Keep filters on pagination)")
    print("=" * 80)
    print()
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{SYMBOL}"
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    # First page WITH filters
    params_page1 = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    
    async with httpx.AsyncClient() as client:
        # Page 1
        response1 = await client.get(url, headers=headers, params=params_page1, timeout=30.0)
        data1 = response1.json()
        
        if "data" not in data1 or "results" not in data1["data"]:
            print("❌ No data from page 1")
            return
        
        trades_page1 = data1["data"]["results"]
        next_url = data1["data"].get("next_url")
        
        print(f"Page 1 (WITH filters):")
        print(f"  Trades: {len(trades_page1)}")
        
        # Page 2 WITH filters (FIXED)
        if next_url and "cursor=" in next_url:
            import urllib.parse
            parsed = urllib.parse.urlparse(next_url)
            cursor = urllib.parse.parse_qs(parsed.query).get("cursor", [None])[0]
            
            # FIXED: Keep timestamp filters!
            params_page2 = {
                "cursor": cursor,
                "limit": 50000,
                "timestamp.gte": start_nano,  # ← ADDED!
                "timestamp.lte": end_nano,     # ← ADDED!
                "order": "asc"
            }
            
            print(f"\nPage 2 (WITH filters - FIXED):")
            print(f"  Cursor: {cursor[:30]}...")
            print(f"  Params include: timestamp.gte, timestamp.lte")
            
            response2 = await client.get(url, headers=headers, params=params_page2, timeout=30.0)
            data2 = response2.json()
            
            if "data" in data2 and "results" in data2["data"]:
                trades_page2 = data2["data"]["results"]
                print(f"  Trades: {len(trades_page2)}")
                
                if trades_page2:
                    first_ts = trades_page2[0]['participant_timestamp']
                    last_ts = trades_page2[-1]['participant_timestamp']
                    first_dt = datetime.fromtimestamp(first_ts/1e9, tz=timezone.utc)
                    last_dt = datetime.fromtimestamp(last_ts/1e9, tz=timezone.utc)
                    print(f"  First: {first_dt.strftime('%Y-%m-%d %H:%M')}")
                    print(f"  Last:  {last_dt.strftime('%Y-%m-%d %H:%M')}")
                    
                    # Check if we got wrong-date data
                    target_date = datetime.strptime(DATE, "%Y-%m-%d").date()
                    wrong_dates = sum(1 for t in trades_page2 
                                     if datetime.fromtimestamp(t['participant_timestamp']/1e9, tz=timezone.utc).date() != target_date)
                    
                    if wrong_dates > 0:
                        print(f"  🚨 WRONG DATE TRADES: {wrong_dates}/{len(trades_page2)}")
                        print(f"  ❌ FIX FAILED: Still getting wrong-date data")
                    else:
                        print(f"  ✅ ALL trades from {DATE}")
                        print(f"  ✅ FIX WORKS: Filters prevent wrong-date data!")
    
    print()

async def run_tests():
    await test_current_code()
    await test_fixed_code()
    
    print("=" * 80)
    print("CONCLUSION")
    print("=" * 80)
    print()
    print("If Test 1 shows wrong-date trades on page 2,")
    print("and Test 2 shows all correct-date trades,")
    print("then the fix is PROVEN to work!")
    print()
    print("FIX: Add timestamp.gte and timestamp.lte to pagination params")
    print("=" * 80)

# Run
asyncio.run(run_tests())

