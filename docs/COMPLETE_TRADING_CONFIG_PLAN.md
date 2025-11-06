# Complete Trading Configuration Integration Plan

**Date:** 2025-11-05  
**Status:** Planning  
**Goal:** Wire AI trading agent to use model configuration (order types, shorting, capabilities, custom instructions)

---

## 🎯 EXECUTIVE SUMMARY

**What We're Building:**
A complete integration between the model configuration UI and the AI trading agent, ensuring:
- AI receives ALL configuration in system prompts
- Hard constraints (order types, shorting) are ENFORCED by validation
- Soft guidance (custom instructions) remains VERSATILE
- Margin requirements for shorting are properly tracked
- Execution mode (intraday vs daily) routes correctly

**Current State:**
- ✅ UI complete - users can configure everything
- ✅ Database complete - all fields exist
- ❌ AI ignores configuration - doesn't receive it
- ❌ No validation - rules not enforced
- ❌ No margin tracking - shorting undefined behavior

**After Implementation:**
- ✅ AI knows all rules and constraints
- ✅ Trades validated before execution
- ✅ Invalid trades rejected with clear errors
- ✅ Margin requirements enforced for shorts
- ✅ Scalping/Day Trading → Intraday execution
- ✅ Swing/Investing → Daily execution

---

## 📊 ARCHITECTURE LAYERS

### Layer 1: Configuration Storage (DONE ✅)
- Database columns exist
- UI saves/loads correctly
- Fields: `trading_style`, `instrument`, `allow_shorting`, `allow_options_strategies`, `allow_hedging`, `allowed_order_types`, `margin_account`

### Layer 2: Configuration Injection (TODO ⚠️)
- Agent Manager fetches ALL config from database
- Passes to BaseAgent constructor
- BaseAgent stores as instance variables

### Layer 3: System Prompt Integration (TODO ⚠️)
- Configuration appears in AI system prompt
- AI knows its constraints
- Soft guidance (custom instructions) vs hard rules (config)

### Layer 4: Pre-Execution Validation (TODO ⚠️)
- Before ANY trade executes, validate against config
- Check: Order type allowed?
- Check: Shorting allowed?
- Check: Sufficient margin/buying power?
- Reject invalid trades with clear error

### Layer 5: Execution Mode Routing (TODO ⚠️)
- Scalping/Day Trading → Intraday (minute-by-minute)
- Swing Trading → Daily (end-of-day bars)
- Investing → Weekly/Monthly

### Layer 6: Margin System (TODO ⚠️)
- Track margin accounts separately from cash accounts
- Calculate buying power (2x-4x leverage)
- Enforce margin requirements for shorts
- Handle insufficient margin errors

---

## 🔧 DETAILED IMPLEMENTATION PHASES

### PHASE 1: Database - Add Margin Account Field

**Why:** Need to track which models have margin accounts (required for shorting)

**File:** New migration file

**SQL:**
```sql
-- Migration: Add margin_account to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS margin_account BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.models.margin_account IS 'Whether this model has a margin account (required for shorting and leverage)';

-- Update existing models: If allow_shorting=true, enable margin
UPDATE public.models SET margin_account = TRUE WHERE allow_shorting = TRUE;
```

**Backend Model Update:**
```python
# backend/models.py - Add to ModelInfo and ModelCreate
margin_account: Optional[bool] = False
```

**Frontend UI Update:**
```tsx
// model-edit-dialog.tsx
// Add checkbox (appears when allow_shorting is enabled)
{formData.allow_shorting && (
  <div className="mt-2 pl-6">
    <label className="flex items-center gap-2">
      <input 
        type="checkbox" 
        checked={formData.margin_account}
        onChange={(e) => setFormData({...formData, margin_account: e.target.checked})}
      />
      <span className="text-sm text-[#a3a3a3]">
        Enable Margin Account (2-4x buying power, required for shorting)
      </span>
    </label>
  </div>
)}
```

---

### PHASE 2: Backend - Configuration Injection

#### 2.1 Update Agent Manager

**File:** `backend/trading/agent_manager.py`  
**Lines:** ~74-100

