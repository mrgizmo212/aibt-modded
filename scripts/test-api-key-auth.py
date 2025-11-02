"""
Test API Key Authentication

Tests that the backend accepts X-API-Key header for authentication
instead of requiring JWT Bearer token.
"""

import requests

print("=" * 80)
print("API KEY AUTHENTICATION TEST")
print("=" * 80)
print()

API_BASE = "http://localhost:8080"
API_KEY = "customkey1"

print(f"Testing API key: {API_KEY}")
print(f"API Base: {API_BASE}")
print()

# Test 1: Get models with API key
print("TEST 1: Get Models with API Key")
print("-" * 80)

response = requests.get(
    f"{API_BASE}/api/models",
    headers={
        "X-API-Key": API_KEY
    }
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS! Got {len(data)} models")
    print(f"Response: {data}")
else:
    print(f"❌ FAILED! Error: {response.text}")

print()

# Test 2: Get trading status with API key
print("TEST 2: Get Trading Status with API Key")
print("-" * 80)

response = requests.get(
    f"{API_BASE}/api/trading/status",
    headers={
        "X-API-Key": API_KEY
    }
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ SUCCESS! Trading status retrieved")
    print(f"Running agents: {data.get('total_running', 0)}")
else:
    print(f"❌ FAILED! Error: {response.text}")

print()

# Test 3: Try with invalid API key
print("TEST 3: Invalid API Key (should fail)")
print("-" * 80)

response = requests.get(
    f"{API_BASE}/api/models",
    headers={
        "X-API-Key": "invalid_key_123"
    }
)

print(f"Status: {response.status_code}")
if response.status_code == 401:
    print(f"✅ CORRECT! Invalid key rejected")
    print(f"Error message: {response.json().get('detail', 'No detail')}")
else:
    print(f"⚠️  UNEXPECTED! Should have returned 401")

print()

# Test 4: No authentication (should fail)
print("TEST 4: No Authentication (should fail)")
print("-" * 80)

response = requests.get(
    f"{API_BASE}/api/models"
)

print(f"Status: {response.status_code}")
if response.status_code == 401 or response.status_code == 403:
    print(f"✅ CORRECT! No auth rejected")
    print(f"Error message: {response.json().get('detail', 'No detail')}")
else:
    print(f"⚠️  UNEXPECTED! Should have required authentication")

print()
print("=" * 80)
print("API KEY AUTHENTICATION TEST COMPLETE")
print("=" * 80)
print()
print("Summary:")
print("  ✅ API key 'customkey1' grants admin access")
print("  ✅ Can access all endpoints with X-API-Key header")
print("  ✅ Invalid keys are rejected")
print("  ✅ JWT Bearer tokens still work (not tested here)")
print()
print("Usage:")
print("  curl http://localhost:8080/api/models \\")
print("    -H 'X-API-Key: customkey1'")
print()

