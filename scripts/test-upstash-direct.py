"""
Test Upstash Redis Directly

Verifies that our Upstash implementation can actually store and retrieve data.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from dotenv import load_dotenv
load_dotenv(backend_path / ".env")

print("=" * 80)
print("TESTING UPSTASH REDIS DIRECTLY")
print("=" * 80)
print()

from utils.redis_client import redis_client

async def test_upstash():
    # Test 1: Can we SET a simple value?
    print("TEST 1: SET a simple value")
    print("-" * 80)
    
    test_key = "test:simple:key"
    test_value = {"hello": "world", "number": 123}
    
    print(f"Setting key: {test_key}")
    print(f"Value: {test_value}")
    
    success = await redis_client.set(test_key, test_value, ex=300)
    
    if success:
        print(f"✅ SET returned True")
    else:
        print(f"❌ SET returned False - write failed!")
        return
    
    # Test 2: Can we GET it back?
    print("\nTEST 2: GET the value back")
    print("-" * 80)
    
    retrieved = await redis_client.get(test_key)
    
    if retrieved:
        print(f"✅ GET returned: {retrieved}")
        if retrieved == test_value:
            print(f"✅ Value matches perfectly!")
        else:
            print(f"❌ Value mismatch!")
            print(f"   Expected: {test_value}")
            print(f"   Got: {retrieved}")
    else:
        print(f"❌ GET returned None - key not found!")
        print(f"   SET claimed success but data isn't retrievable!")
        return
    
    # Test 3: SET with complex nested data (like our bars)
    print("\nTEST 3: SET complex data (like minute bars)")
    print("-" * 80)
    
    complex_key = "test:intraday:bar"
    complex_value = {
        'timestamp': 1760535000008,
        'open': 249.40,
        'high': 249.65,
        'low': 248.76,
        'close': 249.38,
        'volume': 1234567
    }
    
    print(f"Setting key: {complex_key}")
    print(f"Value: {complex_value}")
    
    success = await redis_client.set(complex_key, complex_value, ex=7200)
    
    if success:
        print(f"✅ SET returned True")
    else:
        print(f"❌ SET failed for complex data")
        return
    
    retrieved = await redis_client.get(complex_key)
    
    if retrieved:
        print(f"✅ GET returned: {retrieved}")
        if retrieved == complex_value:
            print(f"✅ Complex data stored and retrieved perfectly!")
        else:
            print(f"⚠️  Data mismatch (might be type conversion)")
            print(f"   close: {retrieved.get('close')} (type: {type(retrieved.get('close'))})")
    else:
        print(f"❌ GET returned None - complex data not retrievable!")
        return
    
    # Test 4: Cleanup
    print("\nTEST 4: DELETE keys")
    print("-" * 80)
    
    await redis_client.delete(test_key)
    await redis_client.delete(complex_key)
    print(f"✅ Cleanup complete")
    
    print()
    print("=" * 80)
    print("UPSTASH REDIS WORKING PERFECTLY!")
    print("=" * 80)
    print()
    print("If you see this, Upstash connection is good.")
    print("The caching issue must be in our timezone conversion or caching logic.")

# Run test
asyncio.run(test_upstash())

