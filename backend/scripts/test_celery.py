"""
Test Celery configuration and task execution
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from celery_app import celery_app
from celery.result import AsyncResult


def test_celery_connection():
    """Test Celery can connect to Redis"""
    print("=" * 60)
    print("Testing Celery Configuration")
    print("=" * 60)
    
    # Test 1: Ping broker
    print("\n🔍 Test 1: Ping Redis broker...")
    try:
        celery_app.control.inspect().ping()
        print("  ✅ Broker connected")
    except Exception as e:
        print(f"  ❌ Broker connection failed: {e}")
        return False
    
    # Test 2: Check registered tasks
    print("\n🔍 Test 2: Check registered tasks...")
    try:
        registered = celery_app.control.inspect().registered()
        if registered:
            print(f"  ✅ Found tasks: {list(registered.values())[0] if registered else 'None'}")
        else:
            print("  ⚠️  No workers running (this is okay for now)")
    except Exception as e:
        print(f"  ❌ Error checking tasks: {e}")
    
    # Test 3: Queue a simple task
    print("\n🔍 Test 3: Queue test task...")
    try:
        # Just test the queue, don't actually run
        result = celery_app.send_task('workers.run_intraday_trading', 
                                      args=[169, 'test-user', 'AAPL', '2024-01-15', 'regular', 'gpt-4o'],
                                      ignore_result=True)
        print(f"  ✅ Task queued: {result.id}")
        print("  ℹ️  Task won't execute without worker running")
    except Exception as e:
        print(f"  ❌ Failed to queue task: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ Celery Configuration Valid!")
    print("=" * 60)
    print("\n📝 Next Steps:")
    print("  1. Start Celery worker: celery -A celery_app worker --loglevel=info")
    print("  2. Test actual task execution")
    print("  3. Deploy to production")
    
    return True


if __name__ == "__main__":
    test_celery_connection()

