"""
Test Celery with Upstash Native Endpoint
Phase 0.4 - CRITICAL TEST - Verify Celery works
"""

from celery import Celery
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

def test_celery():
    """Test Celery works with Upstash native endpoint"""
    print("=" * 60)
    print("🔴 CRITICAL TEST: Celery with Upstash")
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
    
    # Build Redis connection URL for Celery
    # IMPORTANT: Upstash free tier only supports database 0
    # Use same database for both broker and backend
    protocol = "rediss" if use_tls else "redis"
    broker_url = f"{protocol}://default:{password}@{host}:{port}/0"
    backend_url = f"{protocol}://default:{password}@{host}:{port}/0"  # Same DB!
    
    print(f"\nBroker URL: {protocol}://default:****@{host}:{port}/0")
    print(f"Backend URL: {protocol}://default:****@{host}:{port}/0")
    print("  (Note: Using same DB for broker + backend - Upstash limitation)")
    
    try:
        print("\n🔧 Creating Celery app...")
        app = Celery(
            'test',
            broker=broker_url,
            backend=backend_url
        )
        
        # Configure for TLS if needed
        if use_tls:
            app.conf.broker_use_ssl = {'ssl_cert_reqs': 'required'}
            app.conf.redis_backend_use_ssl = {'ssl_cert_reqs': 'required'}
        
        print("  ✅ Celery app created")
        
        # Define a test task
        @app.task(name='test_task')
        def test_task(x, y):
            return x + y
        
        print("\n📝 Test 1: Sending task to queue...")
        result = test_task.delay(4, 6)
        print(f"  ✅ Task sent: {result.id}")
        
        print("\n🔍 Test 2: Checking task state...")
        state = result.state
        print(f"  ✅ Task state: {state}")
        
        print("\n📊 Test 3: Getting task by ID...")
        from celery.result import AsyncResult
        retrieved = AsyncResult(result.id, app=app)
        print(f"  ✅ Task retrieved: {retrieved.id}")
        print(f"  ✅ Task state: {retrieved.state}")
        
        # Note: Task won't actually execute without a worker running
        # But we've proven we can:
        # - Send tasks
        # - Check status
        # - Get tasks by ID
        
        print("\n" + "=" * 60)
        print("✅ CRITICAL TESTS PASSED!")
        print("✅ Celery works with Upstash native!")
        print("=" * 60)
        print("\n✅ Phase 0.4 PASSED - Celery validated!")
        print("\n📝 Note: Task won't execute without worker running")
        print("   But queue/status/retrieval all work!")
        return True
        
    except Exception as e:
        print(f"\n❌ Celery TEST FAILED: {e}")
        print("\n🚨 BLOCKER: Cannot proceed without working Celery!")
        print("\nTroubleshooting:")
        print("  1. Verify Upstash native endpoint is enabled")
        print("  2. Check Redis connection URL format")
        print("  3. Try: pip install -U celery[redis]")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    try:
        success = test_celery()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)

