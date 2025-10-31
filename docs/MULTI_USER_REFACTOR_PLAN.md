# AIBT Multi-User Refactoring Plan - Complete Architecture Fix

**Date:** 2025-10-30  
**Purpose:** Fix both timeout hang AND multi-user race condition  
**Approach:** Stateless architecture with explicit context passing  
**Status:** PLAN - Awaiting approval before implementation

---

## 🎯 OBJECTIVES

### Problems Being Solved:

**Problem #1: Timeout Hang (Critical)**
- Missing `timeout` and `sse_read_timeout` in MCP client config
- Causes indefinite waits when services fail
- Backend requires force kill
- **Impact:** Blocks ALL trading

**Problem #2: Multi-User Race Condition (Architecture)**
- Shared `.runtime_env.json` file
- Global state across all users
- `SIGNATURE`, `TODAY_DATE`, `IF_TRADE` overwrite each other
- **Impact:** Users corrupt each other's trading sessions

### Goals:

1. ✅ Add June 2025 compliant timeouts to MCP configuration
2. ✅ Remove ALL shared state (no .runtime_env.json)
3. ✅ Pass context explicitly to all tool calls
4. ✅ Make architecture stateless and horizontally scalable
5. ✅ Maintain all existing functionality
6. ✅ Preserve data isolation (RLS)

---

## 📋 ARCHITECTURE BEFORE vs AFTER

### BEFORE (Current - Broken):

```
User 1 Request
    ↓
AgentManager.start_agent()
    ↓
BaseAgent.__init__()
    ↓
write_config_value("SIGNATURE", "user1-model")  ← Shared file write
write_config_value("TODAY_DATE", "2025-10-27")  ← Shared file write
    ↓
agent.run_trading_session()
    ↓
AI decides to buy AAPL
    ↓
MCP Tool: buy("AAPL", 100)
    ↓
tool_trade.py:
    signature = get_config_value("SIGNATURE")  ← Reads shared file
    today = get_config_value("TODAY_DATE")     ← Could read User 2's values!
    ↓
Position written to: /data/agent_data/{signature}/position/position.jsonl

PROBLEM: If User 2 started trading between steps, signature is now "user2-model"!
```

### AFTER (Fixed - Stateless):

```
User 1 Request (JWT: user_id="abc123")
    ↓
AgentManager.start_agent(model_id=26, user_id="abc123")
    ↓
BaseAgent.__init__(user_id="abc123", model_id=26, signature="test")
    ↓
self.context = ModelContext(
    user_id="abc123",
    model_id=26,
    signature="test",
    today_date="2025-10-27"
)  ← Context object, NO file writes
    ↓
agent.run_trading_session(self.context)
    ↓
AI decides to buy AAPL
    ↓
MCP Tool: buy("AAPL", 100, context={user_id, model_id, signature, date})
    ↓
tool_trade.py:
    signature = input.context.signature  ← From request, not file
    user_id = input.context.user_id     ← From request
    ↓
Position written to database:
    INSERT INTO positions (model_id, user_id, symbol, date)
    VALUES (26, "abc123", "AAPL", "2025-10-27")

RESULT: User 1 and User 2 can trade simultaneously with complete isolation!
```

---

## 📁 FILES TO MODIFY

### NEW FILES (3):

**1. `backend/models/trading_context.py`**
```python
"""
Trading Context - Immutable per-request context
NO SHARED STATE - all context passed explicitly
"""

from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class TradingContext(BaseModel):
    """Per-request trading context for multi-user isolation"""
    
    user_id: str = Field(..., description="Authenticated user ID from JWT")
    model_id: int = Field(..., description="Model ID being traded")
    signature: str = Field(..., description="Model signature for file paths")
    trading_date: str = Field(..., description="Trading date YYYY-MM-DD")
    
    class Config:
        frozen = True  # Immutable - prevents accidental modification

# Usage example:
# context = TradingContext(
#     user_id="abc123",
#     model_id=26,
#     signature="test",
#     trading_date="2025-10-27"
# )
```

