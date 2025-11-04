"""
Chat Summarization Service
Condenses long conversations to maintain context without token bloat
"""

from typing import List, Dict
from langchain_openai import ChatOpenAI
from supabase import Client


async def summarize_conversation(
    messages: List[Dict],
    ai_model: str,
    api_key: str,
    base_url: str = "https://openrouter.ai/api/v1"
) -> str:
    """
    Summarize a conversation to preserve key insights
    
    Args:
        messages: List of chat messages to summarize
        ai_model: AI model to use for summarization
        api_key: OpenRouter API key
        base_url: OpenRouter base URL
    
    Returns:
        Concise summary preserving key points
    """
    
    if len(messages) < 10:
        return ""  # Not enough to summarize
    
    # Build conversation text
    conversation_text = ""
    for msg in messages:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        conversation_text += f"{role.upper()}: {content}\n\n"
    
    # Create summarization model (fast, cheap)
    summarizer = ChatOpenAI(
        model="openai/gpt-4.1-mini",  # Fast model for summarization
        temperature=0.1,  # Deterministic
        base_url=base_url,
        api_key=api_key,
        max_tokens=1000
    )
    
    # Summarization prompt
    prompt = f"""Summarize this trading strategy conversation concisely, preserving:
- Key insights discovered
- Specific trade analysis mentioned
- Rules or adjustments suggested
- Performance metrics discussed
- User's questions and concerns

Conversation to summarize:
{conversation_text}

Provide a dense summary in 3-5 paragraphs that captures all important context.
"""
    
    try:
        messages_to_send = [
            {"role": "user", "content": prompt}
        ]
        
        response = await summarizer.ainvoke(messages_to_send)
        summary = response.content if hasattr(response, 'content') else str(response)
        
        print(f"📝 Generated summary: {len(summary)} chars from {len(messages)} messages")
        
        return summary
    
    except Exception as e:
        print(f"⚠️  Summarization failed: {e}")
        return ""


async def should_summarize(session_id: int, supabase: Client) -> bool:
    """
    Check if session should be summarized
    
    Returns True if >60 messages exist
    """
    result = supabase.table("chat_messages")\
        .select("id", count="exact")\
        .eq("session_id", session_id)\
        .execute()
    
    message_count = result.count if result.count else 0
    
    return message_count > 60  # Summarize after 60 messages


async def update_session_summary(
    session_id: int,
    summary: str,
    supabase: Client
):
    """
    Update chat session with conversation summary
    """
    from datetime import datetime
    
    supabase.table("chat_sessions").update({
        "conversation_summary": summary,
        "updated_at": datetime.now().isoformat()
    }).eq("id", session_id).execute()
    
    print(f"💾 Updated session {session_id} summary")

