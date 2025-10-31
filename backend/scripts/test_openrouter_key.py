"""
Test OpenRouter API Key
Verifies the key works correctly with OpenRouter API
"""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

# Load environment
load_dotenv()

print("=" * 80)
print("OPENROUTER API KEY TEST")
print("=" * 80)

# Get credentials
api_key = os.getenv("OPENAI_API_KEY")
api_base = os.getenv("OPENAI_API_BASE")

print(f"\n📋 Configuration:")
print(f"   Base URL: {api_base}")
print(f"   API Key: {api_key[:20]}...{api_key[-10:] if api_key else 'MISSING'}")

if not api_key:
    print("\n❌ ERROR: OPENAI_API_KEY not found in .env")
    exit(1)

if not api_base:
    print("\n❌ ERROR: OPENAI_API_BASE not found in .env")
    exit(1)

# Test 1: Create ChatOpenAI instance
print(f"\n🧪 Test 1: Creating ChatOpenAI instance...")
try:
    model = ChatOpenAI(
        model="openai/gpt-4o",
        base_url=api_base,
        api_key=api_key,
        max_retries=2,
        timeout=30,
        default_headers={
            "HTTP-Referer": "https://aibt.truetradinggroup.com",
            "X-Title": "AIBT AI Trading Platform"
        }
    )
    print("   ✅ ChatOpenAI instance created")
except Exception as e:
    print(f"   ❌ Failed to create instance: {e}")
    exit(1)

# Test 2: Simple completion
print(f"\n🧪 Test 2: Testing simple completion...")
try:
    messages = [
        HumanMessage(content="Say 'Hello, AIBT!' and nothing else.")
    ]
    
    print("   📡 Sending request to OpenRouter...")
    response = model.invoke(messages)
    
    print(f"   ✅ Response received!")
    print(f"   📄 Content: {response.content}")
    print(f"   📊 Response type: {type(response)}")
    
except Exception as e:
    print(f"   ❌ Completion failed: {e}")
    print(f"\n   Error details:")
    print(f"   {str(e)}")
    exit(1)

# Test 3: Model with actual trading context
print(f"\n🧪 Test 3: Testing with trading-like prompt...")
try:
    messages = [
        HumanMessage(content="You are a trading AI. Analyze this: AAPL stock is at $150. Should I buy? Answer in one sentence.")
    ]
    
    print("   📡 Sending trading prompt...")
    response = model.invoke(messages)
    
    print(f"   ✅ Trading prompt successful!")
    print(f"   📄 AI Response: {response.content}")
    
except Exception as e:
    print(f"   ❌ Trading prompt failed: {e}")
    exit(1)

# Summary
print("\n" + "=" * 80)
print("RESULTS")
print("=" * 80)
print("\n✅ OpenRouter API Key is VALID and WORKING")
print("\n   The key successfully:")
print("   - Authenticated with OpenRouter")
print("   - Created ChatOpenAI instance")
print("   - Sent and received completions")
print("   - Handled trading-like prompts")
print("\n   If AI trading is failing, the issue is NOT the API key.")
print("   Check:")
print("   - MCP tool configuration")
print("   - Agent executor setup")
print("   - LangChain integration")
print("\n" + "=" * 80)