**Changes:**
```python
# Fetch model data
result = supabase.table("models").select("*").eq("id", model_id).execute()
model_data = result.data[0] if result.data else {}

# Extract FULL configuration
config = {
    "trading_style": model_data.get("trading_style", "day-trading"),
    "instrument": model_data.get("instrument", "stocks"),
    "allow_shorting": model_data.get("allow_shorting", False),
    "allow_options_strategies": model_data.get("allow_options_strategies", False),
    "allow_hedging": model_data.get("allow_hedging", False),
    "allowed_order_types": model_data.get("allowed_order_types", ["market", "limit"]),
    "margin_account": model_data.get("margin_account", False),
    "custom_rules": model_data.get("custom_rules"),
    "custom_instructions": model_data.get("custom_instructions")
}

print(f"📋 Model Configuration Loaded:")
print(f"   Style: {config['trading_style']}")
print(f"   Margin Account: {'✅' if config['margin_account'] else '🚫'}")
print(f"   Shorting: {'✅' if config['allow_shorting'] else '🚫'}")
print(f"   Order Types: {config['allowed_order_types']}")

# Create agent with FULL configuration
agent = BaseAgent(
    signature=model_signature,
    basemodel=basemodel,
    stock_symbols=all_nasdaq_100_symbols,
    log_path="./data/agent_data",
    max_steps=max_steps,
    initial_cash=initial_cash,
    init_date=start_date,
    model_id=model_id,
    custom_rules=config["custom_rules"],
    custom_instructions=config["custom_instructions"],
    model_parameters=model_parameters,
    # NEW:
    trading_style=config["trading_style"],
    instrument=config["instrument"],
    allow_shorting=config["allow_shorting"],
    allow_options_strategies=config["allow_options_strategies"],
    allow_hedging=config["allow_hedging"],
    allowed_order_types=config["allowed_order_types"],
    margin_account=config["margin_account"]
)
```

---

#### 2.2 Update BaseAgent Constructor

**File:** `backend/trading/base_agent.py`  
**Lines:** ~58-110

**Add parameters:**
```python
def __init__(
    self,
    signature: str,
    basemodel: str,
    stock_symbols: Optional[List[str]] = None,
    mcp_config: Optional[Dict[str, Dict[str, Any]]] = None,
    log_path: Optional[str] = None,
    max_steps: int = 10,
    max_retries: int = 3,
    base_delay: float = 0.5,
    openai_base_url: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    initial_cash: float = 10000.0,
    init_date: str = "2025-10-13",
    model_id: Optional[int] = None,
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    model_parameters: Optional[Dict[str, Any]] = None,
    # NEW CONFIGURATION PARAMETERS:
    trading_style: str = "day-trading",
    instrument: str = "stocks",
    allow_shorting: bool = False,
    allow_options_strategies: bool = False,
    allow_hedging: bool = False,
    allowed_order_types: Optional[List[str]] = None,
    margin_account: bool = False,
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
    self.margin_account = margin_account
    
    # Calculate buying power based on margin
    self.buying_power_multiplier = self._calculate_buying_power_multiplier()
    
    print(f"🤖 Agent Configuration:")
    print(f"   Style: {self.trading_style}")
    print(f"   Margin: {'Yes' if self.margin_account else 'No'}")
    print(f"   Buying Power: {self.buying_power_multiplier}x")
    print(f"   Shorting: {'Allowed' if self.allow_shorting else 'Disabled'}")

def _calculate_buying_power_multiplier(self) -> float:
    """Calculate buying power multiplier based on account type and style"""
    if not self.margin_account:
        return 1.0  # Cash account - 1x buying power
    
    # Margin account
    if self.trading_style in ['scalping', 'day-trading']:
        return 4.0  # Day trading margin - 4x buying power
    else:
        return 2.0  # Standard margin - 2x buying power
```

---

### PHASE 3: System Prompt Integration

#### 3.1 Update get_agent_system_prompt()

**File:** `backend/trading/agent_prompt.py`  
**Function:** `get_agent_system_prompt()` (lines ~102-169)

