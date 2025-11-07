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
    run_id: Optional[int],
    user_id: str
) -> Dict:
    """
    Get existing chat session or create new one
    
    Args:
        model_id: Model ID
        run_id: Run ID (None for general dashboard chat)
        user_id: User ID (for ownership verification)
    
    Returns:
        Chat session record
    """
    supabase = get_supabase()
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data:
        raise PermissionError(f"Model {model_id} not found in chat_service check")
    
    model_owner = model.data[0]["user_id"]
    print(f"🔍 Chat service auth: model_owner={model_owner}, user={user_id}, match={model_owner == user_id}")
    
    if model_owner != user_id:
        raise PermissionError(f"User {user_id} does not own model {model_id}")
    
    # Try to get existing session
    query = supabase.table("chat_sessions")\
        .select("*")\
        .eq("model_id", model_id)
    
    if run_id is not None:
        query = query.eq("run_id", run_id)
    else:
        query = query.is_("run_id", "null")
    
    result = query.execute()
    
    if result.data:
        return result.data[0]
    
    # Create new session
    session_title = "General Chat"
    if run_id is not None:
        run = supabase.table("trading_runs").select("run_number").eq("id", run_id).execute()
        run_number = run.data[0]["run_number"] if run.data else "?"
        session_title = f"Run #{run_number} Strategy Discussion"
    
    new_session = supabase.table("chat_sessions").insert({
        "user_id": user_id,
        "model_id": model_id,
        "run_id": run_id,  # Can be NULL
        "session_title": session_title,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }).execute()
    
    return new_session.data[0] if new_session.data else {}


