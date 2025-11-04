"""
Conversation Title Generation Service
Automatically generates descriptive titles for chat conversations
"""

from langchain_openai import ChatOpenAI
from typing import Optional


async def generate_conversation_title(
    first_message: str,
    ai_model: str = "openai/gpt-4.1-mini",
    api_key: Optional[str] = None
) -> str:
    """
    Generate a concise title for a conversation based on first message
    
    Args:
        first_message: User's first message in conversation
        ai_model: AI model to use for generation
        api_key: OpenRouter API key
    
    Returns:
        Generated title (3-5 words, max 50 chars)
    """
    if not first_message or len(first_message.strip()) == 0:
        return "New conversation"
    
    # Fallback: Simple extraction if no API key
    if not api_key:
        return extract_title_from_message(first_message)
    
    try:
        model = ChatOpenAI(
            model=ai_model,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.3,
            max_tokens=20
        )
        
        prompt = f"""Generate a concise 3-5 word title for this conversation.

User's first message: {first_message[:200]}

Requirements:
- 3-5 words maximum
- Descriptive and professional
- No quotes or punctuation
- Capture the main topic

Title:"""
        
        response = await model.ainvoke(prompt)
        title = response.content.strip().strip('"').strip("'")
        
        # Validate and truncate
        if len(title) > 50:
            title = title[:47] + "..."
        
        return title if title else "New conversation"
    
    except Exception as e:
        print(f"⚠️ Title generation failed: {e}")
        return extract_title_from_message(first_message)


def extract_title_from_message(message: str) -> str:
    """
    Fallback: Extract title directly from message
    
    Args:
        message: User's message
    
    Returns:
        Cleaned and truncated message as title
    """
    # Clean the message
    cleaned = message.strip().replace('\n', ' ').replace('\r', ' ')
    
    # Remove common prefixes
    prefixes = [
        "i need help with ",
        "can you help me ",
        "can you ",
        "how do i ",
        "how to ",
        "what is ",
        "what's ",
        "why did ",
        "why does ",
        "why is ",
        "help me "
    ]
    cleaned_lower = cleaned.lower()
    for prefix in prefixes:
        if cleaned_lower.startswith(prefix):
            cleaned = cleaned[len(prefix):]
            break
    
    # Truncate to 50 chars
    if len(cleaned) > 50:
        title = cleaned[:47] + "..."
    else:
        title = cleaned
    
    # Capitalize first letter
    if title:
        title = title[0].upper() + title[1:]
    
    return title or "New conversation"

