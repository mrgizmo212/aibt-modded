# 2025-11-03 - Redis Implementation Analysis: Async/Sync Problem

## Critical Discovery

### The Problem

**get_config_value() and write_config_value() are called from BOTH async AND sync contexts:**

**ASYNC Contexts:**
- `backend/trading/base_agent.py` line 433 - `_handle_trading_result()` is async
- BaseAgent methods are async

**SYNC Contexts:**
- `backend/mcp_services/tool_trade.py` lines 45, 50, 136, 141 - `buy()` and `sell()` are SYNC functions
- MCP tools are NOT async (FastMCP decorator creates sync functions)

**Current Redis Client:**
- `backend/utils/redis_client.py` - UpstashRedis is ASYNC ONLY
- Uses `httpx.AsyncClient`
- All methods are `async def`

**THE CONFLICT:**
❌ Can't use `await redis_client.get()` in synchronous MCP tools
❌ Can't make MCP tools async without breaking FastMCP integration
❌ Can't use asyncio.run() inside tools (event loop conflicts)

## All Usages Analyzed

### get_config_value() - 17 usages

| File | Line | Context | Async? | Key |
|------|------|---------|--------|-----|
| tool_trade.py | 45 | buy() | ❌ SYNC | SIGNATURE |
| tool_trade.py | 50 | buy() | ❌ SYNC | TODAY_DATE |
| tool_trade.py | 103 | buy() | ❌ SYNC | IF_TRADE |
| tool_trade.py | 136 | sell() | ❌ SYNC | SIGNATURE |
| tool_trade.py | 141 | sell() | ❌ SYNC | TODAY_DATE |
| tool_jina_search.py | 192 | search() | ❌ SYNC | TODAY_DATE |
| base_agent.py | 433 | _handle_trading_result() | ✅ ASYNC | IF_TRADE |
| price_tools.py | 352-353 | __main__ | ❌ SYNC | SIGNATURE, TODAY_DATE |
| result_tools.py | 865 | __main__ | ❌ SYNC | SIGNATURE |
| agent_prompt.py | 265-266 | __main__ | ❌ SYNC | SIGNATURE, TODAY_DATE |

**Result: 8 SYNC usages, 1 ASYNC usage**

### write_config_value() - 11 usages

| File | Line | Context | Async? | Key |
|------|------|---------|--------|-----|
| tool_trade.py | 102 | buy() | ❌ SYNC | IF_TRADE |
| tool_trade.py | 188 | sell() | ❌ SYNC | IF_TRADE |
| base_agent.py | 435 | _handle_trading_result() | ✅ ASYNC | IF_TRADE |
| base_agent.py | 444 | _handle_trading_result() | ✅ ASYNC | IF_TRADE |
| base_agent.py | 570 | run() | ✅ ASYNC | TODAY_DATE |
| base_agent.py | 571 | run() | ✅ ASYNC | SIGNATURE |

**Result: 2 SYNC usages, 4 ASYNC usages**

## Config Keys Usage Patterns

### SIGNATURE
- **Written by:** BaseAgent.run() (async) - once per trading session
- **Read by:** MCP tools buy()/sell() (sync) - multiple times during session
- **Purpose:** Identifies which model's data to use (file paths)
- **Cross-process:** YES - MCP tools run in subprocess

### TODAY_DATE
- **Written by:** BaseAgent.run() (async) - once per trading day
- **Read by:** MCP tools (sync) - multiple times during session
- **Purpose:** Current trading date
- **Cross-process:** YES - MCP tools run in subprocess

### IF_TRADE
- **Written by:** MCP tools (sync) - when trade executes
- **Read by:** BaseAgent (async) - after trading session
- **Purpose:** Flag indicating if trade happened
- **Cross-process:** YES - written by subprocess, read by parent

## Solutions

### ❌ Option A: Make Everything Async
**Problem:** Can't make MCP tools async - breaks FastMCP framework

### ❌ Option B: Use asyncio.run() in sync contexts
**Problem:** Event loop conflicts, doesn't work in subprocesses

### ✅ Option C: Add Synchronous Redis Client
**Create a SYNC httpx client just for config operations**

