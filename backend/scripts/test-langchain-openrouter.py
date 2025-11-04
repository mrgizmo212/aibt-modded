"""
Test LangChain ChatOpenAI with OpenRouter
Quick diagnostic to see what's wrong
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from config import settings
from langchain_openai import ChatOpenAI

async def test_openrouter():
    print("Testing LangChain ChatOpenAI with OpenRouter...")
    print(f"API Key: {settings.OPENAI_API_KEY[:20]}...")
    print(f"API Base: https://openrouter.ai/api/v1")
    
    # Test with correct parameter names (matching existing working endpoint)
    print("\n✅ Testing with base_url and api_key (like existing endpoint)...")
    try:
        chat = ChatOpenAI(
            model="openai/gpt-4.1-mini",
            temperature=0.3,
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENAI_API_KEY,
            max_tokens=50
        )
        
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello"}
        ]
        
        print("Sending request...")
        response = await chat.ainvoke(messages)
        print(f"✅ SUCCESS! Response: {response.content}")
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_openrouter())

