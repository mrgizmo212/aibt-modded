"""
Test MCP Services Connectivity
Verifies all 4 MCP services are running and accessible
"""

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("🔧 MCP SERVICES CONNECTIVITY TEST")
print("=" * 80)
print()

# Service configurations
services = {
    'Math': {
        'port': int(os.getenv('MATH_HTTP_PORT', '8000')),
        'url': f"http://localhost:{os.getenv('MATH_HTTP_PORT', '8000')}/mcp"
    },
    'Search': {
        'port': int(os.getenv('SEARCH_HTTP_PORT', '8001')),
        'url': f"http://localhost:{os.getenv('SEARCH_HTTP_PORT', '8001')}/mcp"
    },
    'Trade': {
        'port': int(os.getenv('TRADE_HTTP_PORT', '8002')),
        'url': f"http://localhost:{os.getenv('TRADE_HTTP_PORT', '8002')}/mcp"
    },
    'Price': {
        'port': int(os.getenv('GETPRICE_HTTP_PORT', '8003')),
        'url': f"http://localhost:{os.getenv('GETPRICE_HTTP_PORT', '8003')}/mcp"
    }
}

results = {}
success_count = 0

for name, config in services.items():
    print(f"Testing {name} Service (port {config['port']})...")
    print(f"  URL: {config['url']}")
    
    try:
        # Try to connect
        response = httpx.get(config['url'], timeout=5.0)
        
        if response.status_code == 200:
            print(f"  ✅ ONLINE - Status {response.status_code}")
            success_count += 1
            results[name] = "online"
        else:
            print(f"  ⚠️  Responded but status {response.status_code}")
            results[name] = f"status_{response.status_code}"
            
    except httpx.ConnectError:
        print(f"  ❌ OFFLINE - Cannot connect")
        print(f"     Service not running on port {config['port']}")
        results[name] = "offline"
        
    except httpx.TimeoutException:
        print(f"  ❌ TIMEOUT - Service not responding")
        results[name] = "timeout"
        
    except Exception as e:
        print(f"  ❌ ERROR - {str(e)[:60]}")
        results[name] = "error"
    
    print()

# Summary
print("=" * 80)
print("📊 RESULTS")
print("=" * 80)
print()

for name, status in results.items():
    icon = "✅" if status == "online" else "❌"
    print(f"{icon} {name:12} {status}")

print()
print(f"Services Online: {success_count}/4")
print()

if success_count == 4:
    print("✅ ALL MCP SERVICES RUNNING")
    print("   AI trading agents can connect successfully")
else:
    print("❌ SOME SERVICES OFFLINE")
    print("   AI trading will not work until all services are running")
    print()
    print("🔧 TO FIX:")
    print("   The backend should auto-start MCP services")
    print("   Check backend startup logs for:")
    print("   '✅ MCP services ready'")
    print()
    print("   If MCP services didn't start:")
    print("   1. Check backend/mcp_services/ directory exists")
    print("   2. Check all .py files exist in that directory")
    print("   3. Look for errors in backend startup")

print()
print("=" * 80)