**Add parameters and configuration section:**
```python
def get_agent_system_prompt(
    today_date: str, 
    signature: str, 
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    # NEW:
    trading_style: str = "day-trading",
    instrument: str = "stocks",
    allow_shorting: bool = False,
    margin_account: bool = False,
    allow_options_strategies: bool = False,
    allow_hedging: bool = False,
    allowed_order_types: Optional[List[str]] = None
) -> str:
    """Generate system prompt with configuration"""
    
    # ... base prompt ...
    
    # Add configuration section
    style_context = {
        "scalping": "⏱️ SCALPING (1-5 minute holds)\n- EXIT all positions within 5 minutes maximum\n- Focus on quick price movements, high volume\n- Tight stop losses (0.5-1%)\n- High frequency, small gains per trade",
        "day-trading": "📅 DAY TRADING (Intraday only)\n- CLOSE all positions by 3:55 PM EST\n- No overnight risk\n- Focus on intraday momentum and volume",
        "swing-trading": "📈 SWING TRADING (2-7 days)\n- Hold positions for 2-7 days\n- Multi-day trends and momentum continuation\n- Wider stop losses (3-5%)\n- Fewer trades, larger positions",
        "investing": "💼 INVESTING (Long-term)\n- Hold weeks to months\n- Fundamental analysis: valuations, earnings, growth\n- Long-term perspective"
    }
    
    config_prompt = f"""

{'='*80}
⚙️ MODEL CONFIGURATION - MANDATORY CONSTRAINTS
{'='*80}

🎯 TRADING STYLE: {trading_style.upper().replace('-', ' ')}
{style_context.get(trading_style, '')}

🎯 ACCOUNT TYPE: {'Margin Account' if margin_account else 'Cash Account'}
{'- Buying Power: 4x cash (day trading margin)' if margin_account and trading_style in ['scalping', 'day-trading'] else ''}
{'- Buying Power: 2x cash (standard margin)' if margin_account and trading_style not in ['scalping', 'day-trading'] else ''}
{'- Buying Power: 1x cash (no leverage)' if not margin_account else ''}

🎯 ALLOWED INSTRUMENTS: {instrument.capitalize()} ONLY
- You can ONLY trade {instrument}
- Do NOT attempt other asset types

🎯 TRADING CAPABILITIES:
"""

    # Shorting
    if allow_shorting and margin_account:
        config_prompt += "✅ SHORT SELLING: ENABLED\n"
        config_prompt += "   - You CAN short stocks\n"
        config_prompt += "   - Margin requirement: 50% of short value\n"
        config_prompt += "   - Example: Short $10,000 worth requires $5,000 margin\n"
    elif allow_shorting and not margin_account:
        config_prompt += "⚠️ SHORT SELLING: CONFIGURED BUT NO MARGIN ACCOUNT\n"
        config_prompt += "   - Shorting is enabled but margin account is disabled\n"
        config_prompt += "   - All short orders will be REJECTED\n"
    else:
        config_prompt += "🚫 SHORT SELLING: DISABLED\n"
        config_prompt += "   - You can ONLY go long (BUY shares)\n"
        config_prompt += "   - All SELL orders must close existing long positions\n"
    
    # Options
    if allow_options_strategies:
        config_prompt += "✅ MULTI-LEG OPTIONS: ENABLED\n"
        config_prompt += "   - You can create spreads, straddles, iron condors\n"
    else:
        config_prompt += "🚫 MULTI-LEG OPTIONS: DISABLED\n"
        config_prompt += "   - Single-leg positions only\n"
    
    # Hedging
    if allow_hedging:
        config_prompt += "✅ HEDGING: ENABLED\n"
        config_prompt += "   - You can open offsetting positions to hedge risk\n"
    else:
        config_prompt += "🚫 HEDGING: DISABLED\n"
        config_prompt += "   - Each position is directional only\n"
    
    config_prompt += f"""

🎯 ALLOWED ORDER TYPES: {', '.join(allowed_order_types or ['market', 'limit'])}
"""
    
    # Order type explanations
    order_type_info = {
        "market": "   - Market: Execute immediately at current price",
        "limit": "   - Limit: Buy/sell at specific price or better",
        "stop": "   - Stop: Trigger market order when price hits stop level",
        "stop-limit": "   - Stop-Limit: Trigger limit order at stop price",
        "trailing-stop": "   - Trailing Stop: Dynamic stop that follows price movement",
        "bracket": "   - Bracket: Entry with automatic profit target and stop loss"
    }
    
    for ot in (allowed_order_types or ['market', 'limit']):
        if ot.lower() in order_type_info:
            config_prompt += order_type_info[ot.lower()] + "\n"
    
    config_prompt += """

⚠️ RULE VIOLATIONS = AUTOMATIC REJECTION:
- Wrong instrument → REJECTED
- Short order when shorting disabled → REJECTED
- Wrong order type → REJECTED
- Insufficient margin → REJECTED

All rejections are logged and you will be notified in the next decision.

"""
    
    # Add to base prompt
    base_prompt += config_prompt
    
    # Then add custom rules/instructions (after hard constraints)
    # ... existing code for custom_rules and custom_instructions ...
```

