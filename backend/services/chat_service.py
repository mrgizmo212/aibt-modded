"""
Chat Service for System Agent Conversations
Manages chat sessions and message history
"""

from typing import Dict, List, Optional
from datetime import datetime
from supabase import create_client, Client
from config import settings

def get_supabase() -> Client:
    """Get Supabase client"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def get_or_create_chat_session(
    model_id: int,
    run_id: int,
    user_id: str
) -> Dict:
    """
    Get existing chat session or create new one
    
    Args:
        model_id: Model ID
        run_id: Run ID
        user_id: User ID (for ownership verification)
    
    Returns:
        Chat session record
    """
    supabase = get_supabase()
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError(f"User {user_id} does not own model {model_id}")
    
    # Try to get existing session
    result = supabase.table("chat_sessions")\
        .select("*")\
        .eq("model_id", model_id)\
        .eq("run_id", run_id)\
        .execute()
    
    if result.data:
        return result.data[0]
    
    # Create new session
    run = supabase.table("trading_runs").select("run_number").eq("id", run_id).execute()
    run_number = run.data[0]["run_number"] if run.data else "?"
    
    new_session = supabase.table("chat_sessions").insert({
        "model_id": model_id,
        "run_id": run_id,
        "session_title": f"Run #{run_number} Strategy Discussion",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }).execute()
    
    return new_session.data[0] if new_session.data else {}


async def save_chat_message(
    model_id: int,
    run_id: int,
    role: str,
    content: str,
    tool_calls: Optional[List] = None
) -> Dict:
    """
    Save chat message to database
    
    Args:
        model_id: Model ID
        run_id: Run ID  
        role: 'user' | 'assistant' | 'system'
        content: Message content
        tool_calls: Optional list of tools AI used
    
    Returns:
        Created message record
    """
    supabase = get_supabase()
    
    # Get or create session
    session = await get_or_create_chat_session(model_id, run_id, "system")  # Service role bypass
    session_id = session["id"]
    
    # Save message
    result = supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
        "tool_calls": tool_calls,
        "timestamp": datetime.now().isoformat()
    }).execute()
    
    # Update session last_message_at
    supabase.table("chat_sessions").update({
        "last_message_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }).eq("id", session_id).execute()
    
    return result.data[0] if result.data else {}


async def get_chat_messages(
    model_id: int,
    run_id: int,
    user_id: str,
    limit: Optional[int] = None
) -> List[Dict]:
    """
    Get chat message history
    
    Args:
        model_id: Model ID
        run_id: Run ID
        user_id: User ID (for ownership verification)
        limit: Optional limit on messages
    
    Returns:
        List of messages ordered by time
    """
    supabase = get_supabase()
    
    # Get session
    session = await get_or_create_chat_session(model_id, run_id, user_id)
    session_id = session["id"]
    
    # Get messages (RLS will filter)
    query = supabase.table("chat_messages")\
        .select("*")\
        .eq("session_id", session_id)\
        .order("timestamp")
    
    if limit:
        query = query.limit(limit)
    
    result = query.execute()
    
    return result.data or []

