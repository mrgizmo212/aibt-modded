#!/usr/bin/env python3
"""
Diagnostic Script: Investigate Missing Minute Bars

Checks:
1. What data the proxy actually returns for missing minutes
2. Whether trades exist for those minutes
3. Why bars aren't being created from available trades
"""

import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from config import settings
import httpx

async def fetch_trades_for_timerange(
    symbol: str,
    date: str,
    start_minute: str,
    end_minute: str
) -> List[Dict[str, Any]]:
    """
    Fetch trades for a specific minute range
    
    Args:
        symbol: Stock symbol (e.g., 'IBM')
        date: Trading date YYYY-MM-DD
        start_minute: Start time HH:MM (e.g., '14:30')
        end_minute: End time HH:MM (e.g., '14:33')
    """
    
    # Parse date and times
    year, month, day = map(int, date.split('-'))
    start_hour, start_min = map(int, start_minute.split(':'))
    end_hour, end_min = map(int, end_minute.split(':'))
    
    # ET to UTC conversion (EDT is UTC-4)
    et_offset = 4
    
    # Create UTC datetimes
    start_dt = datetime(year, month, day, start_hour + et_offset, start_min, tzinfo=timezone.utc)
    end_dt = datetime(year, month, day, end_hour + et_offset, end_min, tzinfo=timezone.utc)
    
    # Convert to nanoseconds
    start_nano = int(start_dt.timestamp() * 1_000_000_000)
    end_nano = int(end_dt.timestamp() * 1_000_000_000)
    
    print(f"📡 Fetching trades from proxy:")
    print(f"   Symbol: {symbol}")
    print(f"   Date: {date}")
    print(f"   Time range (ET): {start_minute} - {end_minute}")
    print(f"   Time range (UTC): {start_dt.strftime('%H:%M')} - {end_dt.strftime('%H:%M')}")
    print(f"   Timestamp range: {start_nano} - {end_nano}")
    print()
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
    params = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    all_trades = []
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params, timeout=30.0)
            
            if response.status_code != 200:
                print(f"❌ Request failed: {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                return []
            
            data = response.json()
            
            # Handle proxy wrapper
            if "data" in data and "results" in data["data"]:
                trades = data["data"]["results"]
                all_trades.extend(trades)
            else:
                print(f"❌ Unexpected response structure: {list(data.keys())}")
                return []
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return []
    
    return all_trades

def analyze_trades_by_minute(trades: List[Dict[str, Any]]) -> Dict[str, Dict]:
    """
    Analyze trades grouped by minute
    
    Returns:
        Dict[minute_str, {count, first_price, last_price, volume}]
    """
    
    minutes = {}
    
    for trade in trades:
        ts_nano = trade.get('participant_timestamp', 0)
        ts_ms = ts_nano // 1_000_000
        
        # Convert to ET time
        ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
        ts_et = ts_utc - timedelta(hours=4)  # EDT = UTC-4
        minute_str = ts_et.strftime('%H:%M')
        
        price = trade.get('price', 0)
        size = trade.get('size', 0)
        
        if minute_str not in minutes:
            minutes[minute_str] = {
                'count': 0,
                'first_price': price,
                'last_price': price,
                'total_volume': 0,
                'trades': []
            }
        
        minutes[minute_str]['count'] += 1
        minutes[minute_str]['last_price'] = price
        minutes[minute_str]['total_volume'] += size
        minutes[minute_str]['trades'].append(trade)
    
    return minutes

async def main():
    """
    Diagnose missing bars for specific minutes
    """
    
    print("=" * 80)
    print("🔍 MISSING BARS DIAGNOSTIC")
    print("=" * 80)
    print()
    
    # Configuration from your terminal output
    symbol = "IBM"
    date = "2025-10-27"  # Adjust to actual date from your test
    missing_minutes = ["14:30", "14:31", "14:32"]
    
    print(f"Target Symbol: {symbol}")
    print(f"Target Date: {date}")
    print(f"Missing Minutes (ET): {', '.join(missing_minutes)}")
    print()
    
    # Fetch trades for the problematic time range
    start_time = "14:30"
    end_time = "14:33"
    
    trades = await fetch_trades_for_timerange(symbol, date, start_time, end_time)
    
    print(f"📊 Results:")
    print(f"   Total trades received: {len(trades)}")
    print()
    
    if not trades:
        print("❌ NO TRADES FOUND")
        print()
        print("🔍 Possible Reasons:")
        print("   1. No trades occurred in these minutes (low volume period)")
        print("   2. Market was halted")
        print("   3. Date is non-trading day")
        print("   4. Proxy timestamp filter issue")
        print()
        print("✅ CONCLUSION: Missing bars are EXPECTED if no trades occurred")
        return
    
    # Analyze trades by minute
    print(f"📈 Trade Distribution by Minute:")
    print("-" * 80)
    
    by_minute = analyze_trades_by_minute(trades)
    
    for minute in ["14:30", "14:31", "14:32"]:
        if minute in by_minute:
            info = by_minute[minute]
            print(f"✅ {minute} ET:")
            print(f"   Trades: {info['count']}")
            print(f"   Price: ${info['first_price']:.2f} → ${info['last_price']:.2f}")
            print(f"   Volume: {info['total_volume']:,}")
        else:
            print(f"❌ {minute} ET: NO TRADES")
    
    print()
    print("=" * 80)
    print("🎯 DIAGNOSIS:")
    print("=" * 80)
    print()
    
    if all(m in by_minute for m in missing_minutes):
        print("⚠️  PROBLEM FOUND: Trades exist but bars are missing!")
        print()
        print("🔧 Possible Causes:")
        print("   1. Timezone conversion error")
        print("   2. Redis caching failure")
        print("   3. Aggregation logic bug")
        print()
        print("📋 Next Steps:")
        print("   Check cache_intraday_bars() timezone conversion")
        print("   Verify Redis keys are being created correctly")
    else:
        missing_with_no_trades = [m for m in missing_minutes if m not in by_minute]
        print("✅ EXPECTED BEHAVIOR:")
        print(f"   These minutes had NO TRADES: {', '.join(missing_with_no_trades)}")
        print()
        print("   This is normal for:")
        print("   • Low-volume stocks")
        print("   • Quiet periods (lunch hour 12-2 PM)")
        print("   • Market conditions")
        print()
        print("💡 RECOMMENDATION:")
        print("   The system correctly skips minutes with no trades.")
        print("   AI agent handles this with: 'if not bar: continue'")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    print("\n⚙️  Using Configuration:")
    print(f"   Proxy URL: {settings.POLYGON_PROXY_URL}")
    print(f"   Proxy Key: {'*' * 20}{settings.POLYGON_PROXY_KEY[-4:]}")
    print()
    
    asyncio.run(main())

