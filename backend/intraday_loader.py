"""
Intraday Data Loader Service
Fetches tick data from apiv3-ttg, aggregates to minute bars, caches in Redis
"""

import httpx
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from config import settings
from utils.redis_client import redis_client


async def fetch_all_trades_for_session(
    symbol: str,
    date: str,
    session: str = "regular"
) -> List[Dict[str, Any]]:
    """
    Fetch ALL trades for a symbol on a specific date and session
    
    Args:
        symbol: Stock ticker (e.g., 'AAPL')
        date: Trading date YYYY-MM-DD
        session: 'pre' (4-9:30 AM), 'regular' (9:30 AM-4 PM), 'after' (4-8 PM)
    
    Returns:
        List of trade dicts from Polygon
    """
    
    # Calculate timestamp range (nanoseconds)
    start_nano, end_nano = _get_session_timestamp_range(date, session)
    
    all_trades = []
    url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
    
    params = {
        "timestamp.gte": start_nano,
        "timestamp.lte": end_nano,
        "limit": 50000,  # Max per request
        "order": "asc"
    }
    
    headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
    
    print(f"📡 Fetching {symbol} trades for {date} ({session} session)...")
    
    async with httpx.AsyncClient() as client:
        page = 1
        while url:
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
            
            # YOUR proxy wraps: data.data.results
            if "data" in data and "results" in data["data"]:
                trades = data["data"]["results"]
                
                # Debug: Check first trade structure
                if trades and page == 1:
                    print(f"  🔍 First trade fields: {list(trades[0].keys())}")
                    print(f"  🔍 First trade sample: {trades[0]}")
                
                all_trades.extend(trades)
                print(f"  📄 Page {page}: {len(trades)} trades")
                
                # Check for pagination - extract cursor and route through proxy
                if "next_url" in data["data"] and page < 10:  # Max 10 pages (500k trades)
                    next_url_str = data["data"]["next_url"]
                    
                    # Extract cursor from Polygon's next_url
                    # Example: https://api.polygon.io/v3/trades/AAPL?cursor=XYZ&limit=50000
                    if "cursor=" in next_url_str:
                        import urllib.parse
                        parsed = urllib.parse.urlparse(next_url_str)
                        cursor = urllib.parse.parse_qs(parsed.query).get("cursor", [None])[0]
                        
                        if cursor:
                            # Route through YOUR proxy with cursor
                            url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
                            # CRITICAL: Keep timestamp filters on ALL pages to prevent wrong-date data!
                            params = {
                                "cursor": cursor,
                                "limit": 50000,
                                "timestamp.gte": start_nano,  # ← Keep date filter!
                                "timestamp.lte": end_nano,     # ← Keep date filter!
                                "order": "asc"
                            }
                            page += 1
                            print(f"  📄 Next page cursor: {cursor[:20]}...")
                        else:
                            break
                    else:
                        break
                else:
                    break
            else:
                break
    
    print(f"  ✅ Total trades fetched: {len(all_trades):,}")
    return all_trades


def _get_session_timestamp_range(date: str, session: str) -> tuple:
    """
    Calculate nanosecond timestamp range for trading session
    
    Args:
        date: YYYY-MM-DD
        session: 'pre', 'regular', 'after'
    
    Returns:
        (start_nano, end_nano) tuple
    """
    
    year, month, day = map(int, date.split("-"))
    
    # EDT offset (assuming -4 for simplicity, should check DST)
    et_offset = -4
    
    if session == "pre":
        # 4:00 AM - 9:29 AM ET
        start_hour, start_min = 4, 0
        end_hour, end_min = 9, 29
    elif session == "regular":
        # 9:30 AM - 4:00 PM ET
        start_hour, start_min = 9, 30
        end_hour, end_min = 16, 0
    elif session == "after":
        # 4:01 PM - 8:00 PM ET
        start_hour, start_min = 16, 1
        end_hour, end_min = 20, 0
    else:
        raise ValueError(f"Invalid session: {session}")
    
    # Convert to UTC
    start_dt = datetime(year, month, day, start_hour - et_offset, start_min, tzinfo=timezone.utc)
    end_dt = datetime(year, month, day, end_hour - et_offset, end_min, tzinfo=timezone.utc)
    
    # Convert to nanoseconds
    start_nano = int(start_dt.timestamp() * 1_000_000_000)
    end_nano = int(end_dt.timestamp() * 1_000_000_000)
    
    return start_nano, end_nano