**Same changes for `get_intraday_system_prompt()`**

---

### PHASE 4: Validation Layer

#### 4.1 Create Validation Module

**File:** `backend/trading/trade_validation.py` (NEW)

```python
"""
Trade Validation Layer
Enforces model configuration constraints before execution
"""

from typing import Dict, List, Optional
from datetime import datetime


def validate_trade(trade: Dict, agent: 'BaseAgent') -> Dict:
    """
    Validate trade against model configuration
    
    Args:
        trade: {
            "action": "BUY" | "SELL" | "SHORT",
            "symbol": "AAPL",
            "quantity": 100,
            "order_type": "market" | "limit" | etc.,
            "price": 150.00 (for limit orders),
            "instrument": "stocks"
        }
        agent: BaseAgent instance with configuration
    
    Returns:
        {
            "valid": True | False,
            "error": "Error message" (if invalid),
            "rule_violated": "field_name" (if invalid)
        }
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
    if action in ["SHORT", "SELL_SHORT"]:
        if not agent.allow_shorting:
            return {
                "valid": False,
                "error": "Short selling is disabled for this model. You can only go long (BUY shares).",
                "rule_violated": "allow_shorting"
            }
        
        if not agent.margin_account:
            return {
                "valid": False,
                "error": "Short selling requires a margin account. Current account is cash only.",
                "rule_violated": "margin_account"
            }
    
    # 3. Validate Order Type
    order_type = trade.get("order_type", "market").lower()
    allowed_types_lower = [ot.lower() for ot in agent.allowed_order_types]
    
    if order_type not in allowed_types_lower:
        return {
            "valid": False,
            "error": f"Order type '{order_type}' not allowed. Allowed types: {', '.join(agent.allowed_order_types)}",
            "rule_violated": "allowed_order_types"
        }
    
    # 4. Validate Options Strategies
    is_multi_leg = trade.get("strategy_type") in ["spread", "straddle", "iron_condor", "butterfly"]
    if is_multi_leg and not agent.allow_options_strategies:
        return {
            "valid": False,
            "error": "Multi-leg option strategies are disabled for this model. Single-leg only.",
            "rule_violated": "allow_options_strategies"
        }
    
    # 5. Validate Hedging
    is_hedge = trade.get("is_hedge", False) or trade.get("hedge_for_position_id")
    if is_hedge and not agent.allow_hedging:
        return {
            "valid": False,
            "error": "Hedging is disabled for this model. Each position must be directional only.",
            "rule_violated": "allow_hedging"
        }
    
    # 6. Validate Margin Requirements (for shorts)
    if action in ["SHORT", "SELL_SHORT"] and agent.margin_account:
        quantity = trade.get("quantity", 0)
        price = trade.get("price", 0)
        short_value = quantity * price
        
        # Get current cash/margin status from position
        current_cash = trade.get("current_cash", agent.initial_cash)
        buying_power = current_cash * agent.buying_power_multiplier
        
        # Short requires 50% margin
        margin_required = short_value * 0.5
        
        if margin_required > buying_power:
            return {
                "valid": False,
                "error": f"Insufficient margin. Need ${margin_required:,.2f}, have ${buying_power:,.2f} buying power.",
                "rule_violated": "margin_requirement"
            }
    
    # All validations passed
    return {"valid": True}


def log_validation_rejection(
    trade: Dict, 
    validation_result: Dict, 
    model_id: int, 
    minute: str,
    run_id: Optional[int] = None
):
    """
    Log rejected trade to database
    
    Stores:
    - What trade was attempted
    - Why it was rejected
    - Which rule was violated
    - For analysis and AI feedback
    """
    from config import settings
    from supabase import create_client
    import json
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    log_entry = {
        "model_id": model_id,
        "run_id": run_id,
        "log_type": "validation_rejection",
        "trade_date": minute.split()[0] if ' ' in minute else minute,
        "minute_time": minute.split()[1] if ' ' in minute else None,
        "message": f"REJECTED: {validation_result['error']}",
        "metadata": json.dumps({
            "attempted_trade": trade,
            "rule_violated": validation_result.get("rule_violated"),
            "error": validation_result["error"]
        })
    }
    
    try:
        supabase.table("logs").insert(log_entry).execute()
        print(f"    📝 Rejection logged to database")
    except Exception as e:
        print(f"    ⚠️ Failed to log rejection: {e}")
```

