"""
Test Supabase Connection Reliability
Tests multiple concurrent requests to verify connection stability
"""

import os
import asyncio
import time
from dotenv import load_dotenv
from supabase import create_client

# Load environment
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("=" * 80)
print("🧪 SUPABASE CONNECTION TEST")
print("=" * 80)
print()

# Test 1: Single Connection
print("TEST 1: Single Connection")
print("-" * 40)
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = supabase.table("models").select("id, name").limit(1).execute()
    print(f"✅ Single query: SUCCESS")
    print(f"   Returned {len(result.data)} rows")
except Exception as e:
    print(f"❌ Single query: FAILED")
    print(f"   Error: {str(e)}")
print()

# Test 2: Multiple Sequential Connections
print("TEST 2: Multiple Sequential Connections (10 queries)")
print("-" * 40)
success_count = 0
fail_count = 0
start_time = time.time()

for i in range(10):
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = supabase.table("models").select("id").limit(1).execute()
        success_count += 1
        print(f"   Query {i+1}: ✅")
    except Exception as e:
        fail_count += 1
        print(f"   Query {i+1}: ❌ {str(e)[:50]}")

elapsed = time.time() - start_time
print(f"\nResults: {success_count}/10 successful ({success_count*10}%)")
print(f"Time: {elapsed:.2f}s")
print()

# Test 3: Connection Reuse (Same client, multiple queries)
print("TEST 3: Connection Reuse (Same client, 10 queries)")
print("-" * 40)
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    success_count = 0
    fail_count = 0
    
    for i in range(10):
        try:
            result = supabase.table("models").select("id").limit(1).execute()
            success_count += 1
            print(f"   Query {i+1}: ✅")
        except Exception as e:
            fail_count += 1
            print(f"   Query {i+1}: ❌ {str(e)[:50]}")
    
    print(f"\nResults: {success_count}/10 successful ({success_count*10}%)")
except Exception as e:
    print(f"❌ Connection reuse test failed: {str(e)}")
print()

# Test 4: Concurrent Requests (Simulates multiple users)
print("TEST 4: Concurrent Requests (20 simultaneous)")
print("-" * 40)

async def concurrent_query(query_id: int):
    """Single concurrent query"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Simulate async operation
        await asyncio.sleep(0.1)
        result = supabase.table("models").select("id").limit(1).execute()
        return ("success", query_id, None)
    except Exception as e:
        return ("fail", query_id, str(e))

async def run_concurrent_test():
    """Run multiple concurrent queries"""
    tasks = [concurrent_query(i) for i in range(20)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    successes = sum(1 for r in results if isinstance(r, tuple) and r[0] == "success")
    failures = sum(1 for r in results if isinstance(r, tuple) and r[0] == "fail")
    errors = sum(1 for r in results if isinstance(r, Exception))
    
    print(f"   Successes: {successes}")
    print(f"   Failures: {failures}")
    print(f"   Exceptions: {errors}")
    print(f"\nResults: {successes}/20 successful ({successes*5}%)")
    
    # Show first failure if any
    for r in results:
        if isinstance(r, tuple) and r[0] == "fail":
            print(f"\nFirst failure: {r[2][:100]}")
            break

try:
    start_time = time.time()
    asyncio.run(run_concurrent_test())
    elapsed = time.time() - start_time
    print(f"Time: {elapsed:.2f}s")
except Exception as e:
    print(f"❌ Concurrent test failed: {str(e)}")
print()

# Test 5: Connection with Different Tables
print("TEST 5: Multiple Table Access")
print("-" * 40)
tables_to_test = ["models", "positions", "logs", "stock_prices", "profiles"]
success_count = 0

for table in tables_to_test:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        result = supabase.table(table).select("*").limit(1).execute()
        print(f"   {table:15} ✅ ({len(result.data)} rows)")
        success_count += 1
    except Exception as e:
        print(f"   {table:15} ❌ {str(e)[:40]}")

print(f"\nResults: {success_count}/{len(tables_to_test)} tables accessible")
print()

# Summary
print("=" * 80)
print("📊 TEST SUMMARY")
print("=" * 80)
print()
print("✅ If all tests passed: Supabase connection is stable")
print("⚠️  If tests failed: Connection pooling or auth issues detected")
print("🔧 Fix: Use fresh clients per request with persist_session=False")
print()
print("=" * 80)