**2. `backend/utils/database_trading.py`** (NEW - replaces JSONL file operations)
```python
"""
Database Trading Operations - Multi-user safe
Replaces position.jsonl file writes with PostgreSQL
"""

from supabase import create_client
from config import settings
from typing import Dict, Tuple
from models.trading_context import TradingContext

async def get_latest_position(context: TradingContext) -> Tuple[Dict[str, float], int]:
    """
    Get latest position from database (not JSONL file)
    
    Args:
        context: Trading context with user_id and model_id
        
    Returns:
        (positions_dict, action_id)
    """
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    # Query positions table (RLS-protected)
    result = supabase.table("positions")\
        .select("positions, action_id")\
        .eq("model_id", context.model_id)\
        .eq("date", context.trading_date)\
        .order("action_id", desc=True)\
        .limit(1)\
        .execute()
    
    if result.data:
        return result.data[0]["positions"], result.data[0]["action_id"]
    
    # No position yet - return initial state
    return {"CASH": 10000.0}, 0

async def record_trade(
    context: TradingContext,
    action_type: str,
    symbol: str,
    amount: float,
    new_positions: Dict[str, float],
    action_id: int
):
    """
    Record trade to database (not JSONL file)
    
    RLS ensures this can only insert for user's own model
    """
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    await supabase.table("positions").insert({
        "model_id": context.model_id,
        "user_id": context.user_id,
        "date": context.trading_date,
        "action_id": action_id,
        "action_type": action_type,
        "symbol": symbol,
        "amount": amount,
        "positions": new_positions,
        "cash": new_positions.get("CASH", 0)
    }).execute()
```

**3. `backend/utils/database_prices.py`** (NEW - replaces merged.jsonl reads)
```python
"""
Database Price Queries - Multi-user safe
Replaces merged.jsonl file reads with PostgreSQL
"""

from supabase import create_client
from config import settings
from typing import Dict, List

async def get_stock_prices(date: str, symbols: List[str]) -> Dict[str, float]:
    """
    Get stock prices from database (not JSONL file)
    
    Args:
        date: Trading date YYYY-MM-DD
        symbols: List of stock symbols
        
    Returns:
        Dict of {symbol: price}
    """
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    result = supabase.table("stock_prices")\
        .select("symbol, open")\
        .eq("date", date)\
        .in_("symbol", symbols)\
        .execute()
    
    # Format for compatibility with existing code
    prices = {}
    for row in result.data:
        prices[f"{row['symbol']}_price"] = row['open']
    
    return prices
```

---

### MODIFIED FILES (8):

**1. `backend/trading/base_agent.py`**

**Changes:**
- Add `user_id`, `model_id` to `__init__` parameters
- Create `TradingContext` instance
- Remove ALL `write_config_value()` and `get_config_value()` calls
- Pass context to all tool invocations
- Add timeouts to MCP configuration

**Lines to Change:**
- Constructor (lines 62-99): Add user_id, model_id params, create context
- MCP config (lines 136-155): Add timeout and sse_read_timeout
- Trading session (lines 515-516): Remove write_config_value calls
- Tool invocation: Pass context to tools

---

**2. `backend/mcp_services/tool_trade.py`**

**Changes:**
- Import `TradingContext`
- Update `buy()` signature to accept context
- Update `sell()` signature to accept context
- Remove `get_config_value("SIGNATURE")` (line 45)
- Remove `get_config_value("TODAY_DATE")` (line 50)
- Use `context.signature` and `context.trading_date` instead
- Replace position.jsonl writes with database inserts

