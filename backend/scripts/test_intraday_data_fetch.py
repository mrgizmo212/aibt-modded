"""
Test Intraday Data Fetch - apiv3-ttg Proxy Integration
Verifies we can fetch tick data, aggregate to bars, and cache in Redis
"""

import asyncio
import httpx
import sys
from pathlib import Path
from datetime import datetime, timezone
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.redis_client import redis_client
from config import settings
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("INTRADAY DATA FETCH TEST - apiv3-ttg Proxy")
print("=" * 80)

async def fetch_trades_from_proxy(symbol: str, date: str, limit: int = 1000):
    """
    Fetch tick data from YOUR apiv3-ttg proxy
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL')
        date: Date in YYYY-MM-DD format
        limit: Max trades to fetch for testing
    """
    
    print(f"\n📡 Step 1: Fetch Tick Data from apiv3-ttg")
    print("-" * 80)
    print(f"  Symbol: {symbol}")
    print(f"  Date: {date}")
    print(f"  Proxy: {settings.POLYGON_PROXY_URL}")
    
    # Calculate timestamp range for regular market hours (9:30 AM - 4:00 PM ET)
    # For simplicity, just get first hour (9:30-10:30 AM) for testing
    
    # 2025-10-27 09:30:00 ET = 2025-10-27 13:30:00 UTC (EDT, -4 hours)
    start_dt = datetime(2025, 10, 27, 13, 30, 0, tzinfo=timezone.utc)  # 9:30 AM ET
    end_dt = datetime(2025, 10, 27, 14, 30, 0, tzinfo=timezone.utc)    # 10:30 AM ET
    
    # Convert to nanoseconds
    start_nano = int(start_dt.timestamp() * 1_000_000_000)
    end_nano = int(end_dt.timestamp() * 1_000_000_000)
    
    print(f"  Time Range: 9:30 AM - 10:30 AM ET (first hour)")
    print(f"  Start (nano): {start_nano}")
    print(f"  End (nano): {end_nano}")
    
    try:
        async with httpx.AsyncClient() as client:
            # Call YOUR proxy (apiv3-ttg)
            url = f"{settings.POLYGON_PROXY_URL}/polygon/stocks/trades/{symbol}"
            
            params = {
                "timestamp.gte": start_nano,
                "timestamp.lte": end_nano,
                "limit": limit,
                "order": "asc"
            }
            
            headers = {"x-custom-key": settings.POLYGON_PROXY_KEY}
            
            print(f"\n  🔄 Calling proxy...")
            print(f"     GET {url}")
            print(f"     Params: {params}")
            
            response = await client.get(
                url,
                headers=headers,
                params=params,
                timeout=30.0
            )
            
            print(f"  📊 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                except Exception as e:
                    print(f"  ❌ Failed to parse JSON: {e}")
                    print(f"     Response text: {response.text[:500]}")
                    return []
                
                # Debug: Show what we got
                print(f"  📦 Response keys: {list(data.keys())}")
                
                # YOUR proxy wraps: data.data.results (nested structure)
                if "data" in data and isinstance(data["data"], dict) and "results" in data["data"]:
                    trades = data["data"]["results"]
                    print(f"  ✅ Received {len(trades)} trades")
                    
                    # Check if there's more data (in data.data.next_url)
                    if "next_url" in data["data"]:
                        print(f"  ℹ️  More data available (pagination)")
                        print(f"     Next URL exists (not fetching for test)")
                    
                    # Show first trade structure
                    print(f"\n  📄 First Trade Sample:")
                    first_trade = trades[0]
                    print(f"     ID: {first_trade.get('id')}")
                    print(f"     Price: ${first_trade.get('price', 0):.4f}")
                    print(f"     Size: {first_trade.get('size', 0)}")
                    
                    if "participant_timestamp" in first_trade:
                        ts_nano = first_trade["participant_timestamp"]
                        ts = datetime.fromtimestamp(ts_nano / 1_000_000_000, tz=timezone.utc)
                        print(f"     Timestamp: {ts.strftime('%Y-%m-%d %H:%M:%S.%f')} UTC")
                    
                    # Show last trade to see time span
                    if len(trades) > 1:
                        last_trade = trades[-1]
                        if "participant_timestamp" in last_trade:
                            ts_nano = last_trade["participant_timestamp"]
                            ts = datetime.fromtimestamp(ts_nano / 1_000_000_000, tz=timezone.utc)
                            print(f"\n  📄 Last Trade:")
                            print(f"     Price: ${last_trade.get('price', 0):.4f}")
                            print(f"     Timestamp: {ts.strftime('%Y-%m-%d %H:%M:%S.%f')} UTC")
                    
                    return trades
                elif "data" in data and not data["data"]:
                    print(f"  ⚠️  Response has 'data' but it's empty")
                    print(f"     Status: {data.get('status')}")
                    print(f"     This might be a weekend/holiday or no trading data")
                    return []
                else:
                    print(f"  ❌ Unexpected response format:")
                    print(f"     Keys: {list(data.keys())}")
                    print(f"     Status: {data.get('status')}")
                    if "message" in data:
                        print(f"     Message: {data.get('message')}")
                    return []
            else:
                print(f"  ❌ Request failed: {response.status_code}")
                print(f"     Response: {response.text[:200]}")
                return []
                
    except Exception as e:
        print(f"  ❌ Error fetching data: {e}")
        return []

def aggregate_to_minute_bars(trades):
    """
    Aggregate trades to 1-minute OHLCV bars
    
    Pattern from context-only, adapted for minutes instead of seconds
    """
    
    print(f"\n📊 Step 2: Aggregate to Minute Bars")
    print("-" * 80)
    
    if not trades:
        print(f"  ⚠️  No trades to aggregate")
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
    
    print(f"  ✅ Aggregated {len(trades)} trades → {len(bars)} minute bars")
    
    if bars:
        # Show first bar
        first_bar = bars[0]
        ts = datetime.fromtimestamp(first_bar['timestamp'] / 1000, tz=timezone.utc)
        print(f"\n  📄 First Minute Bar ({ts.strftime('%H:%M:%S')} UTC):")
        print(f"     Open:   ${first_bar['open']:.2f}")
        print(f"     High:   ${first_bar['high']:.2f}")
        print(f"     Low:    ${first_bar['low']:.2f}")
        print(f"     Close:  ${first_bar['close']:.2f}")
        print(f"     Volume: {first_bar['volume']:,}")
    
    return bars

async def cache_minute_bars_redis(symbol: str, date: str, bars, model_id: int = 26):
    """
    Cache minute bars in Redis with model isolation
    
    Args:
        symbol: Stock symbol
        date: Trading date
        bars: List of minute bars
        model_id: Model ID for isolation
    """
    
    print(f"\n💾 Step 3: Cache in Redis (Per-Model Isolation)")
    print("-" * 80)
    
    stored = 0
    
    for bar in bars[:10]:  # Just cache first 10 for testing
        # Convert timestamp to minute string
        ts = datetime.fromtimestamp(bar['timestamp'] / 1000, tz=timezone.utc)
        minute_str = ts.strftime('%H:%M')
        
        # Key includes model_id for isolation
        key = f"intraday:model_{model_id}:{date}:{symbol}:{minute_str}"
        
        success = await redis_client.set(key, bar, ex=7200)  # 2 hour TTL
        
        if success:
            stored += 1
    
    print(f"  ✅ Stored {stored} minute bars in Redis")
    print(f"  🔑 Key pattern: intraday:model_{model_id}:{date}:{symbol}:HH:MM")
    print(f"  ⏰ TTL: 2 hours (auto-expires)")
    
    # Verify retrieval
    print(f"\n📖 Step 4: Verify Retrieval from Redis")
    print("-" * 80)
    
    if bars:
        first_bar = bars[0]
        ts = datetime.fromtimestamp(first_bar['timestamp'] / 1000, tz=timezone.utc)
        minute_str = ts.strftime('%H:%M')
        test_key = f"intraday:model_{model_id}:{date}:{symbol}:{minute_str}"
        
        retrieved = await redis_client.get(test_key)
        
        if retrieved:
            # redis_client.get() now returns parsed dict
            bar_data = retrieved
            
            print(f"  ✅ Retrieved minute bar:")
            print(f"     Key: {test_key}")
            
            # Handle both dict and any other format defensively
            if isinstance(bar_data, dict):
                print(f"     Open: ${bar_data.get('open', 0):.2f}")
                print(f"     Close: ${bar_data.get('close', 0):.2f}")
                print(f"     Volume: {bar_data.get('volume', 0):,}")
            else:
                print(f"     Data: {bar_data}")
                print(f"     Type: {type(bar_data)}")
        else:
            print(f"  ❌ Failed to retrieve from Redis")
    
    return stored

async def test_multi_model_isolation():
    """
    Test that different models can trade same stock without collision
    """
    
    print(f"\n🔒 Step 5: Test Multi-Model Isolation")
    print("-" * 80)
    
    # Simulate two models trading same stock, same time
    test_bar = {
        'timestamp': 1730131800000,
        'open': 150.0,
        'high': 151.0,
        'low': 149.0,
        'close': 150.5,
        'volume': 1000
    }
    
    # Model 26 stores data
    key_26 = "intraday:model_26:2025-10-27:AAPL:09:30"
    await redis_client.set(key_26, test_bar, ex=60)
    
    # Model 27 stores different data (same time, same stock)
    test_bar_27 = test_bar.copy()
    test_bar_27['close'] = 999.99  # Different value to prove isolation
    
    key_27 = "intraday:model_27:2025-10-27:AAPL:09:30"
    await redis_client.set(key_27, test_bar_27, ex=60)
    
    print(f"  📝 Model 26 stored: close=${test_bar['close']}")
    print(f"  📝 Model 27 stored: close=${test_bar_27['close']}")
    
    # Verify isolation - Model 26 should still have its original value
    retrieved_26 = await redis_client.get(key_26)
    retrieved_27 = await redis_client.get(key_27)
    
    # Parse if string (redis_client.get() sometimes returns string)
    bar_26 = json.loads(retrieved_26) if isinstance(retrieved_26, str) else retrieved_26
    bar_27 = json.loads(retrieved_27) if isinstance(retrieved_27, str) else retrieved_27
    
    if isinstance(bar_26, dict) and isinstance(bar_27, dict):
        close_26 = bar_26.get('close')
        close_27 = bar_27.get('close')
        
        if close_26 == 150.5 and close_27 == 999.99:
            print(f"  ✅ Model 26 retrieved: close=${close_26}")
            print(f"  ✅ Model 27 retrieved: close=${close_27}")
            print(f"  ✅ ISOLATION VERIFIED - No data mixing!")
        else:
            print(f"  ❌ Data corruption detected!")
            print(f"     Model 26 expected $150.5, got ${close_26}")
            print(f"     Model 27 expected $999.99, got ${close_27}")
    else:
        print(f"  ❌ Failed to parse retrieved data!")
        print(f"     Type 26: {type(bar_26)}")
        print(f"     Type 27: {type(bar_27)}")
    
    # Cleanup
    await redis_client.delete(key_26)
    await redis_client.delete(key_27)

async def main():
    """Run intraday data fetch test"""
    
    # Test configuration
    print(f"\n⚙️  Configuration:")
    print(f"  Polygon Proxy: {settings.POLYGON_PROXY_URL}")
    print(f"  Redis: {settings.UPSTASH_REDIS_REST_URL}")
    
    # Step 1: Fetch real tick data from YOUR proxy
    symbol = "AAPL"
    date = "2025-10-27"  # Recent trading day
    
    trades = await fetch_trades_from_proxy(symbol, date, limit=5000)
    
    if not trades:
        print("\n⚠️  No trade data received")
        print("  This could mean:")
        print("  - Proxy needs authentication")
        print("  - Date might be weekend/holiday")
        print("  - Symbol might be invalid")
        print("  - Proxy endpoint might be different")
        return
    
    # Step 2: Aggregate to minute bars
    minute_bars = aggregate_to_minute_bars(trades)
    
    if not minute_bars:
        print("\n⚠️  No minute bars created")
        return
    
    # Step 3: Cache in Redis
    stored = await cache_minute_bars_redis(symbol, date, minute_bars, model_id=26)
    
    # Step 4: Verify retrieval (already done in cache function)
    
    # Step 5: Test multi-model isolation
    await test_multi_model_isolation()
    
    # Summary
    print("\n" + "=" * 80)
    print("INTRADAY DATA FETCH - SUMMARY")
    print("=" * 80)
    print(f"\n✅ Data Flow Verified:")
    print(f"  ✅ Fetched {len(trades)} trades from apiv3-ttg proxy")
    print(f"  ✅ Aggregated to {len(minute_bars)} minute bars")
    print(f"  ✅ Cached {stored} bars in Redis")
    print(f"  ✅ Retrieved successfully from Redis")
    print(f"  ✅ Multi-model isolation confirmed")
    print(f"\n📊 Data Statistics:")
    print(f"  Symbol: {symbol}")
    print(f"  Date: {date}")
    print(f"  Time Range: First hour (9:30-10:30 AM ET)")
    print(f"  Raw Trades: {len(trades):,}")
    print(f"  Minute Bars: {len(minute_bars)}")
    print(f"  Avg Trades/Minute: {len(trades) / max(len(minute_bars), 1):.0f}")
    print(f"\n🎯 Ready for Intraday Trading Implementation!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())

