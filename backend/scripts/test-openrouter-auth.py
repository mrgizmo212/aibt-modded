"""
Test OpenRouter API Authentication
Verifies that the OPENAI_API_KEY from .env is valid and working
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
import httpx
import json

# Load environment variables
load_dotenv()

def test_openrouter_auth():
    """Test OpenRouter API authentication"""
    
    print("=" * 60)
    print("OpenRouter API Authentication Test")
    print("=" * 60)
    print()
    
    # Get API key
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ ERROR: OPENAI_API_KEY not found in environment variables")
        print("   Check your .env file")
        return False
    
    print(f"✓ API Key found: {api_key[:15]}...{api_key[-10:]}")
    print()
    
    # Test 1: Get available models (simple authentication test)
    print("Test 1: Fetching available models...")
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                "https://openrouter.ai/api/v1/models",
                headers={
                    "Authorization": f"Bearer {api_key}",
                }
            )
            
            if response.status_code == 200:
                print("✅ SUCCESS: Authentication successful!")
                models = response.json()
                
                # Show some available models
                if "data" in models:
                    model_count = len(models["data"])
                    print(f"   Found {model_count} available models")
                    
                    # Show first 5 models
                    print("\n   Sample models:")
                    for model in models["data"][:5]:
                        model_id = model.get("id", "unknown")
                        print(f"   - {model_id}")
                else:
                    print(f"   Response: {json.dumps(models, indent=2)[:200]}...")
                
            elif response.status_code == 401:
                print("❌ FAILED: Authentication failed (401 Unauthorized)")
                print("   Your API key is invalid or expired")
                print(f"   Response: {response.text}")
                return False
            else:
                print(f"❌ FAILED: Unexpected status code {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ ERROR: Request failed with exception: {e}")
        return False
    
    print()
    
    # Test 2: Make a simple chat completion request
    print("Test 2: Testing chat completion...")
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "user", "content": "Say 'API test successful' if you can read this."}
                    ],
                    "max_tokens": 50
                }
            )
            
            if response.status_code == 200:
                print("✅ SUCCESS: Chat completion request successful!")
                result = response.json()
                
                if "choices" in result and len(result["choices"]) > 0:
                    message = result["choices"][0]["message"]["content"]
                    print(f"   AI Response: {message}")
                    
                    # Check usage info
                    if "usage" in result:
                        usage = result["usage"]
                        print(f"   Tokens used: {usage.get('total_tokens', 'unknown')}")
                else:
                    print(f"   Response: {json.dumps(result, indent=2)[:200]}...")
                    
            elif response.status_code == 401:
                print("❌ FAILED: Authentication failed (401 Unauthorized)")
                print("   Your API key is invalid or expired")
                print(f"   Response: {response.text}")
                return False
            elif response.status_code == 402:
                print("❌ FAILED: Payment required (402)")
                print("   Your OpenRouter account may need credits")
                print(f"   Response: {response.text}")
                return False
            elif response.status_code == 429:
                print("⚠️  WARNING: Rate limited (429)")
                print("   Too many requests - this is normal for testing")
                print("   Your API key is valid!")
                return True  # Still consider this a pass
            else:
                print(f"❌ FAILED: Unexpected status code {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ ERROR: Request failed with exception: {e}")
        return False
    
    print()
    print("=" * 60)
    print("✅ All tests passed! OpenRouter API is configured correctly.")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_openrouter_auth()
    sys.exit(0 if success else 1)