---

#### 4.2 Integrate Validation in Intraday Trading

**File:** `backend/trading/intraday_agent.py`  
**Location:** After AI decision, before trade execution

**Add validation:**
```python
# AI makes decision
decision = await _ai_decide_intraday(
    agent, minute, symbol, current_price, bar, current_position, 
    run_id, recent_rejections, conversation_history
)

action = decision.get("action")
reasoning = decision.get("reasoning", "No reasoning")

# Execute based on action
if action in ["BUY", "SELL", "SHORT"]:
    # NEW: Validate trade before execution
    from trading.trade_validation import validate_trade, log_validation_rejection
    
    # Build trade object
    trade = {
        "action": action,
        "symbol": symbol,
        "quantity": decision.get("quantity", 10),  # Default if AI doesn't specify
        "order_type": decision.get("order_type", "market"),
        "price": current_price,  # For margin calculation
        "current_cash": current_position.get("CASH", agent.initial_cash),
        "instrument": "stocks"
    }
    
    # Validate
    validation = validate_trade(trade, agent)
    
    if not validation["valid"]:
        # REJECTED - log and skip execution
        print(f"    🚫 TRADE REJECTED: {validation['error']}")
        
        # Log to database
        log_validation_rejection(trade, validation, agent.model_id, minute, run_id)
        
        # Add to recent rejections (AI will see this in next decision)
        rejection_entry = {
            "minute": minute,
            "trade": f"{action} {trade['quantity']} {symbol} {trade['order_type']}",
            "error": validation["error"],
            "rule": validation["rule_violated"]
        }
        recent_rejections.append(rejection_entry)
        
        # Add to conversation history so AI learns
        conversation_history.append({
            "minute": minute,
            "decision": f"{action} {trade['quantity']} {symbol}",
            "result": f"REJECTED - {validation['error']}",
            "reasoning": reasoning
        })
        
        # Continue to next minute (no execution)
        continue
    
    # Validation PASSED - execute trade
    print(f"    ✅ Validation passed - executing {action}")
    
    # ... existing execution code ...
```

---

### PHASE 5: Margin System

#### 5.1 Buying Power Calculation

**Add to position tracking:**
```python
def calculate_buying_power(agent: 'BaseAgent', current_position: Dict) -> float:
    """
    Calculate available buying power
    
    Args:
        agent: BaseAgent with margin_account and trading_style
        current_position: Current portfolio with cash
    
    Returns:
        Available buying power in dollars
    """
    cash = current_position.get("CASH", agent.initial_cash)
    
    if not agent.margin_account:
        # Cash account - 1x
        return cash
    
    # Margin account
    if agent.trading_style in ['scalping', 'day-trading']:
        # Day trading margin - 4x
        return cash * 4.0
    else:
        # Standard margin - 2x
        return cash * 2.0


def calculate_margin_used(current_position: Dict) -> float:
    """
    Calculate current margin used (for short positions)
    
    Args:
        current_position: Portfolio with positions
    
    Returns:
        Total margin currently used
    """
    margin_used = 0.0
    
    # For each short position, margin = 50% of position value
    for symbol, quantity in current_position.items():
        if symbol == "CASH":
            continue
        
        if quantity < 0:  # Short position
            # Need current price to calculate value
            # This would come from market data
            position_value = abs(quantity) * get_current_price(symbol)
            margin_used += position_value * 0.5
    
    return margin_used


def validate_margin_requirements(
    trade: Dict, 
    agent: 'BaseAgent', 
    current_position: Dict
) -> Dict:
    """
    Validate sufficient margin for short trade
    
    Returns:
        {"valid": True} or {"valid": False, "error": "..."}
    """
    if not trade.get("action") in ["SHORT", "SELL_SHORT"]:
        return {"valid": True}  # Not a short, no margin check needed
    
    buying_power = calculate_buying_power(agent, current_position)
    margin_used = calculate_margin_used(current_position)
    available_margin = buying_power - margin_used
    
    short_value = trade.get("quantity", 0) * trade.get("price", 0)
    margin_required = short_value * 0.5
    
    if margin_required > available_margin:
        return {
            "valid": False,
            "error": f"Insufficient margin. Short requires ${margin_required:,.2f}, available: ${available_margin:,.2f}"
        }
    
    return {"valid": True}
```

