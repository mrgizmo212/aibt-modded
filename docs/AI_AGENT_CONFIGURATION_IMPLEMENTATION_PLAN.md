# AI Agent Configuration Implementation Plan

**Date:** 2025-11-05  
**Author:** AI Assistant  
**Purpose:** Connect model configuration (UI) to AI trading agent behavior

---

## 🎯 OBJECTIVE

Make the AI trading agent **USE and ENFORCE** all model configuration fields:
- Trading Style (execution mode + context)
- Order Types (what orders AI can place)
- Shorting (whether AI can short stocks)
- Other Capabilities (options, hedging)
- Custom Instructions (user-defined strategy, versatile)

**Current Problem:** UI saves configuration, but AI ignores it.

**After Implementation:** AI receives configuration in system prompt AND system validates/enforces rules.

---

## 📋 ARCHITECTURE OVERVIEW

```
┌─────────────────────┐
│   USER CONFIGURES   │
│       MODEL         │
│  (UI - Frontend)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   DATABASE STORES   │
│   trading_style,    │
│   allow_shorting,   │
│   allowed_order_    │
│   types, etc.       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  START TRADING RUN  │
│  agent_manager.py   │
│  fetches model data │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AGENT RECEIVES     │
│  CONFIGURATION      │
│  - System Prompt    │
│  - Agent Properties │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AI MAKES DECISION  │
│  "BUY 100 AAPL"     │
│  "MARKET order"     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PRE-EXECUTION     │
│    VALIDATION       │
│  ✓ Order type OK?   │
│  ✓ Shorting allowed?│
│  ✓ Instrument OK?   │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
   VALID      INVALID
     │           │
     ▼           ▼
  EXECUTE     REJECT
            + LOG REASON
```

---

## 🔧 IMPLEMENTATION PLAN

### PHASE 1: Backend - Agent Configuration Injection

#### 1.1 Update Agent Manager (agent_manager.py)

**File:** `backend/trading/agent_manager.py`  
**Lines:** ~74-100

**Current code:**
```python
model_data = result.data[0] if result.data else {}

# Get custom rules/instructions from model (if any)
custom_rules = model_data.get("custom_rules")
custom_instructions = model_data.get("custom_instructions")

# Create agent instance
agent = BaseAgent(
    signature=model_signature,
    basemodel=basemodel,
    # ... other params ...
    custom_rules=custom_rules,
    custom_instructions=custom_instructions,
    model_parameters=model_parameters
)
```

**New code:**
```python
model_data = result.data[0] if result.data else {}

# Extract ALL configuration fields
trading_style = model_data.get("trading_style", "day-trading")
instrument = model_data.get("instrument", "stocks")
allow_shorting = model_data.get("allow_shorting", False)
allow_options_strategies = model_data.get("allow_options_strategies", False)
allow_hedging = model_data.get("allow_hedging", False)
allowed_order_types = model_data.get("allowed_order_types", ["market", "limit"])
custom_rules = model_data.get("custom_rules")
custom_instructions = model_data.get("custom_instructions")

print(f"📋 Model Configuration:")
print(f"   Style: {trading_style}")
print(f"   Instrument: {instrument}")
print(f"   Shorting: {'✅' if allow_shorting else '🚫'}")
print(f"   Order Types: {allowed_order_types}")

# Create agent instance with FULL configuration
agent = BaseAgent(
    signature=model_signature,
    basemodel=basemodel,
    # ... other params ...
    custom_rules=custom_rules,
    custom_instructions=custom_instructions,
    model_parameters=model_parameters,
    # NEW PARAMS:
    trading_style=trading_style,
    instrument=instrument,
    allow_shorting=allow_shorting,
    allow_options_strategies=allow_options_strategies,
    allow_hedging=allow_hedging,
    allowed_order_types=allowed_order_types
)
```

---

#### 1.2 Update BaseAgent Constructor (base_agent.py)

**File:** `backend/trading/base_agent.py`  
**Lines:** ~58-110

