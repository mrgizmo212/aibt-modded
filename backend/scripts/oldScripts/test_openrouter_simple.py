"""
Simple OpenRouter API Key Test
Tests if the API key can make a basic request
"""

import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")

print("=" * 80)
print("OPENROUTER API KEY TEST")
print("=" * 80)
print(f"Base URL: {base_url}")
print(f"API Key: {api_key[:20]}...{api_key[-10:] if api_key and len(api_key) > 30 else 'INVALID'}")
print()

if not api_key:
    print("❌ ERROR: OPENAI_API_KEY not found in .env")
    exit(1)

# Test 1: Check if key format is valid
print("TEST 1: API Key Format")
print("-" * 80)
if api_key.startswith("sk-or-v1-"):
    print("✅ Key format looks correct (starts with sk-or-v1-)")
else:
    print(f"⚠️  Unexpected key format (starts with: {api_key[:10]}...)")
print()

# Test 2: Make a simple API request
print("TEST 2: API Request")
print("-" * 80)

try:
    print("📡 Sending test request to OpenRouter...")
    
    response = httpx.post(
        f"{base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://aibt.truetradinggroup.com",
            "X-Title": "AIBT Test",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-4o",  # Use the same model as your agent
            "messages": [
                {"role": "user", "content": "Say 'test successful' in exactly 2 words."}
            ],
            "max_tokens": 10
        },
        timeout=30.0
    )
    
    print(f"   Status Code: {response.status_code}")
    print()
    
    if response.status_code == 200:
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        print(f"✅ SUCCESS! Response: {content}")
        print()
        print("=" * 80)
        print("✅ OpenRouter API Key is VALID and WORKING")
        print("=" * 80)
        print("\n⚡ Your key works! The 401 error must be from something else.")
        print("   Checking agent configuration...")
        
    elif response.status_code == 401:
        print("❌ AUTHENTICATION FAILED (401)")
        print()
        try:
            error_data = response.json()
            print(f"   Error Details: {error_data}")
        except:
            print(f"   Raw Response: {response.text}")
        print()
        print("=" * 80)
        print("❌ OpenRouter API Key is INVALID")
        print("=" * 80)
        print("\n🔧 How to fix:")
        print("   1. Go to https://openrouter.ai/keys")
        print("   2. Generate a new API key")
        print("   3. Update OPENAI_API_KEY in backend/.env")
        print("   4. Restart the backend")
        
    else:
        print(f"⚠️  Unexpected Status Code: {response.status_code}")
        print(f"   Response: {response.text}")

except httpx.TimeoutException:
    print("❌ Request timed out")
    print("   Check your internet connection or OpenRouter status")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print()