**Complete rewrite of buy() function:**
```python
# BEFORE (lines 15-104):
@mcp.tool()
def buy(symbol: str, amount: int) -> Dict[str, Any]:
    signature = get_config_value("SIGNATURE")  # ❌ Shared state
    today_date = get_config_value("TODAY_DATE")  # ❌ Shared state
    # ... file operations

# AFTER:
from models.trading_context import TradingContext
from utils.database_trading import get_latest_position, record_trade

class BuyInput(BaseModel):
    symbol: str
    amount: int
    context: TradingContext  # ✅ Explicit context

@mcp.tool()
async def buy(input: BuyInput) -> Dict[str, Any]:
    """Buy stock - multi-user safe with explicit context"""
    
    # All values from context, not shared file
    signature = input.context.signature
    today_date = input.context.trading_date
    model_id = input.context.model_id
    user_id = input.context.user_id
    
    # Get position from database (RLS-protected)
    current_position, current_action_id = await get_latest_position(input.context)
    
    # Get price from database
    from utils.database_prices import get_stock_prices
    prices = await get_stock_prices(today_date, [input.symbol])
    price = prices.get(f"{input.symbol}_price")
    
    if not price:
        return {"error": f"Symbol {input.symbol} not found!"}
    
    # Validate sufficient cash
    cost = price * input.amount
    if current_position.get("CASH", 0) < cost:
        return {"error": "Insufficient cash!"}
    
    # Calculate new position
    new_position = current_position.copy()
    new_position["CASH"] -= cost
    new_position[input.symbol] = new_position.get(input.symbol, 0) + input.amount
    
    # Write to database (not file)
    await record_trade(
        context=input.context,
        action_type="buy",
        symbol=input.symbol,
        amount=input.amount,
        new_positions=new_position,
        action_id=current_action_id + 1
    )
    
    return new_position
```

---

**3. `backend/mcp_services/tool_get_price_local.py`**

**Changes:**
- Accept `TradingContext` parameter
- Query database instead of reading merged.jsonl
- Use `context.trading_date` instead of file config

---

**4. `backend/mcp_services/tool_jina_search.py`**

**Changes:**
- Accept `TradingContext` parameter (line 218)
- Use `context.trading_date` instead of `get_config_value("TODAY_DATE")` (line 192)
- Remove dependency on shared runtime file

---

**5. `backend/trading/agent_manager.py`**

**Changes:**
- Pass `user_id` and `model_id` to BaseAgent constructor
- These come from API request (JWT token)

**Line 64-79:**
```python
# BEFORE:
agent = BaseAgent(
    signature=model_signature,
    basemodel=basemodel,
    # ... no user_id or model_id
)

# AFTER:
agent = BaseAgent(
    user_id=user_id,          # ✅ From API request
    model_id=model_id,        # ✅ From API request
    signature=model_signature,
    basemodel=basemodel,
    # ...
)
```

---

**6. `backend/utils/general_tools.py`**

**Changes:**
- **DELETE** `_load_runtime_env()` function (lines 8-17)
- **DELETE** `get_config_value()` function (lines 21-26)
- **DELETE** `write_config_value()` function (lines 28-33)
- Keep other utility functions (extract_conversation, etc.)

**Result:** File shrinks from ~200 lines to ~160 lines

---

**7. `backend/config.py`**

**Changes:**
- **REMOVE** `RUNTIME_ENV_PATH` setting (line 71)
- No longer needed

---

**8. `backend/.env`**

**Changes:**
- **REMOVE** line 44: `RUNTIME_ENV_PATH=./data/.runtime_env.json`
- No longer needed

---

### FILES TO DELETE (1):

**1. `backend/data/.runtime_env.json`**
- No longer used
- Replaced with context passing

---

## 📊 DETAILED CHANGES BY FILE

### File 1: backend/models/trading_context.py (NEW)

**Purpose:** Define immutable per-request context

**Full Implementation:**
```python
"""
Trading Context - Immutable per-request execution context
Eliminates shared state for multi-user safety
"""

from pydantic import BaseModel, Field
from typing import Optional

class TradingContext(BaseModel):
    """
    Per-request trading context.
    
    Passed explicitly to all tools and functions.
    Immutable to prevent modification during request.
    Contains all information needed for isolated execution.
    """
    
    user_id: str = Field(
        ..., 
        description="Authenticated user ID from JWT token"
    )
    
    model_id: int = Field(
        ..., 
        description="Database model ID being executed"
    )
    
    signature: str = Field(
        ..., 
        description="Model signature for file paths and identification"
    )
    
    trading_date: str = Field(
        ..., 
        description="Trading date in YYYY-MM-DD format"
    )
    
    base_model: str = Field(
        ...,
        description="OpenRouter model name (e.g., 'openai/gpt-4o')"
    )
    
    class Config:
        frozen = True  # Immutable
        
    def to_dict(self) -> dict:
        """Convert to dict for JSON serialization"""
        return {
            "user_id": self.user_id,
            "model_id": self.model_id,
            "signature": self.signature,
            "trading_date": self.trading_date,
            "base_model": self.base_model
        }
```

