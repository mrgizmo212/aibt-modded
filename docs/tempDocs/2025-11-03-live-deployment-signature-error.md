# 2025-11-03 - Live Deployment SIGNATURE Error Investigation

## Context

User reported error on live Render deployment (dashboard.render.com logs):
```
AI decision failed: Error calling tool 'sell': SIGNATURE environment variable is not set, defaulting to HOLD
```

Error repeating multiple times at Nov 2 07:15:34 PM for service "rcs4b"

## Complete Root Cause Analysis

### Error Flow

1. **Error Origin:** `backend/mcp_services/tool_trade.py` lines 136-138
   ```python
   signature = get_config_value("SIGNATURE")
   if signature is None:
       raise ValueError("SIGNATURE environment variable is not set")
   ```

2. **Error Handler:** `backend/trading/intraday_agent.py` lines 788-790
   ```python
   except Exception as e:
       print(f"    ⚠️  AI decision failed: {e}, defaulting to HOLD")
       return {"action": "hold", "reasoning": f"Error: {str(e)[:100]}"}
   ```

3. **Config Loading Mechanism:** `backend/utils/general_tools.py` lines 8-28
   ```python
   def _load_runtime_env() -> dict:
       model_id = os.environ.get("CURRENT_MODEL_ID", "global")
       path = f"./data/.runtime_env_{model_id}.json"
       # Loads JSON file if exists
   
   def get_config_value(key: str, default=None):
       _RUNTIME_ENV = _load_runtime_env()
       if key in _RUNTIME_ENV:
           return _RUNTIME_ENV[key]
       return os.getenv(key, default)
   ```

### The Multi-User Isolation Architecture

**Design Intent:**
- Each model has its own runtime environment file: `/data/.runtime_env_{model_id}.json`
- Set via `os.environ["CURRENT_MODEL_ID"] = str(model_id)` in `agent_manager.py` line 72
- Allows multiple models to run simultaneously without config collision
- SIGNATURE is written per-model during agent initialization

**Where SIGNATURE is written:** `backend/trading/base_agent.py` lines 570-571
```python
# Set configuration
write_config_value("TODAY_DATE", date)
write_config_value("SIGNATURE", self.signature)
```

### The Core Problem

**Architecture Mismatch with Render:**

1. **Cross-Process Communication Issue:**
   - Main backend process: Writes SIGNATURE to `/data/.runtime_env_{model_id}.json`
   - MCP services (subprocesses): Try to read SIGNATURE from the same file
   - These are SEPARATE PROCESSES with separate file system views

2. **Ephemeral File System:**
   - Render uses ephemeral containers
   - Files written at runtime don't persist across restarts
   - `/data/.runtime_env_{model_id}.json` is created dynamically
   - When service restarts, it's GONE

3. **Race Condition:**
   - MCP services start during app startup (main.py lifespan)
   - Agent writes SIGNATURE later when trading starts
   - MCP subprocess tries to read SIGNATURE BEFORE it's written
   - Result: `get_config_value("SIGNATURE")` returns None

4. **Subprocess Isolation:**
   - MCP services run as subprocesses (via `subprocess.Popen`)
   - They have their own environment variable space
   - Even if SIGNATURE was written by parent, subprocess might not see file immediately
   - File system sync issues between processes

### Why This Works Locally But Fails on Render

**Local Development:**
- `/data/.runtime_env_{model_id}.json` persists across runs
- File system is reliable and synchronous
- Subprocesses can read parent's written files immediately

**Render Production:**
- Ephemeral file system wiped on every deployment/restart
- Container restarts lose all runtime files
- Subprocess file visibility is not guaranteed
- Network file system latency may cause sync issues

## The Error Message Explained

```
🤖 Calling AI for decision at 09:50...
❌ AI decision failed: Error calling tool 'sell': SIGNATURE environment variable is not set, defaulting to HOLD
```

**What's happening:**
1. Agent makes decision → wants to SELL
2. Agent calls MCP tool `sell()` via subprocess on port 8002
3. `sell()` tool tries to read SIGNATURE: `get_config_value("SIGNATURE")`
4. SIGNATURE not in runtime file OR file doesn't exist
5. SIGNATURE not in OS environment variables
6. Returns None → raises ValueError
7. Agent catches exception → defaults to HOLD for safety

## Solution Options

### Option 1: Set SIGNATURE as Environment Variable on Render ⭐ (Quickest)

**Pros:**
- Immediate fix
- No code changes needed
- Works across all processes

**Cons:**
- Only supports ONE model at a time (breaks multi-user isolation)
- Not scalable for multi-tenant deployment
- Hardcoded model name

**Implementation:**
In Render Dashboard → Environment Variables:
```
SIGNATURE=production-model-v1
```

### Option 2: Use Redis for Shared State ⭐⭐ (Recommended)

**Pros:**
- Preserves multi-user isolation
- Works across processes and restarts
- Already have Upstash Redis configured
- Scalable for production

**Cons:**
- Requires code changes
- Redis dependency (but already exists)

