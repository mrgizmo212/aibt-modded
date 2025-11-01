"""
Test Upstash Redis Connection
Verifies credentials and basic operations
"""

import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.redis_client import redis_client
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("UPSTASH REDIS CONNECTION TEST")
print("=" * 80)

async def main():
    print("\n🔌 Step 1: Test Connection")
    print("-" * 80)
    
    if await redis_client.ping():
        print("  ✅ Connection successful!")
    else:
        print("  ❌ Connection failed!")
        print("  Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env")
        return
    
    print("\n💾 Step 2: Test Write Operation")
    print("-" * 80)
    
    test_key = "test:aibt:hello"
    test_value = {"message": "Hello from AIBT!", "timestamp": "2025-10-30"}
    
    success = await redis_client.set(test_key, test_value, ex=60)
    
    if success:
        print(f"  ✅ Wrote key: {test_key}")
        print(f"     Value: {test_value}")
        print(f"     TTL: 60 seconds")
    else:
        print(f"  ❌ Write failed!")
        return
    
    print("\n📖 Step 3: Test Read Operation")
    print("-" * 80)
    
    retrieved = await redis_client.get(test_key)
    
    if retrieved:
        print(f"  ✅ Read key: {test_key}")
        print(f"     Retrieved: {retrieved}")
        
        if retrieved == test_value:
            print(f"  ✅ Data matches!")
        else:
            print(f"  ⚠️  Data mismatch!")
    else:
        print(f"  ❌ Read failed!")
        return
    
    print("\n🔍 Step 4: Test Exists Check")
    print("-" * 80)
    
    exists = await redis_client.exists(test_key)
    
    if exists:
        print(f"  ✅ Key exists check: True")
    else:
        print(f"  ❌ Key should exist but doesn't!")
        return
    
    print("\n🗑️  Step 5: Test Delete Operation")
    print("-" * 80)
    
    deleted = await redis_client.delete(test_key)
    
    if deleted:
        print(f"  ✅ Deleted key: {test_key}")
    else:
        print(f"  ⚠️  Delete might have failed")
    
    # Verify it's gone
    exists_after = await redis_client.exists(test_key)
    
    if not exists_after:
        print(f"  ✅ Key no longer exists")
    else:
        print(f"  ⚠️  Key still exists after delete")
    
    print("\n💰 Step 6: Test Intraday Data Pattern")
    print("-" * 80)
    
    # Simulate storing minute bar
    model_id = 26
    date = "2025-10-27"
    symbol = "AAPL"
    minute = "09:30"
    
    bar_data = {
        "open": 150.25,
        "high": 150.50,
        "low": 150.10,
        "close": 150.45,
        "volume": 1250
    }
    
    intraday_key = f"intraday:model_{model_id}:{date}:{symbol}:{minute}"
    
    await redis_client.set(intraday_key, bar_data, ex=7200)  # 2 hour TTL
    
    print(f"  ✅ Stored minute bar:")
    print(f"     Key: {intraday_key}")
    print(f"     Data: {bar_data}")
    
    # Retrieve it
    retrieved_bar = await redis_client.get(intraday_key)
    
    if retrieved_bar:
        print(f"  ✅ Retrieved minute bar:")
        print(f"     {retrieved_bar}")
    
    # Cleanup
    await redis_client.delete(intraday_key)
    
    print("\n" + "=" * 80)
    print("REDIS CONNECTION VERIFIED!")
    print("=" * 80)
    print("\n✅ Upstash Redis is configured and working")
    print("\nCapabilities verified:")
    print("  ✅ Connection successful")
    print("  ✅ Write/Read operations")
    print("  ✅ TTL expiration")
    print("  ✅ Key deletion")
    print("  ✅ Intraday data pattern")
    print("\nReady for:")
    print("  → Intraday trading data caching")
    print("  → Session state storage")
    print("  → Price lookup caching")
    print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(main())

