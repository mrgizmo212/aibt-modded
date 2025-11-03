"""
Cleanup Orphaned Running Runs
Finds runs stuck in 'running' status and marks them as failed or deletes them
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

from supabase import create_client
from config import settings
from celery_app import celery_app

def cleanup_orphaned_runs():
    """Find and cleanup orphaned running runs"""
    print("=" * 60)
    print("Cleaning Up Orphaned Running Runs")
    print("=" * 60)
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # Get all runs marked as 'running'
    result = supabase.table("trading_runs")\
        .select("*")\
        .eq("status", "running")\
        .execute()
    
    running_runs = result.data or []
    
    print(f"\n📊 Found {len(running_runs)} runs marked as 'running'")
    
    if not running_runs:
        print("✅ No orphaned runs found!")
        return
    
    # Check each run's Celery task status
    cleaned = 0
    for run in running_runs:
        run_id = run['id']
        run_number = run['run_number']
        model_id = run['model_id']
        task_id = run.get('task_id')
        
        print(f"\n🔍 Checking Run #{run_number} (model {model_id}):")
        print(f"   task_id: {task_id}")
        
        should_cleanup = False
        
        if not task_id:
            # No task_id = old run from before Celery
            print(f"   ❌ No task_id - this is an old run")
            should_cleanup = True
        else:
            # Check if Celery task still exists
            try:
                from celery.result import AsyncResult
                result = AsyncResult(task_id, app=celery_app)
                state = result.state
                
                print(f"   Task state: {state}")
                
                # If task is in terminal state, cleanup
                if state in ['SUCCESS', 'FAILURE', 'REVOKED']:
                    print(f"   ❌ Task already completed/failed - orphaned")
                    should_cleanup = True
                elif state == 'PENDING':
                    # Check how old the run is
                    from datetime import datetime, timedelta
                    started_at = datetime.fromisoformat(run['started_at'].replace('Z', '+00:00'))
                    age = datetime.now(started_at.tzinfo) - started_at
                    
                    if age > timedelta(hours=12):
                        print(f"   ❌ Task pending for {age.total_seconds()/3600:.1f}h - orphaned")
                        should_cleanup = True
                else:
                    print(f"   ✅ Task still active")
            except Exception as e:
                print(f"   ⚠️  Could not check task status: {e}")
                # Don't cleanup if we can't verify
        
        if should_cleanup:
            print(f"   🗑️  Deleting orphaned Run #{run_number}...")
            
            try:
                supabase.table("trading_runs").delete().eq("id", run_id).execute()
                print(f"   ✅ Deleted Run #{run_number}")
                cleaned += 1
            except Exception as e:
                print(f"   ❌ Failed to delete: {e}")
    
    print("\n" + "=" * 60)
    print(f"✅ Cleanup Complete!")
    print(f"   Deleted: {cleaned} orphaned runs")
    print(f"   Remaining: {len(running_runs) - cleaned} active runs")
    print("=" * 60)

if __name__ == "__main__":
    cleanup_orphaned_runs()