**Implementation:**
Modify `get_config_value()` to check Redis first:
```python
def get_config_value(key: str, default=None):
    # Check Redis first (cross-process, persistent)
    model_id = os.environ.get("CURRENT_MODEL_ID")
    redis_key = f"runtime_env:{model_id}:{key}"
    redis_value = redis_client.get(redis_key)
    if redis_value:
        return redis_value
    
    # Fallback to file (local dev)
    _RUNTIME_ENV = _load_runtime_env()
    if key in _RUNTIME_ENV:
        return _RUNTIME_ENV[key]
    
    # Fallback to env var
    return os.getenv(key, default)
```

### Option 3: Pass SIGNATURE as Parameter ⭐⭐⭐ (Best Long-term)

**Pros:**
- Explicit dependencies (no hidden config)
- No cross-process communication issues
- Testable and debuggable
- Follows best practices

**Cons:**
- Requires refactoring tools to accept parameters
- Changes MCP tool signatures
- More extensive code changes

**Implementation:**
Modify tool calls to pass SIGNATURE explicitly:
```python
# In agent when calling tools
result = await agent.invoke_tool("sell", {
    "symbol": "AAPL",
    "amount": 10,
    "signature": self.signature  # Pass explicitly
})

# In tool_trade.py
@mcp.tool()
def sell(symbol: str, amount: int, signature: str) -> Dict[str, Any]:
    # Use signature parameter directly, no config lookup
    current_position, current_action_id = get_latest_position(today_date, signature)
```

### Option 4: Consolidate MCP into Main Process ⭐ (Good for Render)

**Pros:**
- No subprocess issues
- Shared memory space
- Works on Render free tier (one port)
- Simpler deployment

**Cons:**
- Loses process isolation
- All services in one container
- Harder to scale individual services

**Implementation:**
Import MCP tools directly instead of HTTP clients:
```python
# Instead of connecting to http://localhost:8002
from mcp_services.tool_trade import buy, sell

# Call directly in same process
result = buy("AAPL", 10)
```

## Immediate Recommendation

**For Quick Fix (Production Now):**
1. Set SIGNATURE as environment variable on Render
2. This will unblock trading immediately
3. Accept single-model limitation temporarily

**For Proper Fix (Next Sprint):**
1. Implement Option 2 (Redis-backed config)
2. Update `get_config_value()` and `write_config_value()` to use Redis
3. Keep file fallback for local development
4. Deploy and test thoroughly

## Test Script Needed

**Verify Bug:**
```python
# scripts/verify-render-signature-bug.py
"""Reproduces SIGNATURE missing error in subprocess context"""

import os
import subprocess
import sys

# Set model ID
os.environ["CURRENT_MODEL_ID"] = "test-model"

# Write SIGNATURE in parent process
from utils.general_tools import write_config_value
write_config_value("SIGNATURE", "test-signature")

# Try to read in subprocess (simulates MCP service)
subprocess_code = """
import sys
sys.path.insert(0, '.')
from utils.general_tools import get_config_value
signature = get_config_value("SIGNATURE")
print(f"Subprocess read: {signature}")
if signature is None:
    print("BUG CONFIRMED: Subprocess cannot read SIGNATURE")
    sys.exit(1)
"""

result = subprocess.run(
    [sys.executable, "-c", subprocess_code],
    capture_output=True,
    text=True
)

print(result.stdout)
if result.returncode != 0:
    print("✅ BUG REPRODUCED: Subprocess cannot access parent's runtime config")
else:
    print("❌ Bug not reproduced")
```

**Prove Fix (after implementing Redis solution):**
```python
# scripts/prove-fix-redis-signature.py
"""Verifies Redis-backed config works across processes"""

# Test 1: Write in parent
# Test 2: Read in subprocess
# Test 3: Verify same value
# Expected: 100% success
```

## Related Files

- `backend/mcp_services/tool_trade.py` - Where error is raised
- `backend/trading/intraday_agent.py` - Where error is caught and logged
- `backend/utils/general_tools.py` - Config loading mechanism
- `backend/trading/base_agent.py` - Where SIGNATURE is written
- `backend/trading/agent_manager.py` - Where CURRENT_MODEL_ID is set
- `backend/trading/mcp_manager.py` - MCP subprocess management

## Next Steps

1. User decides on fix approach (Option 1 for quick fix, Option 2 for proper fix)
2. If Option 1: Provide exact Render env var setup instructions
3. If Option 2: Create Redis-backed config implementation
4. Create test scripts to verify fix
5. Update documentation with deployment best practices
6. Consider long-term move to Option 3 for clean architecture

## Lessons Learned

1. **Subprocess communication:** File-based config doesn't work reliably across processes
2. **Ephemeral file systems:** Cloud platforms like Render wipe files on restart
3. **Architecture assumptions:** Local dev architecture may not work in production
4. **Multi-user isolation:** Redis or database needed for shared state in cloud
5. **Race conditions:** Startup order matters when subprocesses depend on parent's config

---

**Status:** Root cause identified, multiple solution paths available

**Recommendation:** Option 1 (env var) for immediate fix, Option 2 (Redis) for proper long-term solution