**Add parameters to `__init__()`:**
```python
def __init__(
    self,
    signature: str,
    basemodel: str,
    stock_symbols: Optional[List[str]] = None,
    # ... existing params ...
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    model_parameters: Optional[Dict[str, Any]] = None,
    # NEW CONFIGURATION PARAMS:
    trading_style: str = "day-trading",
    instrument: str = "stocks",
    allow_shorting: bool = False,
    allow_options_strategies: bool = False,
    allow_hedging: bool = False,
    allowed_order_types: Optional[List[str]] = None,
    trading_service: Optional[Any] = None
):
    # ... existing initialization ...
    
    # Store configuration
    self.trading_style = trading_style
    self.instrument = instrument
    self.allow_shorting = allow_shorting
    self.allow_options_strategies = allow_options_strategies
    self.allow_hedging = allow_hedging
    self.allowed_order_types = allowed_order_types or ["market", "limit"]
    
    print(f"🤖 Agent initialized with:")
    print(f"   Trading Style: {self.trading_style}")
    print(f"   Shorting: {'Enabled' if self.allow_shorting else 'Disabled'}")
    print(f"   Order Types: {', '.join(self.allowed_order_types)}")
```

---

#### 1.3 Update System Prompt Generation (agent_prompt.py)

**File:** `backend/trading/agent_prompt.py`

**Function:** `get_agent_system_prompt()` (lines ~102-169)

**Add parameters:**
```python
def get_agent_system_prompt(
    today_date: str, 
    signature: str, 
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    # NEW PARAMS:
    trading_style: str = "day-trading",
    instrument: str = "stocks",
    allow_shorting: bool = False,
    allow_options_strategies: bool = False,
    allow_hedging: bool = False,
    allowed_order_types: Optional[List[str]] = None
) -> str:
```

**Add configuration section to prompt:**
```python
# After base prompt, before custom rules/instructions

# Map style to description
style_descriptions = {
    "scalping": "⏱️ SCALPING (1-5 minute holds)\n- Exit ALL positions within 5 minutes\n- Focus on quick price movements\n- Tight 0.5-1% stop losses\n- High frequency, small gains",
    "day-trading": "📅 DAY TRADING (Intraday only)\n- Close ALL positions by 3:55 PM EST\n- No overnight risk\n- Focus on intraday momentum",
    "swing-trading": "📈 SWING TRADING (2-7 day holds)\n- Hold positions 2-7 days\n- Multi-day trends and momentum\n- Wider 3-5% stop losses",
    "investing": "💼 INVESTING (Long-term)\n- Hold weeks to months\n- Fundamental analysis focus\n- Company valuations and growth"
}

config_section = f"""

{'='*80}
⚙️ MODEL CONFIGURATION - YOU MUST FOLLOW THESE RULES
{'='*80}

🎯 TRADING STYLE: {trading_style.upper().replace('-', ' ')}
{style_descriptions.get(trading_style, '')}

🎯 ALLOWED INSTRUMENTS: {instrument.capitalize()} ONLY
- You can ONLY trade {instrument}
- Do NOT attempt to trade other asset types
- All tool calls must specify instrument="{instrument}"

🎯 TRADING CAPABILITIES:
{"✅ SHORT SELLING: ENABLED - You can short stocks (requires margin)" if allow_shorting else "🚫 SHORT SELLING: DISABLED - You can ONLY go long (BUY shares). All SELL orders must close existing positions."}
{"✅ MULTI-LEG OPTIONS: ENABLED - You can create spreads, straddles, iron condors" if allow_options_strategies else "🚫 MULTI-LEG OPTIONS: DISABLED - Single-leg positions only"}
{"✅ HEDGING: ENABLED - You can open offsetting positions to hedge risk" if allow_hedging else "🚫 HEDGING: DISABLED - Each position is directional only"}

🎯 ALLOWED ORDER TYPES: {', '.join(allowed_order_types or ['market', 'limit'])}
- ONLY use these order types when placing trades
- Any other order type will be REJECTED
- Examples: {_get_order_type_examples(allowed_order_types or ['market', 'limit'])}

⚠️ VIOLATIONS WILL BE REJECTED:
- Wrong instrument → Trade rejected
- Short order when shorting disabled → Trade rejected
- Wrong order type → Trade rejected

"""

# Add to base prompt
base_prompt += config_section
```