async def save_chat_message(
    model_id: int,
    run_id: Optional[int],  # Can be None for general chat
    role: str,
    content: str,
    user_id: str,
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
    session = await get_or_create_chat_session(model_id, run_id, user_id)  # ← FIX: Use actual user_id
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
    run_id: Optional[int],
    user_id: str,
    limit: Optional[int] = None
) -> List[Dict]:
    """
    Get chat message history
    
    Args:
        model_id: Model ID
        run_id: Run ID (None for general chat)
        user_id: User ID (for ownership verification)
        limit: Optional limit on messages (default: 30)
    
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
        .order("timestamp", desc=True)  # Most recent first
    
    # Default to 30 messages
    query = query.limit(limit if limit else 30)
    
    result = query.execute()
    
    # Reverse to chronological order (oldest first)
    messages = list(reversed(result.data)) if result.data else []
    
    return messages


# ============================================================================
# V2 FUNCTIONS: Multi-Conversation Support
# ============================================================================

async def get_or_create_session_v2(
    user_id: str,
    model_id: Optional[int] = None,
    run_id: Optional[int] = None,
    session_id: Optional[int] = None
) -> Dict:
    """
    V2: Get/create chat session with support for:
    - General conversations (model_id = None)
    - Model conversations (model_id set, run_id = None)  
    - Run conversations (model_id + run_id set)
    - Resume specific session (session_id provided)
    
    Args:
        user_id: User ID (UUID string)
        model_id: Optional model ID
        run_id: Optional run ID
        session_id: Optional session ID to resume
    
    Returns:
        Chat session record
    """
    supabase = get_supabase()
    
    # If session_id provided, just fetch it
    if session_id:
        result = supabase.table("chat_sessions")\
            .select("*")\
            .eq("id", session_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data:
            return result.data[0]
        raise PermissionError(f"Session {session_id} not found or access denied")
    
    # Verify ownership if model_id provided
    if model_id:
        model = supabase.table("models")\
            .select("user_id")\
            .eq("id", model_id)\
            .execute()
        
        if not model.data or model.data[0]["user_id"] != user_id:
            raise PermissionError(f"Model {model_id} not found or access denied")
    
    # Try to get active session
    query = supabase.table("chat_sessions")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("is_active", True)
    
    if model_id is not None:
        query = query.eq("model_id", model_id)
    else:
        query = query.is_("model_id", "null")
    
    if run_id is not None:
        query = query.eq("run_id", run_id)
    else:
        query = query.is_("run_id", "null")
    
    result = query.execute()
    
    if result.data:
        return result.data[0]
    
    # Create new session
    session_title = "New conversation"
    if model_id and run_id:
        run = supabase.table("trading_runs")\
            .select("run_number")\
            .eq("id", run_id)\
            .execute()
        run_num = run.data[0]["run_number"] if run.data else "?"
        session_title = f"Run #{run_num} Analysis"
    elif model_id:
        model = supabase.table("models")\
            .select("name")\
            .eq("id", model_id)\
            .execute()
        model_name = model.data[0]["name"] if model.data else f"Model {model_id}"
        session_title = f"{model_name} Discussion"
    
    new_session = supabase.table("chat_sessions").insert({
        "user_id": user_id,
        "model_id": model_id,
        "run_id": run_id,
        "session_title": session_title,
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }).execute()
    
    return new_session.data[0] if new_session.data else {}


async def list_user_sessions(
    user_id: str,
    model_id: Optional[int] = None,
    has_run: Optional[bool] = None,
    limit: int = 50
) -> List[Dict]:
    """
    List chat sessions for a user
    
    Args:
        user_id: User ID
        model_id: Filter by model (None = general conversations only)
        has_run: Filter by run conversations (True = run conversations, False = model conversations, None = all)
        limit: Max sessions to return
    
    Returns:
        List of sessions ordered by last_message_at DESC
    """
    supabase = get_supabase()
    
    query = supabase.table("chat_sessions")\
        .select("*, trading_runs(*)")\
        .eq("user_id", user_id)\
        .order("last_message_at", desc=True)\
        .limit(limit)
    
    if model_id is not None:
        query = query.eq("model_id", model_id)
    else:
        query = query.is_("model_id", "null")
    
    if has_run is True:
        query = query.not_.is_("run_id", "null")
    elif has_run is False:
        query = query.is_("run_id", "null")
    
    result = query.execute()
    sessions = result.data if result.data else []
    
    # Format run data if present
    for session in sessions:
        if session.get("trading_runs"):
            session["run"] = session["trading_runs"]
            del session["trading_runs"]
    
    return sessions


async def start_new_conversation(
    user_id: str,
    model_id: Optional[int] = None
) -> Dict:
    """
    Start a fresh conversation (marks current as inactive)
    
    Args:
        user_id: User ID
        model_id: Model ID (None = general conversation)
    
    Returns:
        New session record
    """
    supabase = get_supabase()
    
    # Mark current active session(s) as inactive
    update_query = supabase.table("chat_sessions")\
        .update({"is_active": False})\
        .eq("user_id", user_id)\
        .eq("is_active", True)
    
    if model_id is not None:
        update_query = update_query.eq("model_id", model_id)
    else:
        update_query = update_query.is_("model_id", "null")
    
    update_query.execute()
    
    # Create new active session
    return await get_or_create_session_v2(user_id, model_id=model_id)


async def resume_conversation(
    session_id: int,
    user_id: str
) -> Dict:
    """
    Resume a previous conversation (make it active)
    
    Args:
        session_id: Session to resume
        user_id: User ID (for ownership check)
    
    Returns:
        Updated session record
    """
    supabase = get_supabase()
    
    # Get the session
    session = await get_or_create_session_v2(user_id, session_id=session_id)
    
    model_id = session.get("model_id")
    
    # Deactivate current active sessions for this context
    update_query = supabase.table("chat_sessions")\
        .update({"is_active": False})\
        .eq("user_id", user_id)\
        .eq("is_active", True)\
        .neq("id", session_id)
    
    if model_id is not None:
        update_query = update_query.eq("model_id", model_id)
    else:
        update_query = update_query.is_("model_id", "null")
    
    update_query.execute()
    
    # Mark this session as active
    result = supabase.table("chat_sessions")\
        .update({"is_active": True, "updated_at": datetime.now().isoformat()})\
        .eq("id", session_id)\
        .execute()
    
    return result.data[0] if result.data else session


async def save_chat_message_v2(
    user_id: str,
    role: str,
    content: str,
    model_id: Optional[int] = None,
    run_id: Optional[int] = None,
    session_id: Optional[int] = None,
    tool_calls: Optional[List] = None
) -> Dict:
    """
    V2: Save chat message with auto-title generation
    
    Args:
        user_id: User ID
        role: 'user' | 'assistant' | 'system'
        content: Message content
        model_id: Optional model ID
        run_id: Optional run ID
        session_id: Optional specific session ID
        tool_calls: Optional list of tools AI used
    
    Returns:
        Created message record
    """
    supabase = get_supabase()
    
    # Get or create session
    if session_id:
        session = await get_or_create_session_v2(user_id, session_id=session_id)
    else:
        session = await get_or_create_session_v2(user_id, model_id=model_id, run_id=run_id)
    
    session_id = session["id"]
    
    # Check if this is the first user message
    existing_count = supabase.table("chat_messages")\
        .select("id", count="exact")\
        .eq("session_id", session_id)\
        .execute()
    
    is_first_message = (role == "user" and (not hasattr(existing_count, 'count') or existing_count.count == 0))
    
    # Save message
    result = supabase.table("chat_messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
        "tool_calls": tool_calls,
        "timestamp": datetime.now().isoformat()
    }).execute()
    
    # Auto-generate title for first message
    if is_first_message and session.get("session_title") in ["New conversation", None]:
        from services.title_generation import generate_conversation_title
        
        try:
            # Generate title using AI
            title = await generate_conversation_title(
                first_message=content,
                api_key=settings.OPENAI_API_KEY
            )
            
            # Update session title
            supabase.table("chat_sessions").update({
                "session_title": title,
                "updated_at": datetime.now().isoformat()
            }).eq("id", session_id).execute()
            
            print(f"✅ Auto-generated title: '{title}'")
        
        except Exception as e:
            print(f"⚠️ Title generation failed: {e}")
            # Continue without title (stays "New conversation")
    
    # Update session last_message_at
    supabase.table("chat_sessions").update({
        "last_message_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }).eq("id", session_id).execute()
    
    return result.data[0] if result.data else {}


async def delete_session(
    session_id: int,
    user_id: str
) -> bool:
    """
    Delete a chat session and all its messages
    
    Args:
        session_id: Session to delete
        user_id: User ID (for ownership check)
    
    Returns:
        True if deleted successfully
    """
    supabase = get_supabase()
    
    # Verify ownership
    session = supabase.table("chat_sessions")\
        .select("id")\
        .eq("id", session_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not session.data:
        raise PermissionError(f"Session {session_id} not found or access denied")
    
    # Delete session (messages will cascade delete)
    supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    
    return True