"""
Trading Run Management Service
Handles creation, tracking, and querying of trading runs
"""

from typing import Dict, List, Optional
from datetime import datetime
from supabase import create_client, Client
from config import settings

def get_supabase() -> Client:
    """Get Supabase client"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def create_trading_run(
    model_id: int,
    trading_mode: str,
    strategy_snapshot: Dict,
    **kwargs
) -> Dict:
    """
    Create a new trading run
    
    Args:
        model_id: Model ID
        trading_mode: 'daily' or 'intraday'
        strategy_snapshot: {custom_rules, custom_instructions, model_parameters, default_ai_model}
        **kwargs: Additional fields (date_range_start/end for daily, intraday_symbol/date/session for intraday)
    
    Returns:
        Created run record with run_number and id
    """
    supabase = get_supabase()
    
    # Get next run number for this model
    existing = supabase.table("trading_runs")\
        .select("run_number")\
        .eq("model_id", model_id)\
        .order("run_number", desc=True)\
        .limit(1)\
        .execute()
    
    run_number = (existing.data[0]["run_number"] + 1) if existing.data else 1
    
    # Create run record
    run_data = {
        "model_id": model_id,
        "run_number": run_number,
        "started_at": datetime.now().isoformat(),
        "status": "running",
        "trading_mode": trading_mode,
        "strategy_snapshot": strategy_snapshot,
        **kwargs
    }
    
    result = supabase.table("trading_runs").insert(run_data).execute()
    
    if not result.data:
        raise Exception("Failed to create trading run")
    
    print(f"✅ Created Run #{run_number} for model {model_id}")
    return result.data[0]


async def update_trading_run(
    run_id: int,
    updates: Dict
) -> Dict:
    """
    Update a trading run with arbitrary fields
    
    Args:
        run_id: Run ID to update
        updates: Dict of fields to update (e.g., {"task_id": "abc-123"})
    
    Returns:
        Updated run record
    """
    supabase = get_supabase()
    
    result = supabase.table("trading_runs").update(updates).eq("id", run_id).execute()
    
    return result.data[0] if result.data else {}


async def complete_trading_run(
    run_id: int,
    final_stats: Dict
) -> Dict:
    """
    Mark run as completed and save final statistics
    
    Args:
        run_id: Run ID to complete
        final_stats: {
            total_trades: int,
            final_return: float,
            final_portfolio_value: float,
            max_drawdown: float
        }
    
    Returns:
        Updated run record
    """
    supabase = get_supabase()
    
    result = supabase.table("trading_runs").update({
        "status": "completed",
        "ended_at": datetime.now().isoformat(),
        "total_trades": final_stats.get("total_trades", 0),
        "final_return": final_stats.get("final_return"),
        "final_portfolio_value": final_stats.get("final_portfolio_value"),
        "max_drawdown_during_run": final_stats.get("max_drawdown")
    }).eq("id", run_id).execute()
    
    print(f"✅ Completed Run ID {run_id}")
    return result.data[0] if result.data else {}


async def fail_trading_run(
    run_id: int,
    error_message: str
) -> Dict:
    """Mark run as failed with error"""
    supabase = get_supabase()
    
    result = supabase.table("trading_runs").update({
        "status": "failed",
        "ended_at": datetime.now().isoformat()
    }).eq("id", run_id).execute()
    
    print(f"❌ Failed Run ID {run_id}: {error_message}")
    return result.data[0] if result.data else {}


async def get_model_runs(
    model_id: int,
    user_id: str,
    limit: Optional[int] = None
) -> List[Dict]:
    """
    Get all runs for a model
    
    Args:
        model_id: Model ID
        user_id: User ID (for ownership verification)
        limit: Optional limit on results
    
    Returns:
        List of run records (newest first)
    """
    supabase = get_supabase()
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError(f"User {user_id} does not own model {model_id}")
    
    # Get runs (RLS will also filter)
    query = supabase.table("trading_runs")\
        .select("*")\
        .eq("model_id", model_id)\
        .order("run_number", desc=True)
    
    if limit:
        query = query.limit(limit)
    
    result = query.execute()
    
    return result.data or []


async def get_run_by_id(
    model_id: int,
    run_id: int,
    user_id: str
) -> Optional[Dict]:
    """
    Get specific run with associated data
    
    Args:
        model_id: Model ID
        run_id: Run ID
        user_id: User ID (for ownership verification)
    
    Returns:
        Run record with positions and reasoning
    """
    supabase = get_supabase()
    
    # Verify model ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError(f"User {user_id} does not own model {model_id}")
    
    # Get run
    result = supabase.table("trading_runs")\
        .select("*")\
        .eq("id", run_id)\
        .eq("model_id", model_id)\
        .execute()
    
    if not result.data:
        return None
    
    run = result.data[0]
    
    # Get associated data
    positions = supabase.table("positions")\
        .select("*")\
        .eq("run_id", run_id)\
        .order("date")\
        .order("minute_time")\
        .execute()
    
    reasoning = supabase.table("ai_reasoning")\
        .select("*")\
        .eq("run_id", run_id)\
        .order("timestamp")\
        .execute()
    
    # Attach to run
    run["positions"] = positions.data or []
    run["reasoning"] = reasoning.data or []
    run["position_count"] = len(positions.data) if positions.data else 0
    run["reasoning_count"] = len(reasoning.data) if reasoning.data else 0
    
    return run


async def get_active_run(model_id: int) -> Optional[Dict]:
    """
    Get currently active/running trading run for a model
    
    Args:
        model_id: Model ID
    
    Returns:
        Active run record or None
    """
    supabase = get_supabase()
    
    result = supabase.table("trading_runs")\
        .select("*")\
        .eq("model_id", model_id)\
        .in_("status", ["pending", "running"])\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    
    return result.data[0] if result.data else None


async def delete_trading_run(
    run_id: int,
    model_id: int,
    user_id: str
) -> Dict:
    """
    Delete a trading run
    
    Args:
        run_id: Run ID to delete
        model_id: Model ID (for verification)
        user_id: User ID (for ownership verification)
    
    Returns:
        Success message
    """
    supabase = get_supabase()
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError(f"User {user_id} does not own model {model_id}")
    
    # Verify run belongs to model
    run = supabase.table("trading_runs")\
        .select("id, status")\
        .eq("id", run_id)\
        .eq("model_id", model_id)\
        .execute()
    
    if not run.data:
        raise ValueError(f"Run {run_id} not found")
    
    # Allow deleting running tasks ONLY if called from stop endpoint
    # (stop endpoint will revoke task first, then call this)
    # Direct user deletion still blocked by endpoint validation
    
    # Delete run (cascades to positions and reasoning via ON DELETE CASCADE)
    result = supabase.table("trading_runs").delete().eq("id", run_id).execute()
    
    print(f"🗑️  Deleted Run ID {run_id}")
    
    return {"status": "deleted", "run_id": run_id}

