
import os
import json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

# Import synchronous Redis client for cross-process config
try:
    from utils.sync_redis_config import sync_redis_config
except ImportError:
    sync_redis_config = None

def _load_runtime_env() -> dict:
    # Use per-model runtime file for multi-user isolation
    model_id = os.environ.get("CURRENT_MODEL_ID", "global")
    path = f"./data/.runtime_env_{model_id}.json"
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
    except Exception:
        pass
    return {}


def get_config_value(key: str, default=None):
    """
    Get configuration value with triple fallback:
    1. Redis (cross-process, works in subprocesses, persists across restarts)
    2. File (local dev, backward compatibility)
    3. Environment variable (static config)
    
    Args:
        key: Configuration key (e.g., 'SIGNATURE', 'TODAY_DATE', 'IF_TRADE')
        default: Default value if not found
    
    Returns:
        Configuration value or default
    """
    model_id = os.environ.get("CURRENT_MODEL_ID", "global")
    
    # 1. Try Redis first (PRODUCTION: cross-process, multi-user isolation)
    if sync_redis_config:
        try:
            redis_key = f"config:{model_id}:{key}"
            redis_value = sync_redis_config.get(redis_key)
            if redis_value is not None:
                return redis_value
        except Exception as e:
            # Redis failed, fall through to file
            pass
    
    # 2. Fallback to file (LOCAL DEV: backward compatibility)
    _RUNTIME_ENV = _load_runtime_env()
    if key in _RUNTIME_ENV:
        return _RUNTIME_ENV[key]
    
    # 3. Fallback to environment variable (STATIC CONFIG)
    return os.getenv(key, default)

def write_config_value(key: str, value: any):
    """
    Write configuration value to both Redis AND file:
    - Redis: For cross-process visibility (subprocesses can read)
    - File: For local dev and backward compatibility
    
    Args:
        key: Configuration key
        value: Value to store (JSON serializable)
    """
    model_id = os.environ.get("CURRENT_MODEL_ID", "global")
    
    print(f"📝 write_config_value called: {key} = {value} (model_id={model_id})")
    
    # 1. Write to Redis (PRODUCTION: cross-process, persists across container restarts)
    if sync_redis_config:
        print(f"  🔧 Using Redis for config write")
        try:
            redis_key = f"config:{model_id}:{key}"
            # 1 hour TTL - config shouldn't persist forever
            sync_redis_config.set(redis_key, value, ex=3600)
        except Exception as e:
            print(f"  ⚠️  Redis config write failed for {key}: {e}")
            # Continue to file write even if Redis fails
    else:
        print(f"  ⚠️  sync_redis_config is None - Redis NOT available, using file only")
    
    # 2. Write to file (LOCAL DEV: backward compatibility)
    _RUNTIME_ENV = _load_runtime_env()
    _RUNTIME_ENV[key] = value
    path = f"./data/.runtime_env_{model_id}.json"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_RUNTIME_ENV, f, ensure_ascii=False, indent=4)

def extract_conversation(conversation: dict, output_type: str):
    """Extract information from a conversation payload.

    Args:
        conversation: A mapping that includes 'messages' (list of dicts or objects with attributes).
        output_type: 'final' to return the model's final answer content; 'all' to return the full messages list.

    Returns:
        For 'final': the final assistant content string if found, otherwise None.
        For 'all': the original messages list (or empty list if missing).
    """

    def get_field(obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def get_nested(obj, path, default=None):
        current = obj
        for key in path:
            current = get_field(current, key, None)
            if current is None:
                return default
        return current

    messages = get_field(conversation, "messages", []) or []

    if output_type == "all":
        return messages

    if output_type == "final":
        # Prefer the last message with finish_reason == 'stop' and non-empty content.
        for msg in reversed(messages):
            finish_reason = get_nested(msg, ["response_metadata", "finish_reason"])
            content = get_field(msg, "content")
            if finish_reason == "stop" and isinstance(content, str) and content.strip():
                return content

        # Fallback: last AI-like message with non-empty content and not a tool call.
        for msg in reversed(messages):
            content = get_field(msg, "content")
            additional_kwargs = get_field(msg, "additional_kwargs", {}) or {}
            tool_calls = None
            if isinstance(additional_kwargs, dict):
                tool_calls = additional_kwargs.get("tool_calls")
            else:
                tool_calls = getattr(additional_kwargs, "tool_calls", None)

            is_tool_invoke = isinstance(tool_calls, list)
            # Tool messages often have 'tool_call_id' or 'name' (tool name)
            has_tool_call_id = get_field(msg, "tool_call_id") is not None
            tool_name = get_field(msg, "name")
            is_tool_message = has_tool_call_id or isinstance(tool_name, str)

            if not is_tool_invoke and not is_tool_message and isinstance(content, str) and content.strip():
                return content

        return None

    raise ValueError("output_type must be 'final' or 'all'")


def extract_tool_messages(conversation: dict):
    """Return all ToolMessage-like entries from the conversation.

    A ToolMessage is identified heuristically by having either:
      - a non-empty 'tool_call_id', or
      - a string 'name' (tool name) and no 'finish_reason' like normal AI messages

    Supports both dict-based and object-based messages.
    """

    def get_field(obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def get_nested(obj, path, default=None):
        current = obj
        for key in path:
            current = get_field(current, key, None)
            if current is None:
                return default
        return current

    messages = get_field(conversation, "messages", []) or []
    tool_messages = []
    for msg in messages:
        tool_call_id = get_field(msg, "tool_call_id")
        name = get_field(msg, "name")
        finish_reason = get_nested(msg, ["response_metadata", "finish_reason"])  # present for AIMessage
        # Treat as ToolMessage if it carries a tool_call_id, or looks like a tool response
        if tool_call_id or (isinstance(name, str) and not finish_reason):
            tool_messages.append(msg)
    return tool_messages


def extract_first_tool_message_content(conversation: dict):
    """Return the content of the first ToolMessage if available, else None."""
    msgs = extract_tool_messages(conversation)
    if not msgs:
        return None

    first = msgs[0]
    if isinstance(first, dict):
        return first.get("content")
    return getattr(first, "content", None)

