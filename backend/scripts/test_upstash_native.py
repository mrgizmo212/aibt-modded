"""
Test Upstash Native Redis Connection
Phase 0.3 - Verify native Redis protocol works
"""

import redis
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

def test_upstash_native():
    """Test Upstash native Redis protocol"""
    print("=" * 60)
    print("Testing Upstash Native Redis Connection")
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
        print("\n❌ ERROR: Missing REDIS_HOST or REDIS_PASSWORD in .env")
        return False
    
    try:
        # Connect using native protocol
        print("\n📡 Connecting to Upstash...")
        client = redis.Redis(
            host=host,
            port=port,
            password=password,
            ssl=use_tls,
            decode_responses=True,
            socket_connect_timeout=5
        )
        
        # Test PING
        print("  Testing PING...")
        result = client.ping()
        print(f"  ✅ PING successful: {result}")
        
        # Test SET
        print("  Testing SET...")
        client.set("test:native:key", "test-value", ex=60)
        print("  ✅ SET successful (TTL: 60 seconds)")
        
        # Test GET
        print("  Testing GET...")
        value = client.get("test:native:key")
        print(f"  ✅ GET successful: {value}")
        
        # Test DELETE
        print("  Testing DELETE...")
        client.delete("test:native:key")
        print("  ✅ DELETE successful")
        
        # Final verification
        deleted_check = client.get("test:native:key")
        if deleted_check is None:
            print("  ✅ Verified: Key was deleted")
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS: Upstash native Redis works!")
        print("=" * 60)
        print("\n✅ Phase 0.3 PASSED - Proceed to Phase 0.4 (BullMQ test)")
        return True
        
    except Exception as e:
        print(f"\n❌ CONNECTION FAILED: {e}")
        print("\nTroubleshooting:")
        print("  1. Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD in .env")
        print("  2. Check Upstash dashboard for correct credentials")
        print("  3. Ensure native Redis is enabled on your Upstash database")
        return False

if __name__ == "__main__":
    success = test_upstash_native()
    sys.exit(0 if success else 1)

