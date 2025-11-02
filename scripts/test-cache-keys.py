"""
Test Script: Diagnose Redis Cache Key Mismatch
Checks what's stored vs what's being retrieved for intraday bars
"""

import os
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("DIAGNOSING: Redis Cache Key Mismatch")
print("=" * 80)
print()

# Test parameters (match what you're using)
MODEL_ID = 169
DATE = "2025-10-15"
SYMBOL = "AAPL"
SESSION = "regular"

print(f"Testing with:")
print(f"  Model ID: {MODEL_ID}")
print(f"  Date: {DATE}")
print(f"  Symbol: {SYMBOL}")
print(f"  Session: {SESSION}")
print()

# Test 1: Check what keys exist in Redis
print("TEST 1: What keys are stored in Redis?")
print("-" * 80)

from utils.redis_client import redis_client

async def check_redis_keys():
    # For Upstash Redis, we'll test specific keys instead of scanning
    # Test all 390 minutes to see which are cached
    
    from trading.intraday_agent import _get_session_minutes
    
    expected_minutes = _get_session_minutes(DATE, SESSION)
    print(f"Testing {len(expected_minutes)} expected minute bars...")
    
    cached_keys = []
    missing_keys = []
    
    for minute in expected_minutes:
        key = f"intraday:model_{MODEL_ID}:{DATE}:{SYMBOL}:{minute}"
        bar = await redis_client.get(key)
        
        if bar:
            cached_keys.append((minute, key))
        else:
            missing_keys.append((minute, key))
    
    print(f"✅ Found {len(cached_keys)} bars cached")
    print(f"❌ Missing {len(missing_keys)} bars")
    
    if cached_keys:
        print(f"\nFirst 10 cached times:")
        for minute, key in cached_keys[:10]:
            print(f"  ✅ {minute}")
        
        print(f"\nLast 10 cached times:")
        for minute, key in cached_keys[-10:]:
            print(f"  ✅ {minute}")
    
    if missing_keys:
        print(f"\nFirst 10 missing times:")
        for minute, key in missing_keys[:10]:
            print(f"  ❌ {minute}")
    
    return [key for _, key in cached_keys]

# Test 2: Try retrieving with exact key
print("\nTEST 2: Can we retrieve bars using the exact keys?")
print("-" * 80)

async def test_exact_retrieval(keys):
    if not keys:
        print("⚠️  Skipping - no keys to test")
        return
    
    # Try first 5 keys
    print(f"Testing first 5 keys:")
    for i, key in enumerate(keys[:5]):
        key_str = key.decode('utf-8') if isinstance(key, bytes) else key
        bar = await redis_client.get(key_str)
        
        if bar:
            print(f"  ✅ Key {i+1}: Retrieved successfully")
            print(f"     Price: ${bar.get('close', 'N/A')}")
        else:
            print(f"  ❌ Key {i+1}: Failed to retrieve")

# Test 3: Try retrieving with function (how agent does it)
print("\nTEST 3: Can get_minute_bar_from_cache() retrieve bars?")
print("-" * 80)

from intraday_loader import get_minute_bar_from_cache

async def test_function_retrieval():
    # Test retrieving a few minutes
    test_minutes = ["09:30", "09:31", "09:32", "10:00", "12:00", "15:00", "15:30", "15:59"]
    
    print(f"Testing retrieval for these minutes:")
    for minute in test_minutes:
        bar = await get_minute_bar_from_cache(MODEL_ID, DATE, SYMBOL, minute)
        
        if bar:
            print(f"  ✅ {minute}: Found (close: ${bar.get('close', 'N/A')})")
        else:
            print(f"  ❌ {minute}: NOT FOUND")

# Test 4: Check time format in keys vs lookup
print("\nTEST 4: Time format comparison")
print("-" * 80)

async def check_time_formats(keys):
    if not keys:
        print("⚠️  Skipping - no keys")
        return
    
    # Extract time portions from keys
    times_in_cache = set()
    for key in keys:
        key_str = key.decode('utf-8') if isinstance(key, bytes) else key
        # Key format: intraday:model_{model_id}:{date}:{symbol}:{time}
        parts = key_str.split(':')
        if len(parts) >= 5:
            time_part = parts[4]
            times_in_cache.add(time_part)
    
    # Show what times are cached
    sorted_times = sorted(list(times_in_cache))
    print(f"Times in cache ({len(sorted_times)} unique):")
    print(f"  First 10: {sorted_times[:10]}")
    print(f"  Last 10: {sorted_times[-10:]}")
    
    # Compare with what we're looking for
    from trading.intraday_agent import _get_session_minutes
    expected_minutes = _get_session_minutes(DATE, SESSION)
    
    print(f"\nExpected minutes ({len(expected_minutes)} total):")
    print(f"  First 10: {expected_minutes[:10]}")
    print(f"  Last 10: {expected_minutes[-10:]}")
    
    # Find mismatch
    cached_set = set(sorted_times)
    expected_set = set(expected_minutes)
    
    missing_from_cache = expected_set - cached_set
    extra_in_cache = cached_set - expected_set
    
    if missing_from_cache:
        print(f"\n❌ Expected but NOT in cache ({len(missing_from_cache)} minutes):")
        print(f"  Examples: {list(missing_from_cache)[:10]}")
    
    if extra_in_cache:
        print(f"\n⚠️  In cache but NOT expected ({len(extra_in_cache)} minutes):")
        print(f"  Examples: {list(extra_in_cache)[:10]}")
    
    if not missing_from_cache and not extra_in_cache:
        print(f"\n✅ PERFECT MATCH! All {len(expected_set)} expected times are in cache!")

# Run all tests
async def run_all_tests():
    keys = await check_redis_keys()
    print()
    await test_exact_retrieval(keys)
    print()
    await test_function_retrieval()
    print()
    await check_time_formats(keys)
    
    print()
    print("=" * 80)
    print("DIAGNOSIS COMPLETE")
    print("=" * 80)
    print()
    print("If you see mismatches above, that's the problem!")
    print("The cache and retrieval are using different time formats/timezones.")

# Execute
asyncio.run(run_all_tests())

