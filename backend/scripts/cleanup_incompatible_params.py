#!/usr/bin/env python3
"""
Script to check and clean up deprecated/incompatible parameters from database
- Removes deprecated max_tokens when max_completion_tokens exists
- Removes GPT-5 incompatible parameters (temperature, top_p) for GPT-5/reasoning models
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client

# Add parent directory to path to import backend modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print(f"❌ Missing Supabase credentials")
        print(f"   Looking for: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL")
        print(f"   Looking for: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY")
        print(f"   .env path: {env_path}")
        print(f"   .env exists: {os.path.exists(env_path)}")
        raise ValueError("Missing Supabase credentials in environment")
    
    return create_client(url, key)

def is_gpt5_or_reasoning_model(model_id: str) -> bool:
    """Check if model is GPT-5 or reasoning type"""
    if not model_id:
        return False
    
    model_lower = model_id.lower()
    
    # GPT-5 models
    if any(x in model_lower for x in ['gpt-5', 'gpt5']):
        return True
    
    # Reasoning models (o-series, QwQ)
    if any(x in model_lower for x in ['o1', 'o3', 'qwq', 'o-mini']):
        return True
    
    return False

def cleanup_parameters(params: dict, model_id: str = None) -> tuple[dict, list]:
    """
    Clean up deprecated and incompatible parameters
    
    Returns:
        (cleaned_params, changes_made)
    """
    if not params:
        return params, []
    
    cleaned = params.copy()
    changes = []
    
    # 1. Remove deprecated max_tokens if max_completion_tokens exists
    if 'max_completion_tokens' in cleaned and 'max_tokens' in cleaned:
        del cleaned['max_tokens']
        changes.append("Removed deprecated 'max_tokens' (max_completion_tokens exists)")
    
    # 2. Remove GPT-5/reasoning incompatible parameters
    if model_id and is_gpt5_or_reasoning_model(model_id):
        if 'temperature' in cleaned:
            del cleaned['temperature']
            changes.append(f"Removed 'temperature' (incompatible with {model_id})")
        
        if 'top_p' in cleaned:
            del cleaned['top_p']
            changes.append(f"Removed 'top_p' (incompatible with {model_id})")
    
    return cleaned, changes

def main(dry_run: bool = True):
    """
    Check and optionally clean up database
    
    Args:
        dry_run: If True, only report issues without making changes
    """
    print("=" * 80)
    print(f"🔍 Database Parameter Cleanup - {'DRY RUN' if dry_run else 'LIVE MODE'}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    print()
    
    supabase = get_supabase_client()
    
    # Fetch all models with parameters
    print("📊 Fetching all models from database...")
    result = supabase.table("models").select("id, name, default_ai_model, model_parameters").execute()
    
    if not result.data:
        print("✅ No models found in database")
        return
    
    print(f"   Found {len(result.data)} models\n")
    
    models_with_issues = []
    models_cleaned = []
    
    for model in result.data:
        model_id = model.get('id')
        model_name = model.get('name', 'Unnamed')
        ai_model = model.get('default_ai_model')
        params = model.get('model_parameters')
        
        if not params:
            continue
        
        # Check for issues
        cleaned_params, changes = cleanup_parameters(params, ai_model)
        
        if changes:
            models_with_issues.append({
                'id': model_id,
                'name': model_name,
                'ai_model': ai_model,
                'original_params': params,
                'cleaned_params': cleaned_params,
                'changes': changes
            })
    
    # Report findings
    if not models_with_issues:
        print("✅ All models are clean! No incompatible parameters found.")
        return
    
    print(f"⚠️  Found {len(models_with_issues)} model(s) with issues:\n")
    
    for issue in models_with_issues:
        print(f"📦 Model #{issue['id']}: {issue['name']}")
        print(f"   AI Model: {issue['ai_model']}")
        print(f"   Issues Found:")
        for change in issue['changes']:
            print(f"      • {change}")
        print(f"   Original params: {issue['original_params']}")
        print(f"   Cleaned params:  {issue['cleaned_params']}")
        print()
    
    # Apply fixes if not dry run
    if not dry_run:
        print("🔧 Applying fixes to database...")
        for issue in models_with_issues:
            try:
                supabase.table("models")\
                    .update({"model_parameters": issue['cleaned_params']})\
                    .eq("id", issue['id'])\
                    .execute()
                models_cleaned.append(issue['id'])
                print(f"   ✅ Cleaned model #{issue['id']}: {issue['name']}")
            except Exception as e:
                print(f"   ❌ Error cleaning model #{issue['id']}: {e}")
        
        print(f"\n✅ Successfully cleaned {len(models_cleaned)} model(s)")
    else:
        print("ℹ️  DRY RUN - No changes made to database")
        print("   Run with --apply flag to apply changes\n")
    
    print("=" * 80)
    print("✅ Done!")
    print("=" * 80)

if __name__ == "__main__":
    # Check for --apply flag
    apply = "--apply" in sys.argv or "-a" in sys.argv
    
    if apply:
        confirm = input("⚠️  This will modify the database. Continue? (yes/no): ")
        if confirm.lower() != "yes":
            print("❌ Aborted")
            sys.exit(0)
    
    main(dry_run=not apply)