**Integrate into main validation:**
```python
# In validate_trade(), add:
if action in ["SHORT", "SELL_SHORT"]:
    margin_validation = validate_margin_requirements(trade, agent, current_position)
    if not margin_validation["valid"]:
        return {
            "valid": False,
            "error": margin_validation["error"],
            "rule_violated": "margin_requirement"
        }
```

---

### PHASE 6: Execution Mode Routing

#### 6.1 Route Based on Trading Style

**File:** Wherever runs are started (likely `backend/main.py` or services)

```python
async def start_model_trading_run(
    model_id: int,
    user_id: str,
    symbol: str,
    date: str,
    session: str = "regular",
    ...
):
    """Start trading run with correct execution mode"""
    
    # Fetch model to get trading_style
    model = await services.get_model_by_id(model_id, user_id)
    trading_style = model.get("trading_style", "day-trading")
    
    print(f"🚀 Starting trading run:")
    print(f"   Model: {model.get('name')}")
    print(f"   Style: {trading_style}")
    
    # Route to correct execution engine
    if trading_style in ['scalping', 'day-trading']:
        # Intraday execution - process every minute
        print(f"📊 Using INTRADAY execution (minute-by-minute)")
        result = await run_intraday_session(
            agent=agent,
            model_id=model_id,
            user_id=user_id,
            symbol=symbol,
            date=date,
            session=session,
            run_id=run_id
        )
    
    elif trading_style == 'swing-trading':
        # Daily execution - end-of-day bars
        print(f"📈 Using DAILY execution (swing trading)")
        result = await run_swing_session(
            agent=agent,
            model_id=model_id,
            user_id=user_id,
            symbol=symbol,
            start_date=date,
            end_date=end_date,
            run_id=run_id
        )
    
    elif trading_style == 'investing':
        # Weekly/monthly execution
        print(f"💼 Using LONG-TERM execution (investing)")
        result = await run_investing_session(
            agent=agent,
            model_id=model_id,
            user_id=user_id,
            symbol=symbol,
            start_date=date,
            end_date=end_date,
            run_id=run_id
        )
    
    else:
        raise ValueError(f"Unknown trading style: {trading_style}")
    
    return result
```

---

### PHASE 7: Performance Metrics Context

#### 7.1 Update Performance Metrics Calculation

**File:** `backend/services.py`  
**Function:** `calculate_and_cache_performance()` (lines ~567-606)

**Current code:**
```python
perf_data = {
    "model_id": model_id,
    "start_date": clean_date(metrics.get("start_date")),
    "end_date": clean_date(metrics.get("end_date")),
    "total_trading_days": metrics.get("total_trading_days", 0),
    "cumulative_return": metrics.get("cumulative_return", 0.0),
    # ... other metrics ...
}
```