**Add helper function:**
```python
def _get_order_type_examples(allowed_types: List[str]) -> str:
    """Generate examples for allowed order types"""
    examples = {
        "market": "BUY 100 AAPL MARKET (execute immediately)",
        "limit": "BUY 100 AAPL LIMIT $150.00 (at $150 or better)",
        "stop": "SELL 100 AAPL STOP $145.00 (trigger at $145)",
        "stop-limit": "BUY 100 AAPL STOP-LIMIT stop=$151 limit=$152",
        "trailing-stop": "SELL 100 AAPL TRAILING-STOP trail=$2.00",
        "bracket": "BUY 100 AAPL BRACKET entry=$150 profit=$155 stop=$148"
    }
    return " | ".join([examples.get(t, t) for t in allowed_types[:2]])  # Show first 2
```

**Same changes for `get_intraday_system_prompt()`**

---

#### 1.4 Update Base Agent Prompt Call (base_agent.py)

**File:** `backend/trading/base_agent.py`  
**Lines:** ~427-432

**Current code:**
```python
system_message = SystemMessage(
    content=get_agent_system_prompt(
        today_date, 
        self.signature,
        custom_rules=self.custom_rules,
        custom_instructions=self.custom_instructions
    ),
)
```

**New code:**
```python
system_message = SystemMessage(
    content=get_agent_system_prompt(
        today_date, 
        self.signature,
        custom_rules=self.custom_rules,
        custom_instructions=self.custom_instructions,
        # NEW: Pass configuration
        trading_style=self.trading_style,
        instrument=self.instrument,
        allow_shorting=self.allow_shorting,
        allow_options_strategies=self.allow_options_strategies,
        allow_hedging=self.allow_hedging,
        allowed_order_types=self.allowed_order_types
    ),
)
```

---

### PHASE 2: Validation Layer

#### 2.1 Create Validation Module

**File:** `backend/trading/trade_validation.py` (NEW FILE)

```python
"""
Trade Validation Layer
Enforces model configuration constraints before trade execution
"""

from typing import Dict, List, Optional
from trading.base_agent import BaseAgent


def validate_trade(trade: Dict, agent: BaseAgent) -> Dict:
    """
    Validate trade complies with model configuration
    
    Args:
        trade: Trade dict with action, symbol, quantity, order_type, etc.
        agent: BaseAgent instance with configuration
    
    Returns:
        {"valid": True} or {"valid": False, "error": "reason", "rule_violated": "field"}
    """
    
    # 1. Validate Instrument
    trade_instrument = trade.get("instrument", "stocks")
    if trade_instrument != agent.instrument:
        return {
            "valid": False,
            "error": f"Instrument '{trade_instrument}' not allowed. Model configured for {agent.instrument} only.",
            "rule_violated": "instrument"
        }
    
    # 2. Validate Shorting
    action = trade.get("action", "").upper()
    if action in ["SHORT", "SELL_SHORT"] and not agent.allow_shorting:
        return {
            "valid": False,
            "error": "Short selling is disabled for this model. You can only go long (BUY shares).",
            "rule_violated": "allow_shorting"
        }
    
    # 3. Validate Order Type
    order_type = trade.get("order_type", "market").lower()
    if order_type not in [ot.lower() for ot in agent.allowed_order_types]:
        return {
            "valid": False,
            "error": f"Order type '{order_type}' not allowed. Allowed types: {', '.join(agent.allowed_order_types)}",
            "rule_violated": "allowed_order_types"
        }
    
    # 4. Validate Options Strategies (if multi-leg)
    is_multi_leg = trade.get("strategy_type") in ["spread", "straddle", "iron_condor", "butterfly"]
    if is_multi_leg and not agent.allow_options_strategies:
        return {
            "valid": False,
            "error": "Multi-leg option strategies are disabled for this model.",
            "rule_violated": "allow_options_strategies"
        }
    
    # 5. Validate Hedging
    is_hedge = trade.get("is_hedge", False) or trade.get("hedge_for_position_id")
    if is_hedge and not agent.allow_hedging:
        return {
            "valid": False,
            "error": "Hedging is disabled for this model.",
            "rule_violated": "allow_hedging"
        }
    
    # All validations passed
    return {"valid": True}


def log_validation_rejection(trade: Dict, validation_result: Dict, model_id: int, run_id: Optional[int] = None):
    """
    Log rejected trade to database for analysis
    
    Args:
        trade: The rejected trade
        validation_result: Validation result with error
        model_id: Model ID
        run_id: Optional run ID
    """
    from config import settings
    from supabase import create_client
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    log_entry = {
        "model_id": model_id,
        "run_id": run_id,
        "log_type": "validation_rejection",
        "message": validation_result["error"],
        "rule_violated": validation_result["rule_violated"],
        "attempted_trade": trade,
        "timestamp": datetime.now().isoformat()
    }
    
    # Insert to logs table (or ai_reasoning table)
    supabase.table("logs").insert(log_entry).execute()
    
    print(f"🚫 Trade Rejected: {validation_result['error']}")
    print(f"   Attempted: {trade.get('action')} {trade.get('quantity')} {trade.get('symbol')} {trade.get('order_type')}")
```

