# 2025-11-03 14:30 - SIGNATURE Environment Variable Missing in Intraday Trading

## ERROR ANALYSIS

### The Error Logs Show:
```
⚠️  AI decision failed: Error calling tool 'buy': SIGNATURE environment variable is not set, defaulting to HOLD
⚠️  AI decision failed: Error calling tool 'sell': SIGNATURE environment variable is not set, defaulting to HOLD
```

### Root Cause Identified

**SIGNATURE is NOT being set during intraday trading initialization.**

## Code Flow Analysis

### Working Path (Daily Trading):
```
base_agent.run_date_range() 
  → line 571: write_config_value("SIGNATURE", self.signature)  ✅ SIGNATURE SET
  → run_trading_session()
  → AI calls buy/sell tools
  → tools read SIGNATURE via get_config_value("SIGNATURE")
  → WORKS ✅
```

### Broken Path (Intraday Trading):
```
main.py:start_intraday_trading() (line 910)
  → Creates BaseAgent (line 952)
  → agent.initialize() (line 965)
  → run_intraday_session() (line 968)
  → AI calls buy/sell tools
  → tools read SIGNATURE via get_config_value("SIGNATURE")  ❌ NOT SET
  → ValueError: "SIGNATURE environment variable is not set"
  → Caught at intraday_agent.py:789
  → Defaults to HOLD
```

## Code Citations

### Where SIGNATURE is Required

```45:47:backend/mcp_services/tool_trade.py
signature = get_config_value("SIGNATURE")
if signature is None:
    raise ValueError("SIGNATURE environment variable is not set")
```

```136:138:backend/mcp_services/tool_trade.py
signature = get_config_value("SIGNATURE")
if signature is None:
    raise ValueError("SIGNATURE environment variable is not set")
```

### Where SIGNATURE is Set (Daily Trading Only)

```570:571:backend/trading/base_agent.py
write_config_value("TODAY_DATE", date)
write_config_value("SIGNATURE", self.signature)
```

This ONLY runs in `run_date_range()`, NOT during intraday trading!

### Where Error is Caught

```788:790:backend/trading/intraday_agent.py
except Exception as e:
    print(f"    ⚠️  AI decision failed: {e}, defaulting to HOLD")
    return {"action": "hold", "reasoning": f"Error: {str(e)[:100]}"}
```

### Where Intraday Trading Starts (Missing SIGNATURE Setup)

```952:977:backend/main.py
# Create agent instance (with custom rules and model parameters!)
agent = BaseAgent(
    signature=model["signature"],
    basemodel=request.base_model,
    stock_symbols=[request.symbol],
    max_steps=10,
    initial_cash=model.get("initial_cash", 10000.0),
    model_id=model_id,
    custom_rules=model.get("custom_rules"),
    custom_instructions=model.get("custom_instructions"),
    model_parameters=model.get("model_parameters")
)

# Initialize agent
await agent.initialize()

# Run intraday session with run_id
result = await run_intraday_session(
    agent=agent,
    model_id=model_id,
    user_id=current_user["id"],
    symbol=request.symbol,
    date=request.date,
    session=request.session,
    run_id=run_id
)
```

**❌ PROBLEM: No `write_config_value("SIGNATURE", ...)` call before running session!**

## The Fix

### Simple Solution: Set SIGNATURE Before Running Intraday Session

Add these lines in `main.py` after creating the agent and before running the session:

```python
# Set configuration for MCP tools
from utils.general_tools import write_config_value
write_config_value("SIGNATURE", model["signature"])
write_config_value("TODAY_DATE", request.date)
```

Insert at line 965 (after `agent = BaseAgent(...)` and before `await agent.initialize()`)

## System-Wide Impact Analysis

### Direct Impact:
- Fixes buy/sell tool execution in intraday trading
- Allows AI decisions to actually execute instead of defaulting to HOLD

### Ripple Effects:
- None - this is an isolated missing configuration step
- Other parts of codebase already use this pattern (see base_agent.py:571)

### Edge Cases:
- Multi-user trading: Each model_id has its own runtime_env file (already handled)
- Concurrent trading: CURRENT_MODEL_ID env var isolates configs per model
- File system: Runtime env files are ephemeral but created per session

### Dependencies:
- Uses existing `write_config_value()` from utils/general_tools.py
- Follows same pattern as daily trading (base_agent.py:570-571)
- No external dependencies needed

### State Management:
- SIGNATURE stored in `/data/.runtime_env_{model_id}.json`
- TODAY_DATE also needs to be set (same as daily trading)
- MCP tools read from same file via `get_config_value()`

### Backwards Compatibility:
- No breaking changes
- Daily trading still works (uses run_date_range path)
- Intraday trading will start working
- No API changes needed

## Test Plan

### Test 1: Verify Bug Exists (scripts/verify-bug-signature-intraday.py)
```python
# Start intraday session without fix
# Observe: AI decisions default to HOLD with SIGNATURE error
# Expected: Bug reproduced 100%
```

### Test 2: Prove Fix Works (scripts/prove-fix-signature-intraday.py)
```python
# Apply fix (add write_config_value calls)
# Start intraday session
# Verify: AI executes actual BUY/SELL trades
# Check: No "SIGNATURE environment variable is not set" errors
# Expected: 100% success - trades execute properly
```

## Related Files

- `backend/main.py` - Where fix needs to be applied (line 965)
- `backend/mcp_services/tool_trade.py` - Where error originates
- `backend/trading/intraday_agent.py` - Where error is caught
- `backend/trading/base_agent.py` - Example of correct SIGNATURE setup
- `backend/utils/general_tools.py` - Config read/write functions

## Previous Context

See `/docs/tempDocs/2025-11-03-live-deployment-signature-error.md` for complete deployment analysis including:
- Multi-user isolation architecture
- Cross-process communication issues
- Redis-based solution for production
- Alternative fix approaches

This current fix addresses the **immediate code path issue** - SIGNATURE simply not being set during intraday initialization.

## Lessons Learned

1. **Initialization parity**: Intraday and daily trading need same config setup
2. **Environment variables**: Tools depend on config being set BEFORE agent runs
3. **Error handling**: Silent HOLD default hides the root cause from users
4. **Code citations**: Always verify WHERE and WHEN config values are set
5. **Path analysis**: Different code paths may have different initialization requirements

---

**Status:** Root cause confirmed via code analysis
**Action:** Apply simple fix in main.py
**Verification:** Create test scripts to prove fix