```python
import httpx
from typing import Optional

class SyncRedisConfig:
    """Synchronous Redis client for config only"""
    
    def __init__(self):
        self.base_url = settings.UPSTASH_REDIS_REST_URL
        self.token = settings.UPSTASH_REDIS_REST_TOKEN
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Use synchronous httpx.Client
        self._client = httpx.Client(
            timeout=5.0,  # Short timeout for config
            headers=self.headers
        )
    
    def set(self, key: str, value: str, ex: int = 3600) -> bool:
        """Sync set with 1 hour default TTL"""
        try:
            url = f"{self.base_url}/setex/{key}/{ex}"
            response = self._client.post(url, content=value)
            return response.status_code == 200
        except Exception as e:
            print(f"Redis sync set failed: {e}")
            return False
    
    def get(self, key: str) -> Optional[str]:
        """Sync get"""
        try:
            url = f"{self.base_url}/get/{key}"
            response = self._client.get(url)
            if response.status_code == 200:
                data = response.json()
                return data.get("result")
            return None
        except Exception as e:
            print(f"Redis sync get failed: {e}")
            return None

# Global sync instance for config
sync_redis_config = SyncRedisConfig()
```

**Modified get_config_value():**
```python
def get_config_value(key: str, default=None):
    model_id = os.environ.get("CURRENT_MODEL_ID", "global")
    
    # 1. Try Redis first (cross-process, works in subprocesses)
    try:
        redis_key = f"config:{model_id}:{key}"
        redis_value = sync_redis_config.get(redis_key)
        if redis_value:
            import json
            return json.loads(redis_value)
    except Exception as e:
        print(f"Redis config read failed: {e}")
    
    # 2. Fallback to file (local dev, backward compat)
    _RUNTIME_ENV = _load_runtime_env()
    if key in _RUNTIME_ENV:
        return _RUNTIME_ENV[key]
    
    # 3. Fallback to env var
    return os.getenv(key, default)
```

**Modified write_config_value():**
```python
def write_config_value(key: str, value: any):
    model_id = os.environ.get("CURRENT_MODEL_ID", "global")
    
    # 1. Write to Redis (cross-process visibility)
    try:
        redis_key = f"config:{model_id}:{key}"
        import json
        json_value = json.dumps(value)
        sync_redis_config.set(redis_key, json_value, ex=3600)  # 1 hour TTL
    except Exception as e:
        print(f"Redis config write failed: {e}")
    
    # 2. Also write to file (local dev, backward compat)
    _RUNTIME_ENV = _load_runtime_env()
    _RUNTIME_ENV[key] = value
    path = f"./data/.runtime_env_{model_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_RUNTIME_ENV, f, ensure_ascii=False, indent=4)
```

### ✅ Option D: Environment Variable (Simplest)
**Just set SIGNATURE as env var on Render**
- No code changes
- Works immediately
- Only supports one model at a time
- Good enough for production right now

## Recommendation

**SHORT TERM (Today):**
- Use Option D (env var) to get production working
- Zero risk, immediate fix

**LONG TERM (Next Sprint):**
- Implement Option C (Sync Redis Client) for proper multi-user support
- Requires careful testing
- Maintains backward compatibility

## Impact Assessment

### If we implement Redis solution (Option C):

**✅ NO Breaking Changes:**
- File fallback still works
- Env var fallback still works  
- Reads work in sync and async contexts
- Writes work in sync and async contexts

**✅ Improves:**
- Cross-process communication (fixes the bug)
- Multi-user isolation (supports multiple models)
- Persistence across restarts

**✅ Maintains:**
- Local development workflow (files still work)
- Backward compatibility (triple fallback)
- Error handling (graceful degradation)

**⚠️ Risks:**
- Network latency added (Redis REST API call)
- New dependency on Redis for config (but already using for cache)
- Need to test thoroughly with subprocesses

## Testing Required

1. **Sync context test** - Call from regular function
2. **Async context test** - Call from async function  
3. **Subprocess test** - Write in parent, read in subprocess
4. **Fallback test** - Redis down, should use file
5. **Multi-model test** - Two models don't interfere
6. **Performance test** - Latency acceptable

## Conclusion

**User is RIGHT to be cautious.** The async/sync mixing is a real issue.

**Best path forward:**
1. Quick fix with env var (Option D) - Deploy today
2. Implement sync Redis client (Option C) - Next week with full testing
3. Don't rush Option C into production without thorough verification