---

#### 2.2 Integrate Validation in Trading Flow

**File:** `backend/trading/intraday_agent.py`  
**Function:** Where trades are executed (after AI decision, before execution)

**Add validation call:**
```python
# After AI makes decision
decision = await _ai_decide_intraday(agent, minute, symbol, current_price, bar, current_position, ...)

action = decision.get("action")
reasoning = decision.get("reasoning")

# NEW: Validate trade against configuration
if action in ["BUY", "SELL", "SHORT"]:
    from trading.trade_validation import validate_trade, log_validation_rejection
    
    trade = {
        "action": action,
        "symbol": symbol,
        "quantity": decision.get("quantity"),
        "order_type": decision.get("order_type", "market"),
        "instrument": "stocks"
    }
    
    validation = validate_trade(trade, agent)
    
    if not validation["valid"]:
        # Trade rejected - log and skip
        print(f"    🚫 Validation Failed: {validation['error']}")
        log_validation_rejection(trade, validation, agent.model_id, run_id)
        
        # Add to recent rejections for AI context
        recent_rejections.append({
            "minute": minute,
            "trade": trade,
            "error": validation["error"],
            "rule": validation["rule_violated"]
        })
        
        # Continue to next minute WITHOUT executing
        continue
    
    # Validation passed - execute trade
    print(f"    ✅ Validation Passed - executing {action}")
```

---

### PHASE 3: Execution Mode Routing

#### 3.1 Determine Execution Mode from Style

**File:** Wherever trading runs are initiated (likely `backend/main.py` or `backend/services.py`)

**Add routing logic:**
```python
async def start_trading_run(model_id: int, user_id: str, symbol: str, date: str, ...):
    """
    Start trading run with correct execution mode based on model style
    """
    # Fetch model configuration
    model = await services.get_model_by_id(model_id, user_id)
    trading_style = model.get("trading_style", "day-trading")
    
    # Route to correct execution engine
    if trading_style in ['scalping', 'day-trading']:
        # Intraday execution - minute-by-minute
        print(f"📊 Starting INTRADAY run for {trading_style} model")
        result = await run_intraday_session(
            agent, model_id, user_id, symbol, date, session="regular", run_id=run_id
        )
    elif trading_style == 'swing-trading':
        # Daily execution - end-of-day
        print(f"📈 Starting SWING TRADING run (daily execution)")
        result = await run_swing_session(
            agent, model_id, user_id, symbol, start_date, end_date, run_id=run_id
        )
    elif trading_style == 'investing':
        # Weekly/monthly execution
        print(f"💼 Starting INVESTING run (long-term execution)")
        result = await run_investing_session(
            agent, model_id, user_id, symbol, start_date, end_date, run_id=run_id
        )
    else:
        raise ValueError(f"Unknown trading style: {trading_style}")
    
    return result
```

---

### PHASE 4: Custom Instructions - Versatility

**Key Principle:** 
- Configuration (order types, shorting, etc.) = HARD CONSTRAINTS (enforced by validation)
- Custom Instructions = SOFT GUIDANCE (AI considers but not strictly enforced)

