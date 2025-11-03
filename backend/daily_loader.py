"""
Daily Bar Loader - Fetch OHLCV from Polygon API
"""

import httpx
from typing import Dict
from datetime import datetime
from config import settings


async def fetch_daily_bars_polygon(
    symbol: str,
    start_date: str,
    end_date: str
) -> Dict[str, Dict]:
    """
    Fetch daily OHLCV bars from Polygon API
    
    Returns: {date: {open, high, low, close, volume}}
    """
    print(f"📊 Fetching daily bars for {symbol} ({start_date} to {end_date})")
    
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/aggregates/{symbol}"
    
    params = {
        "timespan": "day",
        "from": start_date,
        "to": end_date,
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000
    }
    
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"  ❌ Polygon API error: {response.status_code}")
            return {}
        
        data = response.json()
        
        # Check if data wrapped
        results = data.get("data", {}).get("results") if "data" in data else data.get("results")
        
        if not results:
            print(f"  ⚠️  No bars returned")
            return {}
        
        print(f"  ✅ Fetched {len(results)} daily bars")
        
        # Convert to dict keyed by date
        bars = {}
        for bar in results:
            bar_date = datetime.fromtimestamp(bar['t'] / 1000).strftime('%Y-%m-%d')
            bars[bar_date] = {
                'open': bar['o'],
                'high': bar['h'],
                'low': bar['l'],
                'close': bar['c'],
                'volume': bar['v']
            }
        
        # Cache in Redis for BaseAgent to read
        try:
            from utils.redis_client import redis_client
            
            for date_str, bar_data in bars.items():
                # Store as {symbol}_price format for get_open_prices compatibility
                cache_key = f"daily_price:{symbol}:{date_str}"
                await redis_client.set(cache_key, bar_data['open'], ex=7200)
            
            print(f"  💾 Cached {len(bars)} bars in Redis")
        except Exception as e:
            print(f"  ⚠️  Cache failed: {e}")
        
        return bars

