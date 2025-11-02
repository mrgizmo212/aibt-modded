"""
DEBUG: What Are We Filtering Out?

Shows EXACTLY what trades we're keeping vs throwing away for AAPL.
Finds if we're mistakenly filtering valid Oct 21 AAPL trades!
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
print("DEBUG: What Trades Are We Filtering Out?")
print("=" * 80)
print()

MODEL_ID = 169
DATE = "2025-10-21"
SYMBOL = "AAPL"
SESSION = "regular"

from intraday_loader import fetch_all_trades_for_session, _get_session_timestamp_range

async def debug_filtering():
    start_nano, end_nano = _get_session_timestamp_range(DATE, SESSION)
    target_date = datetime.strptime(DATE, "%Y-%m-%d").date()
    
    print(f"Target: {SYMBOL} on {DATE}")
    print(f"Timestamp range: {start_nano} to {end_nano}")
    print(f"Target date: {target_date}")
    print()
    
    # Fetch WITHOUT our custom filtering (using original function)
    print("Fetching trades...")
    print()
    
    # Manually fetch to see what comes back
    import httpx
    from config import settings
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{SYMBOL}"
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    params = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params, timeout=30.0)
        data = response.json()
        
        if "data" in data and "results" in data["data"]:
            first_page_trades = data["data"]["results"]
            
            print(f"First page: {len(first_page_trades)} trades")
            print()
            
            # Analyze ALL trades on first page
            dates_in_first_page = {}
            times_in_first_page = {}
            
            for trade in first_page_trades:
                ts_nano = trade['participant_timestamp']
                ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
                
                date_str = str(ts_utc.date())
                time_str = ts_utc.strftime('%H:%M')
                
                dates_in_first_page[date_str] = dates_in_first_page.get(date_str, 0) + 1
                times_in_first_page[time_str] = times_in_first_page.get(time_str, 0) + 1
            
            print("Dates in FIRST PAGE (before filtering):")
            for d in sorted(dates_in_first_page.keys()):
                marker = "✅ TARGET" if d == str(target_date) else "❌ WRONG!"
                print(f"  {d}: {dates_in_first_page[d]:,} trades {marker}")
            
            print()
            print(f"Times in FIRST PAGE (first 20):")
            for t in sorted(times_in_first_page.keys())[:20]:
                print(f"  {t}: {times_in_first_page[t]} trades")
            
            print()
            
            # Now apply OUR filtering logic
            kept = []
            filtered_out = []
            
            for trade in first_page_trades:
                ts_nano = trade['participant_timestamp']
                
                # Our filter logic
                if start_nano <= ts_nano <= end_nano:
                    ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
                    if ts_utc.date() == target_date:
                        kept.append(trade)
                    else:
                        filtered_out.append((trade, f"Wrong date: {ts_utc.date()}"))
                else:
                    filtered_out.append((trade, "Outside timestamp range"))
            
            print(f"Our filtering on first page:")
            print(f"  Kept: {len(kept)} trades")
            print(f"  Filtered out: {len(filtered_out)} trades")
            print()
            
            if filtered_out:
                print("Sample of filtered out trades:")
                for trade, reason in filtered_out[:10]:
                    ts_nano = trade['participant_timestamp']
                    ts_utc = datetime.fromtimestamp(ts_nano / 1e9, tz=timezone.utc)
                    print(f"  {ts_utc} - {reason}")
            
            print()
            print("=" * 80)
            print("VERDICT")
            print("=" * 80)
            print()
            
            if len(kept) < len(first_page_trades) / 2:
                print("🚨 WE'RE FILTERING OUT MOST TRADES!")
                print(f"   Only keeping {len(kept)}/{len(first_page_trades)} from first page")
                print(f"   This is the bug!")
            else:
                print(f"✅ Keeping {len(kept)}/{len(first_page_trades)} trades")
                print(f"   Filtering looks reasonable")

# Run
asyncio.run(debug_filtering())