**Example:**

**User configures:**
- Style: Scalping
- Shorting: Disabled
- Order Types: Market, Limit
- Custom Instructions: "Focus on tech stocks with high volume. Prefer FAANG companies. Exit quickly if momentum fades."

**What AI receives:**

**System Prompt:**
```
⚙️ CONFIGURATION (MANDATORY):
🚫 SHORT SELLING: DISABLED - You can ONLY go long
🎯 ORDER TYPES: market, limit (no other types allowed)

📋 STRATEGY GUIDANCE (FLEXIBLE):
Focus on tech stocks with high volume. Prefer FAANG companies. Exit quickly if momentum fades.
```

**Trade Decision:**
```
AI: "BUY 100 AAPL LIMIT $150" ✅ Valid (market/limit allowed)
AI: "SHORT 50 TSLA" ❌ Rejected (shorting disabled)
AI: "BUY 100 MSFT STOP-LIMIT" ❌ Rejected (stop-limit not allowed)
```

**Custom instructions are VERSATILE** - user can write anything. But hard constraints are ENFORCED.

---

## 🧪 TESTING PLAN

### Test 1: Scalping Model (Restrictive)
**Config:**
- Style: Scalping
- Shorting: Disabled
- Order Types: Market, Limit only

**Expected:**
- AI prompt includes "Exit within 5 minutes"
- AI can only use market/limit orders
- Short orders rejected with error
- Stop-limit orders rejected

---

### Test 2: Swing Trading Model (Permissive)
**Config:**
- Style: Swing Trading
- Shorting: Enabled
- Hedging: Enabled
- Order Types: Market, Limit, Stop-Limit, Trailing Stop

**Expected:**
- AI prompt includes "Hold 2-7 days"
- AI can short stocks
- AI can use stop-limit and trailing stop orders
- Bracket orders rejected (not in allowed list)

---

### Test 3: Custom Instructions Override
**Config:**
- Style: Day Trading (default instructions)
- Custom Instructions: "Ignore momentum. Only trade based on RSI < 30 or > 70. Max 3 positions."

**Expected:**
- AI prompt includes BOTH:
  - Configuration: "Close by 3:55 PM EST"
  - Instructions: "Only trade based on RSI..."
- AI follows custom strategy BUT respects constraints

---

## 📂 FILES TO MODIFY

**Backend:**
1. `backend/trading/agent_manager.py` - Extract and pass all config
2. `backend/trading/base_agent.py` - Store config in agent
3. `backend/trading/agent_prompt.py` - Add config to prompts
4. `backend/trading/trade_validation.py` (NEW) - Validation layer
5. `backend/trading/intraday_agent.py` - Call validation
6. Wherever runs are started - Route to correct execution mode

**Frontend:**
- Already done! ✅

---

## 🎯 SUCCESS CRITERIA

✅ AI system prompt includes all configuration  
✅ Trades validated before execution  
✅ Invalid trades rejected with clear error messages  
✅ Rejections logged to database  
✅ Scalping/Day Trading → Intraday execution  
✅ Swing/Investing → Daily execution  
✅ Custom instructions remain versatile  
✅ Hard constraints are enforced  

---

## 🚨 CRITICAL NOTES

**Custom Instructions = Versatile Strategy Guidance**
- User can write ANYTHING here
- AI considers it as guidance
- NOT strictly enforced (that's the point - flexibility!)

**Configuration = Hard Constraints**
- Enforced by validation layer
- AI CANNOT violate these
- System rejects non-compliant trades

**This separation gives:**
- Flexibility (custom instructions)
- Safety (configuration constraints)
- Best of both worlds!

---

## 📈 ESTIMATED IMPLEMENTATION

**Phase 1:** Backend config injection  
**Phase 2:** Validation layer  
**Phase 3:** Execution mode routing  
**Phase 4:** Testing and verification  

**All phases must be completed for production readiness.**

---

## 🔄 FUTURE ENHANCEMENTS

**After this is working:**
1. Admin UI for style template defaults
2. Database-driven style configurations
3. Per-user style template overrides
4. A/B testing different configurations
5. Performance metrics by configuration

**But first:** Get the core working!