**Lines:** ~55  
**Complexity:** Simple  
**Risk:** None (new file)

---

### File 2: backend/trading/base_agent.py (MODIFIED)

**Change 1: Constructor - Add Context Parameters**

**BEFORE (lines 62-99):**
```python
def __init__(
    self,
    signature: str,
    basemodel: str,
    stock_symbols: Optional[List[str]] = None,
    # ... other params, NO user_id or model_id
):
    self.signature = signature
    self.basemodel = basemodel
    # ...
```

**AFTER:**
```python
def __init__(
    self,
    user_id: str,          # ✅ NEW - from JWT
    model_id: int,         # ✅ NEW - from request
    signature: str,
    basemodel: str,
    stock_symbols: Optional[List[str]] = None,
    # ... other params
):
    self.user_id = user_id
    self.model_id = model_id
    self.signature = signature
    self.basemodel = basemodel
    
    # Create immutable context (NO file operations)
    from models.trading_context import TradingContext
    # Note: trading_date set later in run_trading_session
    self.context = None  # Initialized per session
```

---

**Change 2: MCP Config - Add Timeouts**

**BEFORE (lines 136-155):**
```python
def _get_default_mcp_config(self) -> Dict[str, Dict[str, Any]]:
    return {
        "math": {
            "transport": "streamable_http",
            "url": f"http://localhost:8000/mcp",
        },
        "stock_local": {
            "transport": "streamable_http",
            "url": f"http://localhost:8003/mcp",
        },
        # ... etc
    }
```

**AFTER (June 2025 compliant):**
```python
def _get_default_mcp_config(self) -> Dict[str, Dict[str, Any]]:
    from datetime import timedelta
    
    return {
        "math": {
            "transport": "streamable_http",
            "url": f"http://localhost:8000/mcp",
            "timeout": 10.0,              # ✅ Connection timeout (seconds)
            "sse_read_timeout": 60.0,     # ✅ SSE keep-alive timeout
        },
        "stock_local": {
            "transport": "streamable_http",
            "url": f"http://localhost:8003/mcp",
            "timeout": 10.0,              # ✅ Connection timeout
            "sse_read_timeout": 60.0,     # ✅ SSE timeout
        },
        "search": {
            "transport": "streamable_http",
            "url": f"http://localhost:8001/mcp",
            "timeout": 15.0,              # ✅ Longer for web requests
            "sse_read_timeout": 120.0,    # ✅ Web search can be slow
        },
        "trade": {
            "transport": "streamable_http",
            "url": f"http://localhost:8002/mcp",
            "timeout": 10.0,              # ✅ Connection timeout
            "sse_read_timeout": 60.0,     # ✅ SSE timeout
        },
    }
```

**Rationale (from June 2025 docs):**
- `timeout`: Initial connection timeout (prevents hang on connection)
- `sse_read_timeout`: How long to wait for tool response (prevents infinite wait)
- Search gets longer timeouts (web requests are slower)

---

**Change 3: Remove Shared State Writes**

**BEFORE (lines 515-516):**
```python
# Set configuration
write_config_value("TODAY_DATE", date)  # ❌ Shared file write
write_config_value("SIGNATURE", self.signature)  # ❌ Race condition
```

**AFTER:**
```python
# Create context for this trading session
from models.trading_context import TradingContext

self.context = TradingContext(
    user_id=self.user_id,
    model_id=self.model_id,
    signature=self.signature,
    trading_date=date,
    base_model=self.basemodel
)
# NO file writes - context passed to tools
```

---

**Change 4: Update Tool Invocations**

**BEFORE:**
```python
# Tools called without context
response = await self.agent.ainvoke({"messages": message})
# Tools use get_config_value() internally
```

**AFTER:**
```python
# Tools receive context in every call
# LangGraph agent automatically passes context to tools
# Tools access via input.context parameter
response = await self.agent.ainvoke(
    {"messages": message},
    config={
        "configurable": {
            "trading_context": self.context.to_dict()
        }
    }
)
```

---

### File 3: backend/mcp_services/tool_trade.py (MAJOR REWRITE)

