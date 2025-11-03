"""
Clear old Celery tasks from Redis
Removes test tasks that are causing serialization errors
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from celery_app import celery_app
from celery.result import AsyncResult

def clear_old_tasks():
    """Clear old/stuck tasks from Redis"""
    print("=" * 60)
    print("Clearing Old Celery Tasks from Redis")
    print("=" * 60)
    
    # Known problematic task IDs
    problem_tasks = [
        '153d1ef4-a706-41e8-8c0f-16bc29b21fcb',  # test_task
        '121ee163-0eb1-43e3-a826-ce0821697838',  # bad test data
    ]
    
    print(f"\n🗑️  Clearing {len(problem_tasks)} old test tasks...")
    
    for task_id in problem_tasks:
        try:
            result = AsyncResult(task_id, app=celery_app)
            result.forget()  # Remove task from backend
            print(f"  ✅ Cleared task: {task_id[:20]}...")
        except Exception as e:
            print(f"  ⚠️  Could not clear {task_id[:20]}...: {e}")
    
    # Also try to purge all tasks from queue
    print("\n🧹 Purging all queued tasks...")
    try:
        purged = celery_app.control.purge()
        print(f"  ✅ Purged {purged} tasks from queue")
    except Exception as e:
        print(f"  ⚠️  Could not purge: {e}")
    
    print("\n" + "=" * 60)
    print("✅ Cleanup Complete!")
    print("=" * 60)
    print("\n📝 Worker should now run cleanly without serialization errors")
    print("   Test with real intraday trading task!")

if __name__ == "__main__":
    clear_old_tasks()

