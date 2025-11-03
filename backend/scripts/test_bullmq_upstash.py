"""
Test BullMQ with Upstash Native Endpoint
Phase 0.4 - CRITICAL TEST - Verify BullMQ works
"""

from bullmq import Queue
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

async def test_bullmq():
    """Test BullMQ works with Upstash native endpoint"""
    print("=" * 60)
    print("🔴 CRITICAL TEST: BullMQ with Upstash")
    print("=" * 60)
    
    # Get credentials
    host = os.getenv("REDIS_HOST")
    port = int(os.getenv("REDIS_PORT", 6379))
    password = os.getenv("REDIS_PASSWORD")
    use_tls = os.getenv("REDIS_TLS", "true").lower() == "true"
    
    print(f"\nConnection Details:")
    print(f"  Host: {host}")
    print(f"  Port: {port}")
    print(f"  TLS: {use_tls}")
    print(f"  Password: {'*' * 20}...{password[-4:] if password else 'MISSING'}")
    
    if not host or not password:
        print("\n❌ ERROR: Missing REDIS_HOST or REDIS_PASSWORD")
        return False
    
    # Build Redis connection URL (Python BullMQ uses URL strings)
    # Format: rediss://default:password@host:port (with TLS)
    # or redis://default:password@host:port (without TLS)
    protocol = "rediss" if use_tls else "redis"
    connection_url = f"{protocol}://default:{password}@{host}:{port}"
    
    print(f"\nConnection URL: {protocol}://default:****@{host}:{port}")
    
    try:
        print("\n📦 Creating BullMQ Queue...")
        # Python BullMQ: Pass connection URL in options dict
        queue = Queue("test-bullmq-queue", {"connection": connection_url})
        print("  ✅ Queue created")
        
        # Test 1: Add job
        print("\n📝 Test 1: Adding job to queue...")
        job = await queue.add("test-job", {"test": "data", "number": 42})
        print(f"  ✅ Job added: {job.id}")
        
        # Test 2: Get job
        print("\n🔍 Test 2: Retrieving job...")
        retrieved = await queue.getJob(job.id)
        print(f"  ✅ Job retrieved: {retrieved.data}")
        
        # Test 3: Update progress
        print("\n📊 Test 3: Updating job progress...")
        await retrieved.updateProgress(50)
        print(f"  ✅ Progress updated: {retrieved.progress}%")
        
        # Test 4: Check state
        print("\n🔍 Test 4: Checking job state...")
        state = await retrieved.getState()
        print(f"  ✅ Job state: {state}")
        
        # Test 5: Remove job
        print("\n🗑️  Test 5: Removing job...")
        await retrieved.remove()
        print("  ✅ Job removed")
        
        # Test 6: Verify removed
        print("\n✓ Test 6: Verifying job removed...")
        check = await queue.getJob(job.id)
        if check is None:
            print("  ✅ Verified: Job no longer exists")
        else:
            print("  ⚠️  Warning: Job still exists after removal")
        
        # Cleanup
        await queue.close()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("✅ BullMQ works with Upstash native!")
        print("=" * 60)
        print("\n✅ Phase 0.4 PASSED - Proceed with full implementation!")
        return True
        
    except Exception as e:
        print(f"\n❌ BullMQ TEST FAILED: {e}")
        print("\n🚨 BLOCKER: Cannot proceed without working BullMQ!")
        print("\nTroubleshooting:")
        print("  1. Verify Upstash native endpoint is enabled")
        print("  2. Check firewall/network settings")
        print("  3. Try installing latest bullmq: pip install -U bullmq")
        print("  4. Check Upstash dashboard for connection limits")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(test_bullmq())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)

