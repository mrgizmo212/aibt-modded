#!/usr/bin/env python3
"""
Check what models exist in the database for your user
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from supabase import create_client
from config import settings

def check_models():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    print("=" * 80)
    print("CHECKING ALL MODELS IN DATABASE")
    print("=" * 80)
    print()
    
    # Get all models with user info
    result = supabase.table("models")\
        .select("id, name, signature, user_id, default_ai_model, created_at")\
        .order("id")\
        .execute()
    
    if not result.data:
        print("❌ No models found in database")
        return
    
    # Get user emails
    user_ids = list(set(m['user_id'] for m in result.data))
    users = {}
    for uid in user_ids:
        user_result = supabase.table("profiles").select("id, email").eq("id", uid).execute()
        if user_result.data:
            users[uid] = user_result.data[0]['email']
    
    print(f"✅ Found {len(result.data)} model(s):")
    print()
    print(f"{'ID':<6} {'Name':<30} {'AI Model':<25} {'Owner':<30}")
    print("-" * 95)
    
    for model in result.data:
        model_id = model.get('id', 'N/A')
        name = model.get('name', 'N/A')[:29]
        ai_model = model.get('default_ai_model', 'N/A')[:24]
        owner = users.get(model.get('user_id'), 'Unknown')[:29]
        
        print(f"{model_id:<6} {name:<30} {ai_model:<25} {owner:<30}")
    
    print()
    print("=" * 80)
    print()
    
    # Show your models specifically
    print("YOUR MODELS (adam@truetradinggroup.com):")
    print("-" * 80)
    
    adam_user_id = None
    for uid, email in users.items():
        if email == 'adam@truetradinggroup.com':
            adam_user_id = uid
            break
    
    if adam_user_id:
        your_models = [m for m in result.data if m['user_id'] == adam_user_id]
        print(f"\n✅ You have {len(your_models)} model(s):")
        for m in your_models:
            print(f"   - ID {m['id']}: {m['name']}")
    else:
        print("❌ No user found with email adam@truetradinggroup.com")
    
    print()

if __name__ == '__main__':
    check_models()

