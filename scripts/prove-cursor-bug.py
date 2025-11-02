"""
PROVE CURSOR BUG: Why AAPL cursor doesn't advance but IBM does

This script will:
1. Fetch first 5 pages of AAPL trades and log cursor values
2. Fetch first 5 pages of IBM trades and log cursor values
3. Compare to find why AAPL cursor gets stuck
4. Test if trades are actually different or identical
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
print("CURSOR BUG DIAGNOSTIC - AAPL vs IBM")
print("=" * 80)
print()

DATE = "2025-10-21"
SESSION = "regular"


def _get_session_timestamp_range(date: str, session: str):
    """Calculate timestamp range (copied from intraday_loader.py)"""
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


async def test_symbol_pagination(symbol: str, max_pages: int = 5):
    """
    Fetch first N pages and analyze cursor behavior
    """
    print(f"\n{'=' * 80}")
    print(f"TESTING: {symbol}")
    print(f"{'=' * 80}\n")
    
    start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
    params = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    page_data = []
    cursor_history = []
    
    async with httpx.AsyncClient() as client:
        page = 1
        
        while url and page <= max_pages:
            print(f"📄 Page {page}")
            print("-" * 80)
            
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
                
                print(f"Trades: {len(trades):,}")
                
                # Log first and last trade timestamps
                if trades:
                    first_ts = trades[0].get('participant_timestamp', 0)
                    last_ts = trades[-1].get('participant_timestamp', 0)
                    
                    first_dt = datetime.fromtimestamp(first_ts / 1e9, tz=timezone.utc)
                    last_dt = datetime.fromtimestamp(last_ts / 1e9, tz=timezone.utc)
                    
                    print(f"First trade: {first_dt.strftime('%H:%M:%S.%f')}")
                    print(f"Last trade:  {last_dt.strftime('%H:%M:%S.%f')}")
                    
                    # Calculate unique trade IDs (to detect duplicates)
                    trade_ids = set()
                    for t in trades:
                        # Create unique ID from timestamp + price + size
                        tid = f"{t.get('participant_timestamp')}_{t.get('price')}_{t.get('size')}"
                        trade_ids.add(tid)
                    
                    print(f"Unique trades: {len(trade_ids):,}")
                
                # Extract cursor
                if "next_url" in data["data"]:
                    next_url_str = data["data"]["next_url"]
                    
                    if "cursor=" in next_url_str:
                        import urllib.parse
                        parsed = urllib.parse.urlparse(next_url_str)
                        cursor = urllib.parse.parse_qs(parsed.query).get("cursor", [None])[0]
                        
                        if cursor:
                            # Show full cursor
                            print(f"\nCursor (full): {cursor}")
                            print(f"Cursor (first 40 chars): {cursor[:40]}...")
                            print(f"Cursor (last 40 chars): ...{cursor[-40:]}")
                            
                            # Check if cursor is same as previous
                            if cursor_history and cursor == cursor_history[-1]:
                                print("🚨 CURSOR IS IDENTICAL TO PREVIOUS PAGE!")
                                print("   This is the bug - cursor should advance")
                            
                            cursor_history.append(cursor)
                            
                            # Store page info
                            page_data.append({
                                'page': page,
                                'cursor': cursor,
                                'trade_count': len(trades),
                                'unique_count': len(trade_ids) if trades else 0,
                                'first_ts': first_ts if trades else None,
                                'last_ts': last_ts if trades else None
                            })
                            
                            # Next request
                            url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
                            params = {"cursor": cursor, "limit": 50000}
                            page += 1
                            print()
                        else:
                            break
                    else:
                        break
                else:
                    print("\n✅ No more pages (no next_url)")
                    break
            else:
                break
    
    # Analysis
    print(f"\n{'=' * 80}")
    print(f"ANALYSIS: {symbol}")
    print(f"{'=' * 80}\n")
    
    print(f"Pages fetched: {len(page_data)}")
    print(f"Cursors captured: {len(cursor_history)}")
    
    # Check for identical cursors
    if len(set(cursor_history)) == 1 and len(cursor_history) > 1:
        print("\n🚨 BUG CONFIRMED!")
        print(f"   All {len(cursor_history)} cursors are IDENTICAL")
        print(f"   Cursor value: {cursor_history[0][:60]}...")
        print("   This proves Polygon API is not advancing the cursor")
    elif len(set(cursor_history)) == len(cursor_history):
        print("\n✅ Cursors are all different")
        print("   Pagination is working correctly")
    else:
        print(f"\n⚠️  Mixed results: {len(set(cursor_history))} unique cursors from {len(cursor_history)} pages")
    
    # Check for duplicate data
    print("\nPage-by-page breakdown:")
    for pd in page_data:
        duplicate_indicator = ""
        if pd['page'] > 1:
            prev = page_data[pd['page'] - 2]
            if (pd['first_ts'] == prev['first_ts'] and 
                pd['last_ts'] == prev['last_ts'] and
                pd['unique_count'] == prev['unique_count']):
                duplicate_indicator = " 🚨 DUPLICATE DATA!"
        
        print(f"  Page {pd['page']}: {pd['trade_count']:,} trades, {pd['unique_count']:,} unique{duplicate_indicator}")
    
    return page_data, cursor_history


async def main():
    print("Testing AAPL (high-volume, cursor stuck)...")
    aapl_data, aapl_cursors = await test_symbol_pagination("AAPL", max_pages=5)
    
    print("\n\n")
    
    print("Testing IBM (low-volume, cursor works)...")
    ibm_data, ibm_cursors = await test_symbol_pagination("IBM", max_pages=5)
    
    # Final comparison
    print(f"\n\n{'=' * 80}")
    print("FINAL COMPARISON")
    print(f"{'=' * 80}\n")
    
    print(f"AAPL:")
    print(f"  Pages: {len(aapl_data)}")
    print(f"  Unique cursors: {len(set(aapl_cursors))}")
    print(f"  Cursor stuck: {'YES 🚨' if len(set(aapl_cursors)) == 1 and len(aapl_cursors) > 1 else 'NO ✅'}")
    
    print(f"\nIBM:")
    print(f"  Pages: {len(ibm_data)}")
    print(f"  Unique cursors: {len(set(ibm_cursors))}")
    print(f"  Cursor stuck: {'YES 🚨' if len(set(ibm_cursors)) == 1 and len(ibm_cursors) > 1 else 'NO ✅'}")
    
    print(f"\n{'=' * 80}")
    print("CONCLUSION")
    print(f"{'=' * 80}\n")
    
    if len(set(aapl_cursors)) == 1 and len(aapl_cursors) > 1:
        print("🚨 BUG CONFIRMED: AAPL cursor does NOT advance")
        print("   Root cause: Polygon API returns same cursor on every page for AAPL")
        print("   This is likely a Polygon API issue or limitation for high-volume symbols")
        print()
        print("Recommended solutions:")
        print("  1. Use /aggs endpoint instead of /trades")
        print("  2. Implement timestamp-based chunking (manual pagination)")
        print("  3. Contact Polygon support about cursor pagination for high-volume symbols")
        print("  4. Implement duplicate detection and skip ahead")
    else:
        print("✅ AAPL cursor advances correctly")
        print("   The issue might be elsewhere in the data pipeline")
    
    print(f"\n{'=' * 80}")


# Run
asyncio.run(main())

