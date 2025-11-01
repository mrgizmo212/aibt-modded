import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

print("=== Testing LangChain OpenRouter Connection ===")
print(f"API Base: {os.getenv('OPENAI_API_BASE')}")
print(f"API Key: {os.getenv('OPENAI_API_KEY')[:20]}...")

# Create ChatOpenAI client
try:
    model = ChatOpenAI(
        model="openai/gpt-4o-mini",
        base_url=os.getenv("OPENAI_API_BASE"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=0.7
    )
    
    print("\n✅ ChatOpenAI client created successfully")
    
    # Try a simple invoke
    print("\n🔄 Sending test message...")
    response = model.invoke("Say 'Hello' if you can read this.")
    print(f"\n✅ Response received: {response.content}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print(f"\nError type: {type(e)}")

