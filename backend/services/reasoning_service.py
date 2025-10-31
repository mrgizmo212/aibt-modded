"""
AI Reasoning Logging Service
Tracks AI thought process separate from trade execution
"""

from typing import Dict, List, Optional
from datetime import datetime
from supabase import create_client, Client
from config import settings

def get_supabase() -> Client:
    """Get Supabase client"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def save_ai_reasoning(
    model_id: int,
    run_id: Optional[int],
    reasoning_type: str,
    content: str,
    context_json: Optional[Dict] = None
) -> Dict:
    """
    Save AI reasoning to database
    
    Args:
        model_id: Model ID
        run_id: Run ID (nullable for legacy or non-run reasoning)
        reasoning_type: 'plan' | 'analysis' | 'decision' | 'reflection'
        content: AI's reasoning text
        context_json: Optional context data (market data, indicators, etc.)
    
    Returns:
        Created reasoning record
    """
    supabase = get_supabase()
    
    result = supabase.table("ai_reasoning").insert({
        "model_id": model_id,
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(),
        "reasoning_type": reasoning_type,
        "content": content,
        "context_json": context_json
    }).execute()
    
    return result.data[0] if result.data else {}


async def get_reasoning_for_run(
    run_id: int
) -> List[Dict]:
    """
    Get all reasoning entries for a specific run
    
    Args:
        run_id: Run ID
    
    Returns:
        List of reasoning records ordered by time
    """
    supabase = get_supabase()
    
    result = supabase.table("ai_reasoning")\
        .select("*")\
        .eq("run_id", run_id)\
        .order("timestamp")\
        .execute()
    
    return result.data or []


async def get_recent_reasoning(
    model_id: int,
    reasoning_type: Optional[str] = None,
    limit: int = 10
) -> List[Dict]:
    """
    Get recent reasoning entries for a model
    
    Args:
        model_id: Model ID
        reasoning_type: Optional filter by type
        limit: Max results
    
    Returns:
        List of reasoning records (newest first)
    """
    supabase = get_supabase()
    
    query = supabase.table("ai_reasoning")\
        .select("*")\
        .eq("model_id", model_id)
    
    if reasoning_type:
        query = query.eq("reasoning_type", reasoning_type)
    
    result = query.order("timestamp", desc=True).limit(limit).execute()
    
    return result.data or []


async def get_reasoning_by_type(
    model_id: int,
    run_id: int,
    reasoning_type: str
) -> List[Dict]:
    """
    Get all reasoning of specific type for a run
    
    Useful for:
    - Get all 'decision' entries (why each trade was made)
    - Get all 'analysis' entries (market assessments)
    - Get 'reflection' entry (post-session summary)
    
    Args:
        model_id: Model ID
        run_id: Run ID
        reasoning_type: Type to filter by
    
    Returns:
        List of reasoning records
    """
    supabase = get_supabase()
    
    result = supabase.table("ai_reasoning")\
        .select("*")\
        .eq("model_id", model_id)\
        .eq("run_id", run_id)\
        .eq("reasoning_type", reasoning_type)\
        .order("timestamp")\
        .execute()
    
    return result.data or []