**New code:**
```python
# Fetch model config for context
model = await get_model_by_id(model_id, None)  # None = bypass user check (internal call)
trading_style = model.get("trading_style", "day-trading")
margin_account = model.get("margin_account", False)

# Calculate leverage used
leverage_used = 4.0 if (margin_account and trading_style in ['scalping', 'day-trading']) else \
                2.0 if margin_account else \
                1.0

perf_data = {
    "model_id": model_id,
    "start_date": clean_date(metrics.get("start_date")),
    "end_date": clean_date(metrics.get("end_date")),
    "total_trading_days": metrics.get("total_trading_days", 0),
    "cumulative_return": metrics.get("cumulative_return", 0.0),
    # ... other metrics ...
    # NEW: Add context
    "trading_style": trading_style,
    "margin_account": margin_account,
    "leverage_used": leverage_used
}
```

#### 7.2 Update Performance Response Model

**File:** `backend/models.py`  
**Class:** `PerformanceMetrics` (lines ~174-186)

**Add fields:**
```python
class PerformanceMetrics(BaseModel):
    sharpe_ratio: float
    max_drawdown: float
    max_drawdown_start: Optional[date]
    max_drawdown_end: Optional[date]
    cumulative_return: float
    annualized_return: float
    volatility: float
    win_rate: float
    profit_loss_ratio: float
    total_trading_days: int
    initial_value: float
    final_value: float
    # NEW:
    trading_style: Optional[str] = None
    margin_account: Optional[bool] = None
    leverage_used: Optional[float] = None
```

#### 7.3 Display Context in Frontend

**Purpose:** Show leverage and style context with metrics

**Example UI:**
```tsx
<div className="performance-card">
  <h3>SWING TRADER PRO</h3>
  <div className="metrics">
    <span>Return: +24.5%</span>
    <span className="context">(2x margin)</span>
  </div>
  <div className="style-badge">Swing Trading</div>
  <div className="sharpe">Sharpe: 1.8</div>
</div>
```

**Why this matters:**
- 15% return with 1x leverage ≠ 15% return with 4x leverage
- Users can compare apples to apples
- Leaderboard can segment by style/leverage

---

## 🧪 COMPREHENSIVE TESTING PLAN

### Test Scenario 1: Scalping Model (Restrictive)

**Configuration:**
- Style: Scalping
- Margin Account: No
- Shorting: Disabled
- Order Types: Market, Limit only

**Test Cases:**
1. **Valid Trade:** `BUY 100 AAPL MARKET` → ✅ Should execute
2. **Invalid Order Type:** `BUY 100 AAPL STOP` → ❌ Should reject "stop not allowed"
3. **Invalid Action:** `SHORT 50 TSLA` → ❌ Should reject "shorting disabled"
4. **Valid Sell:** `SELL 100 AAPL MARKET` (closing position) → ✅ Should execute

**Expected Logs:**
- Rejection logs in database for cases 2 & 3
- AI receives rejection feedback in next decision
- System prompt shows "🚫 SHORT SELLING: DISABLED"

---

### Test Scenario 2: Swing Trading Model (Permissive + Margin)

**Configuration:**
- Style: Swing Trading
- Margin Account: Yes
- Shorting: Enabled
- Hedging: Enabled  
- Order Types: Market, Limit, Stop-Limit, Trailing Stop

**Test Cases:**
1. **Valid Short:** `SHORT 100 AAPL MARKET` with $10,000 cash → ✅ Should execute (needs $7,500 margin, has $20,000 buying power)
2. **Insufficient Margin:** `SHORT 500 AAPL` worth $75,000 → ❌ Should reject (needs $37,500 margin, only has $20,000 buying power)
3. **Valid Trailing Stop:** `SELL 100 MSFT TRAILING-STOP trail=$2` → ✅ Should execute
4. **Invalid Bracket:** `BUY 100 GOOG BRACKET` → ❌ Should reject "bracket not in allowed types"

**Expected:**
- System prompt shows "✅ SHORT SELLING: ENABLED"
- Buying power = $10,000 * 2.0 = $20,000 (standard margin)
- Margin validation working

---

### Test Scenario 3: Day Trading with Margin

**Configuration:**
- Style: Day Trading
- Margin Account: Yes
- Shorting: Enabled
- Order Types: Market, Limit, Stop

**Expected:**
- Buying power = $10,000 * 4.0 = $40,000 (day trading margin!)
- Can short up to $80,000 worth (needs $40,000 margin)
- Must close all positions by 3:55 PM EST

---

### Test Scenario 4: Custom Instructions Versatility