**Change: Accept Context, Use Database**

**BEFORE (lines 15-104 - buy function):**
```python
@mcp.tool()
def buy(symbol: str, amount: int) -> Dict[str, Any]:
    # Get from shared file
    signature = get_config_value("SIGNATURE")  # ❌
    today_date = get_config_value("TODAY_DATE")  # ❌
    
    # Read from JSONL file
    current_position, current_action_id = get_latest_position(today_date, signature)  # ❌ File
    
    # ... validation ...
    
    # Write to JSONL file
    position_file_path = os.path.join(project_root, "data", "agent_data", signature, "position", "position.jsonl")  # ❌
    with open(position_file_path, "a") as f:  # ❌
        f.write(json.dumps({...}) + "\n")  # ❌
    
    write_config_value("IF_TRADE", True)  # ❌
    return new_position
```

**AFTER:**
```python
from pydantic import BaseModel, Field
from models.trading_context import TradingContext
from utils.database_trading import get_latest_position, record_trade
from utils.database_prices import get_stock_prices

class BuyInput(BaseModel):
    """Input schema for buy tool"""
    symbol: str = Field(..., description="Stock ticker symbol")
    amount: int = Field(..., description="Number of shares to buy")
    context: TradingContext = Field(..., description="Trading execution context")

@mcp.tool()
async def buy(input: BuyInput) -> Dict[str, Any]:
    """
    Buy stock - Multi-user safe with explicit context
    
    All state from context parameter, no shared files.
    Writes to database with RLS protection.
    """
    
    # All values from context (not shared file)
    signature = input.context.signature
    today_date = input.context.trading_date
    model_id = input.context.model_id
    user_id = input.context.user_id
    
    # Get position from database (RLS ensures user's own data)
    current_position, current_action_id = await get_latest_position(input.context)
    
    # Get price from database (public data)
    prices = await get_stock_prices(today_date, [input.symbol])
    price = prices.get(f"{input.symbol}_price")
    
    if not price:
        return {"error": f"Symbol {input.symbol} not found!"}
    
    # Validate cash
    cost = price * input.amount
    cash_available = current_position.get("CASH", 0)
    
    if cash_available < cost:
        return {
            "error": "Insufficient cash!",
            "required": cost,
            "available": cash_available
        }
    
    # Calculate new position
    new_position = current_position.copy()
    new_position["CASH"] = cash_available - cost
    new_position[input.symbol] = new_position.get(input.symbol, 0) + input.amount
    
    # Write to database (not file)
    await record_trade(
        context=input.context,
        action_type="buy",
        symbol=input.symbol,
        amount=input.amount,
        new_positions=new_position,
        action_id=current_action_id + 1
    )
    
    # NO write_config_value - trade recorded in database
    return new_position
```

**Same changes for `sell()` function (lines 106-189)**

---

### File 4: backend/mcp_services/tool_get_price_local.py (REWRITE)

**Change: Query Database Instead of JSONL**

**BEFORE (lines 26-85):**
```python
@mcp.tool()
def get_price_local(symbol: str, date: str) -> Dict[str, Any]:
    """Read from merged.jsonl file"""
    filename = "merged.jsonl"
    data_path = _workspace_data_path(filename)  # ❌ File path
    
    with data_path.open("r", encoding="utf-8") as f:  # ❌ File read
        for line in f:
            doc = json.loads(line)
            # ... parsing
```

**AFTER:**
```python
from pydantic import BaseModel, Field
from utils.database_prices import get_stock_prices

class GetPriceInput(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol")
    date: str = Field(..., description="Date in YYYY-MM-DD format")

@mcp.tool()
async def get_price_local(input: GetPriceInput) -> Dict[str, Any]:
    """
    Get stock OHLCV data from database
    
    Multi-user safe - queries public stock_prices table
    """
    
    from supabase import create_client
    from config import settings
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    result = supabase.table("stock_prices")\
        .select("symbol, date, open, high, low, close, volume")\
        .eq("symbol", input.symbol)\
        .eq("date", input.date)\
        .execute()
    
    if not result.data:
        return {"error": f"No data for {input.symbol} on {input.date}"}
    
    return result.data[0]
```

**Simpler, faster, multi-user safe.**