def aggregate_to_minute_bars(trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Aggregate individual trades to 1-minute OHLCV bars
    
    Args:
        trades: List of trade dicts with participant_timestamp, price, size
    
    Returns:
        List of minute bar dicts sorted by timestamp
    """
    
    if not trades:
        return []
    
    # Sort by timestamp
    sorted_trades = sorted(trades, key=lambda t: t.get('participant_timestamp', 0))
    
    minute_bars = {}
    
    for trade in sorted_trades:
        # Get timestamp in nanoseconds
        timestamp_nano = trade.get('participant_timestamp', 0)
        
        # Convert to milliseconds
        timestamp_ms = timestamp_nano // 1_000_000
        
        # Round down to minute (60,000 ms = 1 minute)
        minute_ms = (timestamp_ms // 60000) * 60000
        
        price = trade.get('price', 0)
        size = trade.get('size', 0)
        
        if minute_ms not in minute_bars:
            # First trade of this minute
            minute_bars[minute_ms] = {
                'timestamp': minute_ms,
                'open': price,
                'high': price,
                'low': price,
                'close': price,
                'volume': size
            }
        else:
            # Update existing minute bar
            bar = minute_bars[minute_ms]
            bar['high'] = max(bar['high'], price)
            bar['low'] = min(bar['low'], price)
            bar['close'] = price  # Last trade = close
            bar['volume'] += size
    
    # Convert to sorted list
    bars = sorted(minute_bars.values(), key=lambda b: b['timestamp'])
    
    print(f"  📊 Aggregated {len(trades):,} trades → {len(bars)} minute bars")
    
    return bars


async def cache_intraday_bars(
    model_id: int,
    date: str,
    symbol: str,
    bars: List[Dict[str, Any]]
) -> int:
    """
    Cache minute bars in Redis with per-model isolation
    
    Args:
        model_id: Model ID for key isolation
        date: Trading date
        symbol: Stock symbol
        bars: List of minute bars
    
    Returns:
        Number of bars cached
    """
    
    cached = 0
    failed = 0
    
    # EDT timezone offset (UTC-4 for EDT, UTC-5 for EST)
    # For simplicity, using -4 (should check DST in production)
    edt_offset = timedelta(hours=-4)
    
    # Track unique times to detect duplicates
    unique_times = set()
    duplicates = 0
    
    for idx, bar in enumerate(bars):
        # Convert timestamp to HH:MM format IN EDT
        # bar['timestamp'] is in milliseconds UTC
        ts_ms = bar['timestamp']
        
        # Create UTC datetime
        ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
        
        # Create EDT timezone (UTC-4)
        edt_tz = timezone(timedelta(hours=-4))
        
        # Convert to EDT
        ts_edt = ts_utc.astimezone(edt_tz)
        minute_str = ts_edt.strftime('%H:%M')
        
        # Check for duplicates
        if minute_str in unique_times:
            duplicates += 1
        else:
            unique_times.add(minute_str)
        
        # Per-model key for isolation
        key = f"intraday:model_{model_id}:{date}:{symbol}:{minute_str}"
        
        # Cache with 2-hour TTL
        success = await redis_client.set(key, bar, ex=7200)
        
        if success:
            cached += 1
            # Show first 5 and last 5 successful caches
            if cached <= 5 or idx >= len(bars) - 5:
                print(f"  ✅ Cached {minute_str} (bar {idx+1}/{len(bars)})")
        else:
            failed += 1
            if failed <= 5:
                print(f"  ❌ Failed to cache {minute_str}")
    
    print(f"  💾 Cached {cached} bars in Redis (TTL: 2 hours)")
    print(f"  📊 Unique times: {len(unique_times)}, Duplicates: {duplicates}")
    if failed > 0:
        print(f"  ⚠️  Failed to cache: {failed} bars")
    
    return cached


async def load_intraday_session(
    model_id: int,
    symbols: List[str],
    date: str,
    session: str = "regular"
) -> Dict[str, int]:
    """
    Load complete intraday session data for trading
    
    Pre-loads entire day's tick data, aggregates to minute bars,
    caches in Redis for fast access during AI trading loop.
    
    Args:
        model_id: Model ID (for key isolation)
        symbols: List of stock symbols to load
        date: Trading date YYYY-MM-DD
        session: 'pre', 'regular', or 'after'
    
    Returns:
        Dict with stats: {symbol: bars_cached}
    """
    
    print("=" * 80)
    print(f"LOADING INTRADAY SESSION")
    print("=" * 80)
    print(f"  Model ID: {model_id}")
    print(f"  Date: {date}")
    print(f"  Session: {session}")
    print(f"  Symbols: {', '.join(symbols)}")
    print()
    
    stats = {}
    
    for symbol in symbols:
        print(f"\n📈 Processing {symbol}:")
        print("-" * 80)
        
        # Fetch all trades
        trades = await fetch_all_trades_for_session(symbol, date, session)
        
        if not trades:
            print(f"  ⚠️  No trades found for {symbol}")
            stats[symbol] = 0
            continue
        
        # Aggregate to minute bars
        bars = aggregate_to_minute_bars(trades)
        
        if not bars:
            print(f"  ⚠️  No bars created for {symbol}")
            stats[symbol] = 0
            continue
        
        # Cache in Redis
        cached = await cache_intraday_bars(model_id, date, symbol, bars)
        
        stats[symbol] = cached
    
    print("\n" + "=" * 80)
    print("SESSION DATA LOADED")
    print("=" * 80)
    print(f"\nSummary:")
    for symbol, count in stats.items():
        print(f"  {symbol}: {count} minute bars cached")
    
    total_bars = sum(stats.values())
    print(f"\nTotal: {total_bars} minute bars ready in Redis")
    print("=" * 80)
    
    return stats


async def get_minute_bar_from_cache(
    model_id: int,
    date: str,
    symbol: str,
    minute: str
) -> Dict[str, Any]:
    """
    Retrieve cached minute bar from Redis
    
    Args:
        model_id: Model ID
        date: Trading date YYYY-MM-DD
        symbol: Stock symbol
        minute: Time in HH:MM format
    
    Returns:
        Minute bar dict or None if not found
    """
    
    key = f"intraday:model_{model_id}:{date}:{symbol}:{minute}"
    
    bar = await redis_client.get(key)
    
    # Handle string results from Redis
    if isinstance(bar, str):
        import json
        bar = json.loads(bar)
    
    return bar


async def get_all_symbols_at_minute(
    model_id: int,
    date: str,
    symbols: List[str],
    minute: str
) -> Dict[str, Dict[str, Any]]:
    """
    Get price bars for ALL symbols at a specific minute
    
    Fast batch retrieval for AI to analyze multiple stocks
    
    Args:
        model_id: Model ID
        date: Trading date
        symbols: List of symbols
        minute: Time HH:MM
    
    Returns:
        Dict of {symbol: bar_data}
    """
    
    prices = {}
    
    for symbol in symbols:
        bar = await get_minute_bar_from_cache(model_id, date, symbol, minute)
        if bar:
            prices[symbol] = bar
    
    return prices

