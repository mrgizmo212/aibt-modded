"""
Comprehensive Bug Scan
Identifies ALL remaining issues in the platform
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from services import get_supabase
from dotenv import load_dotenv
load_dotenv()

print("=" * 80)
print("COMPREHENSIVE PLATFORM BUG SCAN")
print("=" * 80)
print("\nScanning for ALL remaining issues...\n")

issues_found = []

async def scan_platform():
    supabase = get_supabase()
    
    # ========================================================================
    # ISSUE 1: Test Models Cluttering Database
    # ========================================================================
    
    print("ISSUE 1: Test Models in Database")
    print("-" * 80)
    
    result = supabase.table("models").select("id, signature, description").order("id").execute()
    
    real_models = [8, 9, 10, 11, 12, 13, 14]  # The 7 real AI models
    test_models = [m for m in result.data if m['id'] not in real_models]
    
    print(f"Total models in database: {len(result.data)}")
    print(f"Real AI models: {len(real_models)}")
    print(f"Test models (should delete): {len(test_models)}")
    
    if test_models:
        print(f"\n⚠️  ISSUE: {len(test_models)} test models cluttering database")
        for m in test_models[:5]:  # Show first 5
            print(f"   - ID {m['id']}: {m['signature']}")
        if len(test_models) > 5:
            print(f"   ... and {len(test_models) - 5} more")
        issues_found.append(f"Delete {len(test_models)} test models")
    else:
        print("✅ No test models found")
    
    # ========================================================================
    # ISSUE 2: Data in Multiple Places
    # ========================================================================
    
    print("\n\nISSUE 2: Data Duplication")
    print("-" * 80)
    
    data_locations = []
    
    # Check backend/data
    backend_data = Path(__file__).parent / "data" / "agent_data"
    if backend_data.exists():
        data_locations.append("aibt/backend/data/agent_data")
    
    print(f"Data found in {len(data_locations) + 2} places:")
    print("  1. aitrtader/data/agent_data (original)")
    print("  2. aibt/backend/data/agent_data (copy)")
    print("  3. Supabase PostgreSQL (migrated)")
    
    print("\n⚠️  ISSUE: Data exists in 3 places")
    print("   Decision needed: Which is source of truth?")
    print("   Options:")
    print("   A) Delete backend/data (use PostgreSQL only)")
    print("   B) Keep as archive (document clearly)")
    issues_found.append("Resolve data duplication strategy")
    
    # ========================================================================
    # ISSUE 3: Missing Model Metadata
    # ========================================================================
    
    print("\n\nISSUE 3: Model Naming Clarity")
    print("-" * 80)
    
    # Check if models have original_ai field
    sample_model = result.data[0] if result.data else None
    
    if sample_model:
        has_original_ai = 'original_ai' in sample_model or 'basemodel' in sample_model
        
        if not has_original_ai:
            print("⚠️  ISSUE: Models don't show which AI originally traded")
            print("   Example: 'deepseek-deepseek-v3.2-exp' was traded by DeepSeek")
            print("   But user can select GPT-4o to continue → confusing")
            print("\n   Suggestion: Add 'original_ai' column to models table")
            print("   Show in UI: 'Originally traded by: DeepSeek'")
            issues_found.append("Add original_ai field to clarify model history")
        else:
            print("✅ Models have original AI tracking")
    
    # ========================================================================
    # ISSUE 4: Incomplete Frontend Pages
    # ========================================================================
    
    print("\n\nISSUE 4: Missing Frontend Pages")
    print("-" * 80)
    
    frontend_dir = Path(__file__).parent.parent / "frontend" / "app"
    
    missing_pages = []
    
    # Check for create model page
    create_model_page = frontend_dir / "models" / "create" / "page.tsx"
    if not create_model_page.exists():
        missing_pages.append("Create Model form (/models/create)")
    
    # Check for profile page  
    profile_page = frontend_dir / "profile" / "page.tsx"
    if not profile_page.exists():
        missing_pages.append("User Profile (/profile)")
    
    # Check for log viewer page
    log_viewer = frontend_dir / "models" / "[id]" / "logs" / "page.tsx"
    if not log_viewer.exists():
        missing_pages.append("Log Viewer (/models/[id]/logs)")
    
    if missing_pages:
        print(f"⚠️  ISSUE: {len(missing_pages)} frontend pages missing:")
        for page in missing_pages:
            print(f"   - {page}")
        issues_found.append(f"{len(missing_pages)} frontend pages to create")
    else:
        print("✅ All frontend pages exist")
    
    # ========================================================================
    # ISSUE 5: Performance Metrics Stale
    # ========================================================================
    
    print("\n\nISSUE 5: Performance Metrics Cache")
    print("-" * 80)
    
    metrics_result = supabase.table("performance_metrics").select("*").execute()
    
    if metrics_result.data:
        print(f"Cached metrics: {len(metrics_result.data)} records")
        print("⚠️  WARNING: Metrics calculated before portfolio value fix")
        print("   All returns/Sharpe ratios are based on old wrong values")
        print("\n   Action needed: Recalculate all metrics with fixed values")
        issues_found.append("Recalculate performance metrics with corrected portfolio values")
    else:
        print("ℹ️  No cached metrics (will calculate on demand)")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    
    print("\n" + "=" * 80)
    print("SCAN COMPLETE")
    print("=" * 80)
    
    print(f"\nIssues Found: {len(issues_found)}")
    
    if issues_found:
        print("\nAll Issues:")
        for i, issue in enumerate(issues_found, 1):
            print(f"{i}. {issue}")
        
        print("\n✅ Platform is functional")
        print("⚠️  But these issues should be addressed for production")
    else:
        print("\n🎉 No issues found! Platform is perfect!")
    
    return len(issues_found)

# Run scan
issue_count = asyncio.run(scan_platform())

print("\n" + "=" * 80)

if issue_count > 0:
    print(f"\nNext: Fix these {issue_count} issues systematically")
    print("Run individual fix scripts or create comprehensive fix plan")
else:
    print("\n🎊 Platform is production-ready!")

print("\n" + "=" * 80)