---

### File 5: backend/mcp_services/tool_jina_search.py (MODIFIED)

**Change: Accept Context for Date Filtering**

**BEFORE (line 192):**
```python
today_date = get_config_value("TODAY_DATE")  # ❌ Shared file
```

**AFTER:**
```python
class SearchInput(BaseModel):
    query: str
    context: TradingContext  # ✅ Explicit context

@mcp.tool()
async def get_information(input: SearchInput) -> str:
    """Web search with context for date filtering"""
    
    today_date = input.context.trading_date  # ✅ From context
    
    # ... rest of search logic unchanged
```

---

### File 6: backend/trading/agent_manager.py (MODIFIED)

**Change: Pass user_id and model_id to BaseAgent**

**BEFORE (lines 28-79):**
```python
async def start_agent(
    self,
    model_id: int,
    user_id: str,  # ← Received but not used!
    model_signature: str,
    basemodel: str,
    start_date: str,
    end_date: str
):
    # Create agent instance
    agent = BaseAgent(
        signature=model_signature,
        basemodel=basemodel,
        # NOT passing user_id or model_id! ❌
    )
```

**AFTER:**
```python
async def start_agent(
    self,
    model_id: int,
    user_id: str,
    model_signature: str,
    basemodel: str,
    start_date: str,
    end_date: str
):
    # Create agent instance WITH user/model context
    agent = BaseAgent(
        user_id=user_id,          # ✅ NOW passed
        model_id=model_id,        # ✅ NOW passed
        signature=model_signature,
        basemodel=basemodel,
        stock_symbols=all_nasdaq_100_symbols,
        log_path="./data/agent_data",
        max_steps=30,
        initial_cash=10000.0,
        init_date=start_date
    )
```

---

### File 7: backend/config.py (MODIFIED)

**Change: Remove Runtime Config Path**

**BEFORE (lines 67-71):**
```python
# Environment
NODE_ENV: str = "development"

# Runtime Configuration
RUNTIME_ENV_PATH: str = "./data/.runtime_env.json"  # ❌ DELETE THIS
```

**AFTER:**
```python
# Environment
NODE_ENV: str = "development"

# (Runtime config removed - using context passing instead)
```

---

### File 8: backend/utils/general_tools.py (MODIFIED)

**Change: Delete Config Functions**

**BEFORE (lines 8-33):**
```python
def _load_runtime_env() -> dict:
    path = os.environ.get("RUNTIME_ENV_PATH")
    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
    except:
        pass
    return {}

def get_config_value(key: str, default=None):
    _RUNTIME_ENV = _load_runtime_env()
    if key in _RUNTIME_ENV:
        return _RUNTIME_ENV[key]
    return os.getenv(key, default)

def write_config_value(key: str, value: any):
    _RUNTIME_ENV = _load_runtime_env()
    _RUNTIME_ENV[key] = value
    path = os.environ.get("RUNTIME_ENV_PATH")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_RUNTIME_ENV, f, ensure_ascii=False, indent=4)
```

**AFTER:**
```python
# DELETE ALL THREE FUNCTIONS ABOVE
# They are replaced by explicit context passing
```

**Keep remaining functions:**
- `extract_conversation()`
- `extract_tool_messages()`

---

## 🧪 TESTING PLAN

### Phase 1: Unit Testing

**Test 1: Context Creation**
```python
# test_trading_context.py
def test_context_creation():
    context = TradingContext(
        user_id="abc123",
        model_id=26,
        signature="test",
        trading_date="2025-10-27",
        base_model="openai/gpt-4o"
    )
    
    assert context.user_id == "abc123"
    assert context.model_id == 26
    assert context.frozen  # Immutable
```

**Test 2: Database Trade**
```python
async def test_database_trade():
    context = TradingContext(...)
    
    # Execute buy
    result = await buy(BuyInput(
        symbol="AAPL",
        amount=10,
        context=context
    ))
    
    # Verify in database
    position = await db.fetch_one(
        "SELECT * FROM positions WHERE model_id = $1",
        context.model_id
    )
    assert position is not None
```

---

### Phase 2: Multi-User Concurrent Testing

