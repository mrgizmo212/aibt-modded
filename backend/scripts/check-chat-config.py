"""Quick diagnostic: Check global chat settings"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings
from supabase import create_client

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

print("Checking global_chat_settings...")
result = supabase.table("global_chat_settings").select("*").eq("id", 1).execute()

if result.data:
    config = result.data[0]
    print(f"\n✅ Global chat settings found:")
    print(f"   Model: {config.get('chat_model')}")
    print(f"   Parameters: {config.get('model_parameters')}")
    print(f"   Instructions: {len(config.get('chat_instructions', ''))} chars")
else:
    print("\n⚠️  No global chat settings configured (using fallback)")
    print("   Fallback model: openai/gpt-4.1-mini")
    print("   Fallback params: temperature=0.3, top_p=0.9")

print(f"\n✅ API Key from env: {settings.OPENAI_API_KEY[:20]}...")