**Configuration:**
- Style: Day Trading
- Custom Instructions: "Only trade when RSI < 30 or > 70. Max 3 positions simultaneously. Prefer tech sector."

**Expected:**
- System prompt includes configuration constraints
- System prompt includes custom instructions separately
- AI follows custom strategy (RSI, max 3 positions, tech focus)
- BUT still can't violate hard constraints (shorting, order types)

**Example:**
- AI wants to: `SHORT 100 AAPL` based on RSI > 70
- If shorting disabled → REJECTED despite valid RSI signal
- If shorting enabled → EXECUTES (RSI strategy + config both satisfied)

---

## 📁 FILES TO MODIFY

### Backend
1. ✅ `backend/models.py` - Add `margin_account` to ModelInfo/ModelCreate
2. ✅ `backend/services.py` - Handle `margin_account` in create/update
3. ✅ `backend/main.py` - Pass `margin_account` in API endpoints
4. ⚠️ `backend/migrations/016_add_margin_account.sql` (NEW)
5. ⚠️ `backend/trading/agent_manager.py` - Extract and pass ALL config
6. ⚠️ `backend/trading/base_agent.py` - Store config, calculate buying power
7. ⚠️ `backend/trading/agent_prompt.py` - Add config to prompts
8. ⚠️ `backend/trading/trade_validation.py` (NEW) - Validation layer
9. ⚠️ `backend/trading/intraday_agent.py` - Call validation before trades
10. ⚠️ Run starter (wherever it is) - Route execution mode by style

### Frontend
1. ⚠️ `frontend-v2/components/model-edit-dialog.tsx` - Add margin account checkbox
2. ⚠️ `frontend-v2/lib/api.ts` - Add `margin_account` to TypeScript types

---

## ✅ SUCCESS CRITERIA

**Configuration Flow:**
- ✅ UI → Database → Agent → AI Prompt → Validation → Execution
- ✅ Every step preserves configuration
- ✅ Nothing gets lost or ignored

**Hard Constraints Enforced:**
- ✅ Wrong order type → Rejected
- ✅ Short when disabled → Rejected
- ✅ Insufficient margin → Rejected
- ✅ All rejections logged

**Soft Guidance Respected:**
- ✅ Custom instructions appear in prompt
- ✅ AI considers them when making decisions
- ✅ Not strictly enforced (versatile!)

**Execution Modes:**
- ✅ Scalping/Day Trading → Minute-by-minute
- ✅ Swing → Daily bars
- ✅ Investing → Weekly/monthly

**Margin System:**
- ✅ Margin account enables 2-4x buying power
- ✅ Shorting requires margin account
- ✅ Margin requirements calculated and enforced
- ✅ Insufficient margin → Clear error

---

## 🔄 IMPLEMENTATION ORDER

1. **Phase 1:** Add margin_account database field (SQL migration)
2. **Phase 2:** Backend configuration injection (agent_manager → BaseAgent)
3. **Phase 3:** System prompt integration (agent sees rules)
4. **Phase 4:** Validation layer (enforce rules via config_validator)
5. **Phase 5:** Margin system (buying power, requirements)
6. **Phase 6:** Execution mode routing (intraday vs daily)
7. **Phase 7:** Performance metrics context (add style, margin, leverage to metrics)
8. **Testing:** All test scenarios
9. **Verification:** End-to-end flow works

---

## 🎉 POST-IMPLEMENTATION STATE

**User Experience:**
1. User creates "Scalping" model in UI
2. Selects: Market+Limit orders, no shorting
3. Writes custom instructions: "Focus on high volume tech stocks"
4. Saves model
5. Starts trading run
6. AI receives FULL context in prompt
7. AI makes decisions following custom strategy
8. System validates trades against config
9. Only valid trades execute
10. User sees clean, controlled trading

**Current Experience:**
1. User creates model in UI
2. Configures everything
3. Starts trading run
4. AI has NO IDEA about configuration
5. Trades execute without validation
6. Configuration is cosmetic only
7. ❌ System doesn't work as intended

---

**This plan transforms the system from "configuration UI that does nothing" to "full integration with enforcement".**

**Ready to implement? Or want to refine the plan further?**