**Test: Simultaneous Trading**
```python
async def test_concurrent_users():
    # User 1 context
    context1 = TradingContext(
        user_id="user1",
        model_id=1,
        signature="user1-model",
        trading_date="2025-10-27",
        base_model="openai/gpt-4o"
    )
    
    # User 2 context
    context2 = TradingContext(
        user_id="user2",
        model_id=2,
        signature="user2-model",
        trading_date="2025-10-27",
        base_model="openai/gpt-4o"
    )
    
    # Start both simultaneously
    task1 = asyncio.create_task(run_agent(context1))
    task2 = asyncio.create_task(run_agent(context2))
    
    results = await asyncio.gather(task1, task2)
    
    # Verify isolation
    user1_positions = await db.fetch_all(
        "SELECT * FROM positions WHERE model_id = 1"
    )
    user2_positions = await db.fetch_all(
        "SELECT * FROM positions WHERE model_id = 2"
    )
    
    # Each should have their own trades, no mixing
    assert len(user1_positions) > 0
    assert len(user2_positions) > 0
    # Verify no cross-contamination
```

---

## 📊 MIGRATION EXECUTION ORDER

### Step 1: Create Foundation (Safe - No Breaking Changes)
1. Create `models/trading_context.py`
2. Create `utils/database_trading.py`
3. Create `utils/database_prices.py`
4. Add timeouts to `_get_default_mcp_config()`
5. **Test:** Backend starts, MCP services connect (no more hang)

### Step 2: Update Agent (Breaking Changes)
1. Modify `BaseAgent.__init__()` to accept user_id, model_id
2. Create context in `run_trading_session()`
3. Remove `write_config_value()` calls
4. **Test:** Agent initializes with context

### Step 3: Update Tools (Breaking Changes)
1. Modify `tool_trade.py` - rewrite buy() and sell()
2. Modify `tool_get_price_local.py` - use database
3. Modify `tool_jina_search.py` - accept context
4. **Test:** Tools work with context parameter

### Step 4: Update Agent Manager (Breaking Changes)
1. Modify `agent_manager.py` to pass user_id, model_id
2. **Test:** Full flow from API → Agent → Tools

### Step 5: Cleanup (Safe)
1. Delete `general_tools.py` config functions
2. Remove `RUNTIME_ENV_PATH` from config.py
3. Delete `.runtime_env.json` file
4. **Test:** No references to deleted code

### Step 6: Multi-User Testing
1. Test concurrent users
2. Load test with 10+ users
3. Verify data isolation
4. Verify no race conditions

---

## ⚠️ RISKS & MITIGATION

**Risk #1: Breaking Existing Single-User Flow**
- **Mitigation:** Test after each step, rollback if needed
- **Detection:** Run test_all.ps1 after each change

**Risk #2: Database Performance**
- **Concern:** Querying DB vs reading files
- **Mitigation:** Database has indexes, RLS is efficient
- **Reality:** Database is FASTER than file I/O for concurrent access

**Risk #3: Tool Call Signature Changes**
- **Concern:** LangGraph may not pass context correctly
- **Mitigation:** Use LangGraph's configurable system (documented pattern)
- **Fallback:** Can store context in agent instance if needed

---

## 📈 BENEFITS AFTER REFACTOR

**Immediate:**
- ✅ No more hangs (timeouts added)
- ✅ Multi-user safe (no shared state)
- ✅ Horizontally scalable (stateless)
- ✅ Database-backed (durable, ACID compliant)

**Long-term:**
- ✅ Can deploy multiple backend instances
- ✅ Can use load balancer
- ✅ No race conditions
- ✅ Better observability (database audit log)

---

## 🎯 APPROVAL REQUIRED

**Before implementing, confirm:**

1. ✅ Approach is correct (context passing + database)
2. ✅ File changes make sense
3. ✅ Migration order is safe
4. ✅ Testing plan is sufficient

**Total Changes:**
- 3 new files (~200 lines)
- 8 modified files (~300 line changes)
- 1 deleted file
- 3 deleted functions

**Estimated Complexity:** MEDIUM-HIGH  
**Estimated Risk:** MEDIUM (breaking changes, but well-planned)

---

**Ready to proceed with implementation, or need clarification on any part of the plan?**

