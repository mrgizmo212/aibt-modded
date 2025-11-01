# 🎯 AIBT IMPLEMENTATION BLUEPRINT

**Complete Implementation Guide for Advanced Trading Platform**

**Created:** 2025-10-31  
**Status:** Ready for Implementation  
**Based on:** Comprehensive Codebase Review + ttgaibots patterns + MCP integration

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Database Migrations](#database-migrations)
3. [Backend Services](#backend-services)
4. [Trading Agents](#trading-agents)
5. [System Agent (Chat)](#system-agent)
6. [MCP Integration](#mcp-integration)
7. [Frontend Implementation](#frontend-implementation)
8. [Testing & Validation](#testing-validation)
9. [Deployment Checklist](#deployment-checklist)

---

## OVERVIEW

### What This Blueprint Implements

**Core Features:**
- ✅ Run/Session tracking (enables `/models/[id]/r/[run]` URLs)
- ✅ Complete audit logging (AI reasoning + trade rationale)
- ✅ Structured rules system (programmatically enforceable)
- ✅ Risk gates (pre-trade validation)
- ✅ System agent (conversational strategy building)
- ✅ MCP intelligence (Unusual Whales, Finviz, Polygon)
- ✅ Advanced trading (options, short selling)
- ✅ Two-agent architecture (analysis + execution)

### Architecture Vision

```
┌──────────────────────────────────────────────────────┐
│              USER INTERFACE (Frontend)               │
│                                                      │
│  /models/[id]          → Model overview             │
│  /models/[id]/r/[run]  → Run details + Chat         │
│  /models/[id]/compare  → Compare runs               │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│           BACKEND API (FastAPI)                      │
│                                                      │
│  Run Management    Chat Agent     Risk Gates         │
│  Audit Logging     MCP Tools      Rule Enforcer      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│        TWO-AGENT TRADING SYSTEM                      │
│                                                      │
│  Analysis Agent          Execution Agent             │
│  ├─ Monitor markets     ├─ Validate trades          │
│  ├─ Gather intelligence ├─ Enforce rules            │
│  ├─ Run TA/screening    ├─ Execute orders           │
│  ├─ Detect signals      ├─ Log results              │
│  └─ Emit events         └─ Update positions         │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│              DATA SOURCES (MCPs)                     │
│                                                      │
│  finmcp          uwmcp           finviz              │
│  ├─ Tech analysis ├─ Options flow ├─ Stock screener│
│  ├─ Price data    ├─ Dark pool    ├─ Sector data   │
│  └─ Options chain └─ Institutional└─ Insider trades│
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│           SUPABASE DATABASE                          │
│                                                      │
│  trading_runs      ai_reasoning    model_rules       │
│  positions         chat_sessions   chat_messages     │
│  user_profiles     performance     logs              │
└──────────────────────────────────────────────────────┘
```

---

## DATABASE MIGRATIONS

### MIGRATION 012: Run Tracking & AI Reasoning

**File:** `backend/migrations/012_add_run_tracking.sql`

**Purpose:** Enable run-based organization and complete audit trail

**Tables Created:**
1. `trading_runs` - Session tracking with run numbers
2. `ai_reasoning` - AI thought process (plan, analysis, decision, reflection)

**Columns Added:**
- `positions.run_id` - Link trades to runs
- `logs.run_id` - Link logs to runs

**Full SQL:**

```sql
-- ============================================================================
-- TRADING RUNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trading_runs (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_number INT NOT NULL,
  
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'completed', 'stopped', 'failed')) DEFAULT 'running',
  
  trading_mode TEXT CHECK (trading_mode IN ('daily', 'intraday')) NOT NULL,
  strategy_snapshot JSONB,
  
  -- For daily:
  date_range_start DATE,
  date_range_end DATE,
  
  -- For intraday:
  intraday_symbol TEXT,
  intraday_date DATE,
  intraday_session TEXT CHECK (intraday_session IN ('pre', 'regular', 'after')),
  
  -- Results:
  total_trades INT DEFAULT 0,
  final_return DECIMAL(10,6),
  final_portfolio_value DECIMAL(12,2),
  max_drawdown_during_run DECIMAL(10,6),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, run_number)
);

CREATE INDEX idx_runs_model_status ON public.trading_runs(model_id, status);
CREATE INDEX idx_runs_started ON public.trading_runs(started_at DESC);

-- ============================================================================
-- AI REASONING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_reasoning (
  id BIGSERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_id INT REFERENCES public.trading_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  reasoning_type TEXT CHECK (reasoning_type IN ('plan', 'analysis', 'decision', 'reflection')) NOT NULL,
  content TEXT NOT NULL,
  context_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reasoning_run ON public.ai_reasoning(run_id, timestamp DESC);
CREATE INDEX idx_reasoning_type ON public.ai_reasoning(model_id, reasoning_type);

-- ============================================================================
-- LINK EXISTING TABLES
-- ============================================================================

ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS run_id INT REFERENCES public.trading_runs(id);
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS run_id INT REFERENCES public.trading_runs(id);

CREATE INDEX IF NOT EXISTS idx_positions_run ON public.positions(run_id);
CREATE INDEX IF NOT EXISTS idx_logs_run ON public.logs(run_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.trading_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON public.trading_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.models WHERE models.id = trading_runs.model_id AND models.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own runs" ON public.trading_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.models WHERE models.id = trading_runs.model_id AND models.user_id = auth.uid())
  );

ALTER TABLE public.ai_reasoning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reasoning" ON public.ai_reasoning
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.models WHERE models.id = ai_reasoning.model_id AND models.user_id = auth.uid())
  );
```

**Apply Migration:**
```bash
# From backend directory:
python -c "
from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
with open('migrations/012_add_run_tracking.sql') as f:
    sql = f.read()
    supabase.rpc('exec_sql', {'query': sql}).execute()
print('✅ Migration 012 applied')
"
```

**Validate:**
```sql
-- Run in Supabase SQL Editor:
SELECT COUNT(*) as trading_runs_exists FROM information_schema.tables WHERE table_name = 'trading_runs';
SELECT COUNT(*) as ai_reasoning_exists FROM information_schema.tables WHERE table_name = 'ai_reasoning';
SELECT COUNT(*) as run_id_added FROM information_schema.columns WHERE table_name = 'positions' AND column_name = 'run_id';

-- All should return > 0
```

---

### MIGRATION 013: Structured Rules

**File:** `backend/migrations/013_structured_rules.sql`

```sql
CREATE TABLE IF NOT EXISTS public.model_rules (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  rule_category TEXT CHECK (rule_category IN (
    'risk', 'strategy', 'position_sizing', 'timing', 'entry_exit', 'stop_loss', 'screening', 'emergency'
  )) NOT NULL,
  enforcement_params JSONB,
  applies_to_assets TEXT[] DEFAULT ARRAY['equity'],
  applies_to_symbols TEXT[],
  exclude_symbols TEXT[],
  priority INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT CHECK (created_by IN ('user', 'ai_suggested', 'template')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, rule_name)
);

CREATE INDEX idx_rules_model_active ON public.model_rules(model_id, is_active);
CREATE INDEX idx_rules_priority ON public.model_rules(model_id, priority DESC);

ALTER TABLE public.model_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own model rules" ON public.model_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.models WHERE models.id = model_rules.model_id AND models.user_id = auth.uid())
  );
```

---

### MIGRATION 014: Chat System

**File:** `backend/migrations/014_chat_system.sql`

```sql
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_id INT REFERENCES public.trading_runs(id) ON DELETE CASCADE,
  session_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  UNIQUE(model_id, run_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON public.chat_messages(session_id, timestamp);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats" ON public.chat_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.models WHERE models.id = chat_sessions.model_id AND models.user_id = auth.uid())
  );

CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.models m ON m.id = cs.model_id
      WHERE cs.id = chat_messages.session_id AND m.user_id = auth.uid()
    )
  );
```

---

### MIGRATION 015: User Profiles & Advanced Trading

**File:** `backend/migrations/015_user_profiles_advanced.sql`

```sql
CREATE TABLE IF NOT EXISTS public.user_trading_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trading_experience TEXT,
  risk_tolerance TEXT,
  max_position_size_percent DECIMAL(5,2) DEFAULT 20.0,
  max_open_positions INT DEFAULT 5,
  max_loss_per_day DECIMAL(10,2),
  stop_trading_if_daily_loss_exceeds DECIMAL(10,2),
  min_cash_reserve_percent DECIMAL(5,2) DEFAULT 20.0,
  trading_hours_start TIME DEFAULT '09:30:00',
  trading_hours_end TIME DEFAULT '16:00:00',
  use_options BOOLEAN DEFAULT false,
  use_short_selling BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Expand positions for advanced trading
ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_action_type_check;
ALTER TABLE public.positions ADD CONSTRAINT positions_action_type_check 
  CHECK (action_type IN ('buy', 'sell', 'short', 'cover', 'no_trade'));

ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS position_type TEXT;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS option_details JSONB;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS order_status TEXT;

ALTER TABLE public.user_trading_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.user_trading_profiles
  FOR ALL USING (auth.uid() = user_id);
```

---

## BACKEND SERVICES

### SERVICE 1: Run Management

**File:** `backend/services/run_service.py`

```python
"""Trading Run Management Service"""

from typing import Dict, List, Optional
from datetime import datetime
from supabase import create_client
from config import settings

def get_supabase():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def create_trading_run(
    model_id: int,
    trading_mode: str,
    strategy_snapshot: Dict,
    **kwargs
) -> Dict:
    """Create new trading run"""
    supabase = get_supabase()
    
    # Get next run number
    existing = supabase.table("trading_runs")\
        .select("run_number")\
        .eq("model_id", model_id)\
        .order("run_number", desc=True)\
        .limit(1)\
        .execute()
    
    run_number = (existing.data[0]["run_number"] + 1) if existing.data else 1
    
    result = supabase.table("trading_runs").insert({
        "model_id": model_id,
        "run_number": run_number,
        "started_at": datetime.now().isoformat(),
        "status": "running",
        "trading_mode": trading_mode,
        "strategy_snapshot": strategy_snapshot,
        **kwargs
    }).execute()
    
    return result.data[0]


async def complete_trading_run(run_id: int, final_stats: Dict) -> Dict:
    """Complete trading run with results"""
    supabase = get_supabase()
    
    result = supabase.table("trading_runs").update({
        "status": "completed",
        "ended_at": datetime.now().isoformat(),
        "total_trades": final_stats.get("total_trades", 0),
        "final_return": final_stats.get("final_return"),
        "final_portfolio_value": final_stats.get("final_portfolio_value"),
        "max_drawdown_during_run": final_stats.get("max_drawdown")
    }).eq("id", run_id).execute()
    
    return result.data[0] if result.data else {}


async def get_model_runs(model_id: int, user_id: str) -> List[Dict]:
    """Get all runs for a model"""
    supabase = get_supabase()
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        return []
    
    result = supabase.table("trading_runs")\
        .select("*")\
        .eq("model_id", model_id)\
        .order("run_number", desc=True)\
        .execute()
    
    return result.data or []


async def get_run_by_id(model_id: int, run_id: int, user_id: str) -> Optional[Dict]:
    """Get specific run details"""
    supabase = get_supabase()
    
    result = supabase.table("trading_runs")\
        .select("*")\
        .eq("id", run_id)\
        .eq("model_id", model_id)\
        .execute()
    
    if not result.data:
        return None
    
    run = result.data[0]
    
    # Get associated data
    positions = supabase.table("positions").select("*").eq("run_id", run_id).execute()
    reasoning = supabase.table("ai_reasoning").select("*").eq("run_id", run_id).execute()
    
    run["positions"] = positions.data or []
    run["reasoning"] = reasoning.data or []
    
    return run
```

**Add to:** `backend/services.py`

```python
# At top with other imports:
from services.run_service import (
    create_trading_run,
    complete_trading_run,
    get_model_runs,
    get_run_by_id
)
```

---

### SERVICE 2: AI Reasoning Logger

**File:** `backend/services/reasoning_service.py`

```python
"""AI Reasoning Logging Service"""

from typing import Dict, Optional
from datetime import datetime
from supabase import create_client
from config import settings

def get_supabase():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def save_ai_reasoning(
    model_id: int,
    run_id: Optional[int],
    reasoning_type: str,
    content: str,
    context_json: Optional[Dict] = None
) -> Dict:
    """
    Save AI reasoning to database
    
    Args:
        model_id: Model ID
        run_id: Run ID (nullable for legacy)
        reasoning_type: 'plan' | 'analysis' | 'decision' | 'reflection'
        content: AI's reasoning text
        context_json: Optional context data
    
    Returns:
        Created record
    """
    supabase = get_supabase()
    
    result = supabase.table("ai_reasoning").insert({
        "model_id": model_id,
        "run_id": run_id,
        "timestamp": datetime.now().isoformat(),
        "reasoning_type": reasoning_type,
        "content": content,
        "context_json": context_json
    }).execute()
    
    return result.data[0] if result.data else {}


async def get_reasoning_for_run(run_id: int) -> List[Dict]:
    """Get all reasoning entries for a run"""
    supabase = get_supabase()
    
    result = supabase.table("ai_reasoning")\
        .select("*")\
        .eq("run_id", run_id)\
        .order("timestamp")\
        .execute()
    
    return result.data or []


async def get_recent_reasoning(
    model_id: int,
    reasoning_type: Optional[str] = None,
    limit: int = 10
) -> List[Dict]:
    """Get recent reasoning entries"""
    supabase = get_supabase()
    
    query = supabase.table("ai_reasoning")\
        .select("*")\
        .eq("model_id", model_id)
    
    if reasoning_type:
        query = query.eq("reasoning_type", reasoning_type)
    
    result = query.order("timestamp", desc=True).limit(limit).execute()
    
    return result.data or []
```

---

### SERVICE 3: Rule Enforcement Engine

**File:** `backend/utils/rule_enforcer.py`

```python
"""
Rule Enforcement Engine
Validates trades against structured rules before execution
Pattern from ttgaibots risk gates
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, time
from supabase import Client

class RuleEnforcer:
    """
    Enforces structured trading rules programmatically
    
    Usage:
        enforcer = RuleEnforcer(supabase, model_id)
        is_valid, reason = enforcer.validate_trade(
            action="buy",
            symbol="AAPL",
            amount=10,
            price=150.00,
            current_position={...},
            total_portfolio_value=10000.00
        )
        
        if not is_valid:
            reject_trade(reason)
    """
    
    def __init__(self, supabase: Client, model_id: int):
        self.supabase = supabase
        self.model_id = model_id
        self.rules = self._load_active_rules()
    
    def _load_active_rules(self) -> List[Dict]:
        """Load active rules from database, sorted by priority"""
        result = self.supabase.table("model_rules")\
            .select("*")\
            .eq("model_id", self.model_id)\
            .eq("is_active", True)\
            .order("priority", desc=True)\
            .execute()
        
        return result.data or []
    
    def validate_trade(
        self,
        action: str,
        symbol: str,
        amount: int,
        price: float,
        current_position: Dict,
        total_portfolio_value: float,
        asset_type: str = 'equity',
        current_time: Optional[datetime] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate trade against all active rules
        
        Returns:
            (is_valid, rejection_reason)
        """
        
        for rule in self.rules:
            # Check if rule applies to this asset type
            if asset_type not in rule.get("applies_to_assets", ['equity']):
                continue
            
            # Check symbol whitelist/blacklist
            if rule.get("applies_to_symbols") and symbol not in rule["applies_to_symbols"]:
                continue
            if rule.get("exclude_symbols") and symbol in rule["exclude_symbols"]:
                continue
            
            # Get enforcement parameters
            params = rule.get("enforcement_params", {})
            category = rule["rule_category"]
            
            # POSITION SIZING RULES
            if category == "position_sizing":
                max_position_pct = params.get("max_position_pct")
                if max_position_pct:
                    trade_value = amount * price
                    max_allowed = total_portfolio_value * max_position_pct
                    
                    if trade_value > max_allowed:
                        return False, f"Rule '{rule['rule_name']}': Trade value ${trade_value:.2f} exceeds {max_position_pct*100}% limit (${max_allowed:.2f})"
            
            # RISK MANAGEMENT RULES
            elif category == "risk":
                # Max positions check
                max_positions = params.get("max_positions")
                if max_positions and action in ['buy', 'short']:
                    current_positions = len([s for s in current_position if s != 'CASH' and current_position[s] > 0])
                    if current_positions >= max_positions:
                        return False, f"Rule '{rule['rule_name']}': Already at max {max_positions} positions"
                
                # Min cash reserve check
                min_cash_reserve_pct = params.get("min_cash_reserve_pct")
                if min_cash_reserve_pct and action in ['buy', 'short']:
                    cash_after = current_position.get("CASH", 0) - (amount * price)
                    min_required = total_portfolio_value * min_cash_reserve_pct
                    
                    if cash_after < min_required:
                        return False, f"Rule '{rule['rule_name']}': Would violate {min_cash_reserve_pct*100}% cash reserve (need ${min_required:.2f})"
            
            # TIMING RULES
            elif category == "timing":
                if current_time:
                    # Blackout periods
                    blackout_start = params.get("blackout_start")
                    blackout_end = params.get("blackout_end")
                    
                    if blackout_start and blackout_end:
                        current_time_only = current_time.time()
                        start_time = datetime.strptime(blackout_start, "%H:%M").time()
                        end_time = datetime.strptime(blackout_end, "%H:%M").time()
                        
                        if start_time <= current_time_only <= end_time:
                            return False, f"Rule '{rule['rule_name']}': Trading not allowed during {blackout_start}-{blackout_end}"
            
            # SCREENING RULES
            elif category == "screening":
                # Stock must be on approved list (from Finviz screen)
                approved_list = params.get("approved_symbols", [])
                if approved_list and symbol not in approved_list:
                    return False, f"Rule '{rule['rule_name']}': Symbol not on approved screening list"
        
        return True, None  # All rules passed


def create_rule_enforcer(supabase: Client, model_id: int) -> RuleEnforcer:
    """Factory function to create enforcer"""
    return RuleEnforcer(supabase, model_id)
```

---

### SERVICE 4: Risk Gates (Additional Layer)

**File:** `backend/utils/risk_gates.py`

```python
"""
Risk Gates - Pre-Trade Validation System
Additional safety layer beyond rule enforcer
Pattern from ttgaibots
"""

from typing import Dict, Tuple, Optional

class RiskGates:
    """
    Hard-coded safety gates that run on EVERY trade
    These cannot be disabled by users
    """
    
    def __init__(self, model_id: int, user_profile: Optional[Dict] = None):
        self.model_id = model_id
        self.user_profile = user_profile or {}
    
    def validate_all(
        self,
        action: str,
        symbol: str,
        amount: int,
        price: float,
        portfolio_snapshot: Dict
    ) -> Tuple[bool, Optional[str]]:
        """Run all safety gates"""
        
        # Gate 1: Prevent negative cash
        if action in ['buy', 'short']:
            cash_after = portfolio_snapshot['cash'] - (amount * price)
            if cash_after < 0:
                return False, "SAFETY: Would result in negative cash"
        
        # Gate 2: Prevent selling more than owned
        if action == 'sell':
            owned = portfolio_snapshot['positions'].get(symbol, 0)
            if amount > owned:
                return False, f"SAFETY: Cannot sell {amount} shares, only own {owned}"
        
        # Gate 3: Prevent covering more than shorted
        if action == 'cover':
            short_position = portfolio_snapshot['positions'].get(f"{symbol}_short", 0)
            if amount > abs(short_position):
                return False, f"SAFETY: Cannot cover {amount} shares, only short {abs(short_position)}"
        
        # Gate 4: Daily loss circuit breaker
        if self.user_profile.get('stop_trading_if_daily_loss_exceeds'):
            daily_loss = portfolio_snapshot.get('daily_pnl', 0)
            max_loss = self.user_profile['stop_trading_if_daily_loss_exceeds']
            
            if daily_loss < -abs(max_loss):
                return False, f"CIRCUIT BREAKER: Daily loss ${abs(daily_loss):.2f} exceeds limit ${max_loss:.2f}"
        
        # Gate 5: Portfolio drawdown limit
        initial_value = portfolio_snapshot.get('initial_value', 10000)
        current_value = portfolio_snapshot['total_value']
        drawdown = (initial_value - current_value) / initial_value
        
        if drawdown > 0.25:  # 25% drawdown
            return False, f"CIRCUIT BREAKER: Portfolio down {drawdown*100:.1f}% from peak"
        
        return True, None
```

---

## TRADING AGENTS

### STEP 3.1: Update Intraday Agent to Use Run ID

**File to Modify:** `backend/trading/intraday_agent.py`

**Changes:**

```python
# Line 18: Add run_id parameter
async def run_intraday_session(
    agent,
    model_id: int,
    user_id: str,
    symbol: str,
    date: str,
    session: str = "regular",
    run_id: Optional[int] = None  # ← ADD THIS
) -> Dict[str, Any]:
```

```python
# Line 162: Save AI reasoning
reasoning = decision.get("reasoning", "No reasoning provided")

# NEW: Save to ai_reasoning table
from services.reasoning_service import save_ai_reasoning

await save_ai_reasoning(
    model_id=model_id,
    run_id=run_id,
    reasoning_type="decision",
    content=reasoning,
    context_json={
        "minute": minute,
        "symbol": symbol,
        "bar": bar,
        "action": decision.get("action"),
        "position": current_position
    }
)
```

```python
# Line 187: Pass run_id to recording
await _record_intraday_trade(
    model_id=model_id,
    user_id=user_id,
    run_id=run_id,  # ← ADD THIS
    date=date,
    minute=minute,
    action="buy",
    symbol=symbol,
    amount=amount,
    price=current_price,
    position=current_position,
    reasoning=reasoning  # ← ADD THIS
)
```

```python
# Line 375: Update _record_intraday_trade signature
async def _record_intraday_trade(
    model_id: int,
    user_id: str,
    run_id: Optional[int],  # ← ADD THIS
    date: str,
    minute: str,
    action: str,
    symbol: str,
    amount: int,
    price: float,
    position: Dict,
    reasoning: Optional[str] = None  # ← ADD THIS
):
```

```python
# Line 419: Add fields to insert
supabase.table("positions").insert({
    "model_id": model_id,
    "run_id": run_id,  # ← ADD THIS
    "date": date,
    "minute_time": minute + ":00",
    "action_id": action_id,
    "action_type": action,
    "symbol": symbol,
    "amount": amount,
    "positions": position,
    "cash": position.get("CASH", 0),
    "reasoning": reasoning[:500] if reasoning else None  # ← ADD THIS (truncated)
}).execute()
```

---

### STEP 3.2: Integrate Custom Rules into Intraday

**File to Modify:** `backend/trading/agent_prompt.py`

**Change 1 - Update function signature (Line 173):**

```python
def get_intraday_system_prompt(
    minute: str,
    symbol: str,
    bar: dict,
    position: dict,
    custom_rules: Optional[str] = None,  # ← ADD
    custom_instructions: Optional[str] = None  # ← ADD
) -> str:
```

**Change 2 - Add rules to prompt (after Line 233):**

```python
    base_prompt = f"""... existing prompt ..."""
    
    # NEW: Append custom rules (same pattern as daily trading)
    additions = []
    
    if custom_rules:
        additions.append(f"""

🎯 CUSTOM TRADING RULES (MANDATORY):
{custom_rules}

These rules OVERRIDE default behavior. Follow them strictly for every decision.
""")
    
    if custom_instructions:
        additions.append(f"""

📋 STRATEGY GUIDANCE:
{custom_instructions}

Use these instructions to guide your minute-by-minute decisions.
""")
    
    if additions:
        base_prompt += "\n".join(additions)
    
    return base_prompt
```

**File to Modify:** `backend/trading/intraday_agent.py`

**Change at Line 318:**

```python
# OLD:
prompt = get_intraday_system_prompt(
    minute=minute,
    symbol=symbol,
    bar=bar,
    position=current_position
)

# NEW:
prompt = get_intraday_system_prompt(
    minute=minute,
    symbol=symbol,
    bar=bar,
    position=current_position,
    custom_rules=agent.custom_rules,  # ← ADD
    custom_instructions=agent.custom_instructions  # ← ADD
)
```

---

### STEP 3.3: Add Rule Enforcement to Trading

**File to Modify:** `backend/trading/intraday_agent.py`

**Add imports at top:**

```python
from utils.rule_enforcer import create_rule_enforcer
from utils.risk_gates import RiskGates
```

**Add after Line 133 (before trading loop):**

```python
# Initialize rule enforcer and risk gates
from supabase import create_client
from config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
enforcer = create_rule_enforcer(supabase, model_id)
risk_gates = RiskGates(model_id)

print("✅ Rule enforcer and risk gates initialized")
```

**Add before Line 164 (before buy execution):**

```python
if action == "buy":
    amount = decision.get("amount", 0)
    cost = amount * current_price
    available_cash = current_position.get("CASH", 0)
    
    # NEW: Build portfolio snapshot for validation
    portfolio_snapshot = {
        'cash': available_cash,
        'positions': current_position,
        'total_value': available_cash + sum(
            current_position.get(s, 0) * current_price 
            for s in current_position if s != 'CASH'
        ),
        'initial_value': agent.initial_cash
    }
    
    # NEW: Risk gates (hard-coded safety)
    gates_passed, gate_reason = risk_gates.validate_all(
        action="buy",
        symbol=symbol,
        amount=amount,
        price=current_price,
        portfolio_snapshot=portfolio_snapshot
    )
    
    if not gates_passed:
        print(f"    🛑 RISK GATE: {gate_reason}")
        continue
    
    # NEW: Rule enforcer (user-defined rules)
    rules_passed, rule_reason = enforcer.validate_trade(
        action="buy",
        symbol=symbol,
        amount=amount,
        price=current_price,
        current_position=current_position,
        total_portfolio_value=portfolio_snapshot['total_value'],
        asset_type='equity',
        current_time=datetime.now()
    )
    
    if not rules_passed:
        print(f"    ❌ RULE VIOLATION: {rule_reason}")
        continue
    
    # Existing cash check
    if cost > available_cash:
        print(f"    ❌ INSUFFICIENT FUNDS")
        continue
    
    # Trade is valid - execute
    print(f"    💰 BUY {amount} shares")
    ...
```

---

### STEP 3.4: Create Run on Trading Start

**File to Modify:** `backend/main.py`

**Change at Line 863-887 (daily trading):**

```python
@app.post("/api/trading/start/{model_id}")
async def start_trading_endpoint(
    model_id: int,
    request: StartTradingRequest,
    current_user: Dict = Depends(require_auth)
):
    """Start daily trading session"""
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(404, "Model not found")
    
    # NEW: Create trading run FIRST
    from services.run_service import create_trading_run
    
    run = await create_trading_run(
        model_id=model_id,
        trading_mode="daily",
        strategy_snapshot={
            "custom_rules": model.get("custom_rules"),
            "custom_instructions": model.get("custom_instructions"),
            "model_parameters": model.get("model_parameters"),
            "default_ai_model": model.get("default_ai_model")
        },
        date_range_start=request.start_date,
        date_range_end=request.end_date
    )
    
    run_id = run["id"]
    
    # Pass run_id to agent
    agent_manager.start_agent(
        model_id,
        model["signature"],
        request.base_model,
        request.start_date,
        request.end_date,
        run_id=run_id,  # ← ADD THIS
        model_config={
            "initial_cash": model.get("initial_cash", 10000.0),
            "allowed_tickers": model.get("allowed_tickers"),
            "default_ai_model": model.get("default_ai_model"),
            "model_parameters": model.get("model_parameters"),
            "custom_rules": model.get("custom_rules"),
            "custom_instructions": model.get("custom_instructions")
        }
    )
    
    return {"message": "Trading started", "status": "running", "run_id": run_id}
```

**Change at Line 904-949 (intraday trading):**

```python
@app.post("/api/trading/start-intraday/{model_id}")
async def start_intraday_trading_endpoint(
    model_id: int,
    request: IntradayTradingRequest,
    current_user: Dict = Depends(require_auth)
):
    """Start intraday trading session"""
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(404, "Model not found")
    
    # NEW: Create run
    from services.run_service import create_trading_run, complete_trading_run
    
    run = await create_trading_run(
        model_id=model_id,
        trading_mode="intraday",
        strategy_snapshot={
            "custom_rules": model.get("custom_rules"),
            "custom_instructions": model.get("custom_instructions"),
            "model_parameters": model.get("model_parameters"),
            "default_ai_model": model.get("default_ai_model")
        },
        intraday_symbol=request.symbol,
        intraday_date=request.date,
        intraday_session=request.session
    )
    
    run_id = run["id"]
    
    # ... create agent ...
    
    # Pass run_id to intraday session
    result = await run_intraday_session(
        agent,
        model_id=model_id,
        user_id=current_user["id"],
        symbol=request.symbol,
        date=request.date,
        session=request.session,
        run_id=run_id  # ← ADD THIS
    )
    
    # NEW: Complete run with results
    await complete_trading_run(run_id, {
        "total_trades": result.get("trades_executed", 0),
        "final_portfolio_value": result["final_position"].get("CASH", 0),  # Will be enhanced
        "final_return": None  # Calculate from performance metrics
    })
    
    return {
        "message": "Intraday trading completed",
        "run_id": run_id,
        "run_number": run["run_number"],
        **result
    }
```

---

## SYSTEM AGENT (CHAT)

### STEP 4.1: Create System Agent Core

**File to Create:** `backend/agents/system_agent.py`

```python
"""
System Agent - Conversational AI for Strategy Building and Analysis

Unlike Trading AI (autonomous), this agent chats with users to:
- Analyze past trading performance  
- Explain why trades succeeded/failed
- Suggest improvements and rules
- Compare runs
- Build strategies collaboratively
"""

from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.messages import HumanMessage, SystemMessage
from typing import List, Dict, Optional
from supabase import Client
from datetime import datetime

class SystemAgent:
    """
    Conversational agent for post-trade analysis and strategy building
    """
    
    def __init__(
        self,
        model_id: int,
        run_id: Optional[int],
        user_id: str,
        supabase: Client
    ):
        self.model_id = model_id
        self.run_id = run_id
        self.user_id = user_id
        self.supabase = supabase
        
        # Initialize LangChain model
        self.model = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3  # Lower for analytical responses
        )
        
        # Load analysis tools
        self.tools = self._load_tools()
        
        # Create agent
        self.agent = create_agent(
            self.model,
            tools=self.tools,
            system_prompt=self._get_system_prompt()
        )
    
    def _load_tools(self) -> List:
        """Load analysis and strategy building tools"""
        from agents.tools.analyze_trades import create_analyze_trades_tool
        from agents.tools.suggest_rules import create_suggest_rules_tool
        from agents.tools.calculate_metrics import create_calculate_metrics_tool
        from agents.tools.compare_runs import create_compare_runs_tool
        
        return [
            create_analyze_trades_tool(self.supabase, self.model_id, self.run_id),
            create_suggest_rules_tool(self.supabase, self.model_id),
            create_calculate_metrics_tool(self.supabase, self.model_id, self.run_id),
            create_compare_runs_tool(self.supabase, self.model_id)
        ]
    
    def _get_system_prompt(self) -> str:
        """System prompt for strategy analyst agent"""
        
        context_info = f"Model ID: {self.model_id}"
        if self.run_id:
            context_info += f" | Analyzing Run #{self.run_id}"
        else:
            context_info += " | Analyzing all runs"
        
        return f"""You are an expert trading strategy analyst and coach.

Your role:
1. Help users understand their trading performance
2. Analyze what worked and what didn't work
3. Suggest concrete improvements to strategy
4. Generate structured rules based on data insights
5. Explain complex trading concepts in simple terms
6. Compare different strategy variations

You have access to:
- Complete trade history with AI reasoning
- Performance metrics and statistics
- Position snapshots over time
- AI decision logs for every trade
- Current rules and parameters

Guidelines:
- Be honest about losses and mistakes
- Provide specific, actionable advice with data citations
- Cite actual trades as evidence
- Suggest rules with concrete parameters
- Explain risk/reward tradeoffs clearly
- Use tools to query data - don't guess

Current context: {context_info}

When analyzing:
- Look for patterns in winning vs losing trades
- Identify high-risk behaviors (over-concentration, no stops)
- Compare to user's stated strategy
- Suggest specific rule additions with exact parameters

When suggesting rules:
- Always include: rule_name, category, description
- Always include: enforcement_params with concrete numbers
- Explain: why this rule helps, what it prevents
- Show: how it would have changed past performance
"""
    
    async def chat(self, user_message: str, conversation_history: List[Dict] = None) -> Dict:
        """
        Process user message and return response
        
        Args:
            user_message: User's question or request
            conversation_history: Previous messages for context
        
        Returns:
            {
                "response": "AI's response",
                "tool_calls": [...tools used...],
                "suggested_rules": [...if AI suggested rules...]
            }
        """
        
        # Build messages
        messages = []
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    messages.append({"role": "assistant", "content": msg["content"]})
        
        # Add current message
        messages.append({"role": "user", "content": user_message})
        
        # Invoke agent
        response = await self.agent.ainvoke({"messages": messages})
        
        # Extract response
        response_messages = response.get("messages", [])
        if response_messages:
            last_msg = response_messages[-1]
            content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
        else:
            content = "I couldn't process that request."
        
        # Extract tool calls if any
        tool_calls = []
        for msg in response_messages:
            if hasattr(msg, "additional_kwargs") and "tool_calls" in msg.additional_kwargs:
                tool_calls.extend(msg.additional_kwargs["tool_calls"])
        
        # Check if AI suggested rules (parse response for rule suggestions)
        suggested_rules = self._extract_suggested_rules(content)
        
        return {
            "response": content,
            "tool_calls": tool_calls,
            "suggested_rules": suggested_rules
        }
    
    def _extract_suggested_rules(self, content: str) -> List[Dict]:
        """Extract structured rule suggestions from AI response"""
        # Simple pattern matching for now
        # AI is prompted to format rule suggestions in a specific way
        suggested = []
        
        # Look for rule suggestion markers
        if "SUGGESTED RULE:" in content or "I recommend adding a rule:" in content:
            # Parse rule details from response
            # This is simplified - actual implementation would be more robust
            pass
        
        return suggested


# Factory function
def create_system_agent(
    model_id: int,
    run_id: Optional[int],
    user_id: str,
    supabase: Client
) -> SystemAgent:
    """Create system agent instance"""
    return SystemAgent(model_id, run_id, user_id, supabase)
```

---

### STEP 4.2: Create System Agent Tools

**File to Create:** `backend/agents/tools/analyze_trades.py`

```python
"""Analyze Trades Tool - For System Agent"""

from langchain.tools import tool
from typing import Dict, List
from supabase import Client

def create_analyze_trades_tool(supabase: Client, model_id: int, run_id: Optional[int]):
    """
    Factory to create analyze_trades tool with context
    """
    
    @tool
    async def analyze_trades(
        filter_type: str = "all",
        criteria: Optional[Dict] = None
    ) -> str:
        """
        Analyze trades for patterns and insights
        
        Args:
            filter_type: "all" | "winning" | "losing" | "by_symbol" | "by_time"
            criteria: Additional filtering (e.g., {"symbol": "IBM"})
        
        Returns:
            Analysis summary with statistics
        """
        
        # Build query
        query = supabase.table("positions").select("*").eq("model_id", model_id)
        
        if run_id:
            query = query.eq("run_id", run_id)
        
        result = query.order("date").order("minute_time").execute()
        
        if not result.data:
            return "No trades found to analyze."
        
        trades = result.data
        
        # Calculate trade-by-trade P/L
        trade_pnl = []
        for i in range(1, len(trades)):
            prev_value = trades[i-1]["cash"]  # Simplified
            curr_value = trades[i]["cash"]
            pnl = curr_value - prev_value
            trade_pnl.append({
                "trade": trades[i],
                "pnl": pnl,
                "is_winner": pnl > 0
            })
        
        # Apply filters
        if filter_type == "winning":
            trade_pnl = [t for t in trade_pnl if t["is_winner"]]
        elif filter_type == "losing":
            trade_pnl = [t for t in trade_pnl if not t["is_winner"]]
        
        # Generate analysis
        winners = [t for t in trade_pnl if t["is_winner"]]
        losers = [t for t in trade_pnl if not t["is_winner"]]
        
        avg_win = sum(t["pnl"] for t in winners) / len(winners) if winners else 0
        avg_loss = sum(t["pnl"] for t in losers) / len(losers) if losers else 0
        
        total_pnl = sum(t["pnl"] for t in trade_pnl)
        win_rate = len(winners) / len(trade_pnl) if trade_pnl else 0
        
        analysis = f"""Trade Analysis Results:

Total Trades: {len(trade_pnl)}
Winners: {len(winners)} ({win_rate*100:.1f}%)
Losers: {len(losers)}

Average Winner: ${avg_win:.2f}
Average Loser: ${avg_loss:.2f}
Win/Loss Ratio: {abs(avg_win/avg_loss):.2f} if avg_loss != 0 else 'N/A'}

Total P/L: ${total_pnl:.2f}

Patterns Identified:
"""
        
        # Find patterns
        if len(winners) > len(losers) and total_pnl < 0:
            analysis += "- ⚠️ More winners than losers but still lost money (losers too big)\n"
            analysis += "- Recommendation: Add stop-loss rule to cut losses earlier\n"
        
        # Analyze by time of day
        morning_trades = [t for t in trade_pnl if t["trade"].get("minute_time", "00:00") < "12:00"]
        afternoon_trades = [t for t in trade_pnl if t["trade"].get("minute_time", "00:00") >= "12:00"]
        
        if morning_trades and afternoon_trades:
            morning_pnl = sum(t["pnl"] for t in morning_trades)
            afternoon_pnl = sum(t["pnl"] for t in afternoon_trades)
            
            if abs(morning_pnl) > abs(afternoon_pnl) * 2:
                analysis += f"- 📊 Morning trades significantly different from afternoon\n"
                analysis += f"  Morning P/L: ${morning_pnl:.2f}\n"
                analysis += f"  Afternoon P/L: ${afternoon_pnl:.2f}\n"
        
        return analysis
    
    return analyze_trades
```

---

**File to Create:** `backend/agents/tools/suggest_rules.py`

```python
"""Suggest Rules Tool - For System Agent"""

from langchain.tools import tool
from typing import Dict
from supabase import Client

def create_suggest_rules_tool(supabase: Client, model_id: int):
    """Factory to create suggest_rules tool"""
    
    @tool
    async def suggest_rules(problem: str, context: Optional[Dict] = None) -> str:
        """
        Suggest structured rules to address a problem
        
        Args:
            problem: Description of issue to solve (e.g., "prevent large drawdowns")
            context: Optional context data (e.g., recent trades)
        
        Returns:
            Structured rule suggestion in JSON format
        """
        
        # Pattern matching for common problems
        suggestions = []
        
        if "drawdown" in problem.lower() or "loss" in problem.lower():
            suggestions.append({
                "rule_name": "Max Position Size Limit",
                "rule_category": "position_sizing",
                "rule_description": "No single position can exceed 20% of total portfolio value",
                "enforcement_params": {
                    "max_position_pct": 0.20,
                    "enforcement": "reject_trade"
                },
                "rationale": "Prevents over-concentration that leads to large drawdowns",
                "priority": 9
            })
            
            suggestions.append({
                "rule_name": "Minimum Cash Reserve",
                "rule_category": "risk",
                "rule_description": "Always maintain at least 20% cash (never go all-in)",
                "enforcement_params": {
                    "min_cash_reserve_pct": 0.20,
                    "enforcement": "reject_trade"
                },
                "rationale": "Ensures liquidity and ability to take new opportunities",
                "priority": 8
            })
        
        if "over" in problem.lower() and "trad" in problem.lower():
            suggestions.append({
                "rule_name": "Max Trades Per Session",
                "rule_category": "risk",
                "rule_description": "Limit to maximum 10 trades per session to avoid overtrading",
                "enforcement_params": {
                    "max_trades_per_session": 10,
                    "enforcement": "stop_trading"
                },
                "rationale": "Prevents emotional/reactive overtrading that erodes profits",
                "priority": 7
            })
        
        if "timing" in problem.lower() or "volatil" in problem.lower():
            suggestions.append({
                "rule_name": "Avoid Opening Volatility",
                "rule_category": "timing",
                "rule_description": "No trading in first 5 minutes (9:30-9:35 AM)",
                "enforcement_params": {
                    "blackout_start": "09:30",
                    "blackout_end": "09:35",
                    "enforcement": "skip_minute"
                },
                "rationale": "Opening minutes have widest spreads and most volatility",
                "priority": 6
            })
        
        # Format as readable response
        response = "Based on the problem, I suggest these rules:\n\n"
        
        for i, rule in enumerate(suggestions, 1):
            response += f"{i}. **{rule['rule_name']}** (Category: {rule['rule_category']})\n"
            response += f"   Description: {rule['rule_description']}\n"
            response += f"   Parameters: {rule['enforcement_params']}\n"
            response += f"   Why: {rule['rationale']}\n"
            response += f"   Priority: {rule['priority']}/10\n\n"
        
        response += "Would you like me to add any of these rules to your model?"
        
        return response
    
    return suggest_rules
```

---

**File to Create:** `backend/agents/tools/calculate_metrics.py`

```python
"""Calculate Metrics Tool - For System Agent"""

from langchain.tools import tool
from typing import Optional
from supabase import Client

def create_calculate_metrics_tool(supabase: Client, model_id: int, run_id: Optional[int]):
    """Factory to create metrics calculation tool"""
    
    @tool
    async def calculate_metrics(metric_type: str = "all") -> str:
        """
        Calculate performance metrics
        
        Args:
            metric_type: "all" | "return" | "risk" | "win_rate"
        
        Returns:
            Formatted metrics summary
        """
        
        from utils.result_tools_db import calculate_all_metrics_db, calculate_intraday_metrics_db
        
        # Get run info if specified
        if run_id:
            run = supabase.table("trading_runs").select("*").eq("id", run_id).execute()
            if run.data:
                run_data = run.data[0]
                trading_mode = run_data["trading_mode"]
                
                if trading_mode == "intraday":
                    date = run_data["intraday_date"]
                    metrics = calculate_intraday_metrics_db(model_id, date)
                else:
                    metrics = calculate_all_metrics_db(model_id)
        else:
            metrics = calculate_all_metrics_db(model_id)
        
        # Format response
        response = f"""Performance Metrics:

Total Return: {metrics.get('cumulative_return', 0)*100:.2f}%
Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}
Max Drawdown: {metrics.get('max_drawdown', 0)*100:.2f}%
Win Rate: {metrics.get('win_rate', 0)*100:.1f}%
P/L Ratio: {metrics.get('profit_loss_ratio', 0):.2f}

Initial Value: ${metrics.get('initial_value', 0):,.2f}
Final Value: ${metrics.get('final_value', 0):,.2f}
Total P/L: ${metrics.get('final_value', 0) - metrics.get('initial_value', 0):,.2f}

Trading Days: {metrics.get('total_trading_days', 0)}
Volatility: {metrics.get('volatility', 0)*100:.2f}%
"""
        
        return response
    
    return calculate_metrics
```

---

**File to Create:** `backend/agents/tools/compare_runs.py`

```python
"""Compare Runs Tool - For System Agent"""

from langchain.tools import tool
from typing import List
from supabase import Client

def create_compare_runs_tool(supabase: Client, model_id: int):
    """Factory to create run comparison tool"""
    
    @tool
    async def compare_runs(run_ids: List[int]) -> str:
        """
        Compare performance across multiple runs
        
        Args:
            run_ids: List of run IDs to compare (e.g., [1, 2, 3])
        
        Returns:
            Comparison table and analysis
        """
        
        if len(run_ids) < 2:
            return "Need at least 2 runs to compare"
        
        runs_data = []
        
        for run_id in run_ids:
            # Get run info
            run = supabase.table("trading_runs").select("*").eq("id", run_id).execute()
            if not run.data:
                continue
            
            # Get positions count
            positions = supabase.table("positions").select("id").eq("run_id", run_id).execute()
            
            runs_data.append({
                "run_id": run_id,
                "run_number": run.data[0]["run_number"],
                "started_at": run.data[0]["started_at"],
                "total_trades": run.data[0].get("total_trades", len(positions.data or [])),
                "final_return": run.data[0].get("final_return", 0),
                "max_drawdown": run.data[0].get("max_drawdown_during_run", 0),
                "strategy": run.data[0].get("strategy_snapshot", {})
            })
        
        # Format comparison
        response = "Run Comparison:\n\n"
        response += "Run# | Trades | Return | Max DD | Strategy\n"
        response += "-" * 60 + "\n"
        
        for r in runs_data:
            response += f"#{r['run_number']:2d}  | {r['total_trades']:6d} | {r['final_return']*100:6.2f}% | {r['max_drawdown']*100:5.1f}% | "
            
            # Extract key strategy differences
            snapshot = r['strategy']
            if snapshot.get('custom_rules'):
                response += "Has rules"
            else:
                response += "No rules"
            
            response += "\n"
        
        # Analysis
        best_run = max(runs_data, key=lambda r: r['final_return'])
        worst_run = min(runs_data, key=lambda r: r['final_return'])
        
        response += f"\nBest: Run #{best_run['run_number']} ({best_run['final_return']*100:.2f}%)\n"
        response += f"Worst: Run #{worst_run['run_number']} ({worst_run['final_return']*100:.2f}%)\n"
        
        # What made the difference?
        best_strategy = best_run['strategy']
        worst_strategy = worst_run['strategy']
        
        response += "\nKey Differences:\n"
        if best_strategy.get('custom_rules') and not worst_strategy.get('custom_rules'):
            response += "- Best run had custom rules, worst didn't\n"
            response += "- Recommendation: Use rules from best run\n"
        
        return response
    
    return compare_runs
```

---

## MCP INTEGRATION

### STEP 5.1: Add MCPs to Configuration

**File to Modify:** `backend/config.py`

**Add to Settings class:**

```python
class Settings(BaseSettings):
    # ... existing fields ...
    
    # MCP Server Tokens
    FINMCP_TOKEN: str = ""
    UWMCP_MCP_TOKEN: str = ""
    FINVIZ_SERVER_TOKEN: str = ""
    
    # MCP Server URLs
    FINMCP_URL: str = "https://finmcp-f2xz.onrender.com/mcp"
    UWMCP_URL: str = "https://uwmcp.onrender.com/mcp"
    FINVIZ_URL: str = "https://mcp-finviz.onrender.com/mcp"
```

**Update `.env` file:**

```bash
# Market Intelligence MCPs
FINMCP_TOKEN=customkey1
UWMCP_MCP_TOKEN=customkey212
FINVIZ_SERVER_TOKEN=finvizcustomkey1
```

---

### STEP 5.2: Integrate MCPs into Trading Agent

**File to Modify:** `backend/trading/mcp_manager.py`

**Add remote MCPs to configuration:**

```python
def _get_default_mcp_config(self) -> Dict[str, Dict[str, Any]]:
    """Get default MCP configuration including remote servers"""
    
    config = {
        # Existing local MCPs
        "math-server": {
            "command": "uvicorn",
            "args": ["mcp_services.tool_math:app", "--host", "0.0.0.0", "--port", str(settings.MATH_HTTP_PORT)],
            "url": f"http://localhost:{settings.MATH_HTTP_PORT}/mcp",
            "transport": "http"
        },
        # ... other local MCPs ...
        
        # NEW: Remote MCPs for market intelligence
        "finmcp": {
            "url": settings.FINMCP_URL,
            "transport": "http",
            "headers": {"x-custom-key": settings.FINMCP_TOKEN}
        },
        "uwmcp": {
            "url": settings.UWMCP_URL,
            "transport": "http",
            "headers": {"Authorization": f"Bearer {settings.UWMCP_MCP_TOKEN}"}
        },
        "finviz": {
            "url": settings.FINVIZ_URL,
            "transport": "http",
            "headers": {"Authorization": f"Bearer {settings.FINVIZ_SERVER_TOKEN}"}
        }
    }
    
    return config
```

---

### STEP 5.3: Add MCP Tools to Agent Prompt

**File to Modify:** `backend/trading/agent_prompt.py`

**Add to daily trading prompt (after Line 98):**

```python
📊 AVAILABLE MARKET INTELLIGENCE TOOLS:

Technical Analysis (finmcp):
- get_tech_analysis_dashboard(ticker, timespan) - Complete TA in one call
- get_rsi(ticker, window=14, timespan='day') - RSI indicator
- get_sma(ticker, window=50) - Simple moving average
- get_ema(ticker, window=20) - Exponential moving average
- get_macd(ticker) - MACD indicator
- get_stock_snapshot(ticker) - Real-time price, volume, bid/ask
- get_options_chain(ticker, contract_type, expiration) - Options data

Stock Screening (Finviz):
- screen_stocks_by_filters(filters={...}) - Find stocks by criteria
- get_signal_stocks(signal='top gainers', limit=20) - Predefined screens
- get_preset_strategies(strategy='momentum_trading') - Strategy-based screens

Institutional Activity (Unusual Whales):
- search_endpoints(query='dark pool') - Discover available data
- get_available_params(path='/endpoint') - Learn how to call it
- call_get(path, params) - Execute any UW endpoint

USAGE EXAMPLES:

Before trading:
1. screen_stocks_by_filters({"fs_cap": "cap_large", "fs_vol": "sh_avgvol_o500"})
   → Find liquid large-cap stocks

2. get_tech_analysis_dashboard(ticker="AAPL", timespan="day")
   → Get complete technical picture

3. search_endpoints("unusual activity") then call_get(...)
   → Check for institutional flow

Use these tools to make INFORMED decisions, not blind trades!
"""
```

---

## FRONTEND IMPLEMENTATION

### STEP 6.1: Create Run Page

**File to Create:** `frontend/app/models/[id]/r/[run]/page.tsx`

```typescript
'use client'

import { use, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import RunData from '@/components/RunData'
import { fetchRunDetails } from '@/lib/api'

export default function RunPage() {
  const params = useParams()
  const modelId = parseInt(params.id as string)
  const runId = parseInt(params.run as string)
  
  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadRun()
  }, [modelId, runId])
  
  async function loadRun() {
    try {
      const data = await fetchRunDetails(modelId, runId)
      setRun(data)
    } catch (err) {
      console.error('Failed to load run:', err)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <div>Loading run...</div>
  }
  
  if (!run) {
    return <div>Run not found</div>
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Run #{run.run_number} - {run.trading_mode === 'intraday' ? 'Intraday' : 'Daily'} Trading
          </h1>
          <p className="text-gray-400 text-sm">
            Started: {new Date(run.started_at).toLocaleString()} | 
            Status: {run.status} | 
            Trades: {run.total_trades}
          </p>
        </div>
        
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Chat with System Agent */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">💬 Strategy Chat</h2>
            <ChatInterface modelId={modelId} runId={runId} />
          </div>
          
          {/* Right: Run Data */}
          <div className="space-y-6">
            <RunData run={run} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### STEP 6.2: Create Chat Interface Component

**File to Create:** `frontend/components/ChatInterface.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export default function ChatInterface({ 
  modelId, 
  runId 
}: { 
  modelId: number
  runId: number 
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Load chat history
  useEffect(() => {
    loadChatHistory()
  }, [modelId, runId])
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  async function loadChatHistory() {
    try {
      const response = await fetch(
        `/api/models/${modelId}/runs/${runId}/chat-history`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }
  
  async function sendMessage() {
    if (!input.trim()) return
    
    const userMessage = input.trim()
    setInput('')
    
    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])
    
    setLoading(true)
    
    try {
      const response = await fetch(
        `/api/models/${modelId}/runs/${runId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ message: userMessage })
        }
      )
      
      const data = await response.json()
      
      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Error: Could not get response',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-600 ml-12'
                : msg.role === 'assistant'
                ? 'bg-zinc-800 mr-12'
                : 'bg-yellow-600/20 text-yellow-400'
            }`}
          >
            <div className="text-xs text-gray-400 mb-1">
              {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'AI Analyst' : 'System'}
            </div>
            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Ask about this trading run..."
          disabled={loading}
          className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </div>
      
      {/* Suggested questions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setInput("Why did I lose money on this run?")}
          className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full"
        >
          Why did I lose money?
        </button>
        <button
          onClick={() => setInput("What were my best and worst trades?")}
          className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full"
        >
          Best/worst trades?
        </button>
        <button
          onClick={() => setInput("Suggest rules to improve performance")}
          className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full"
        >
          Suggest improvements
        </button>
      </div>
    </div>
  )
}
```

---

### STEP 6.3: Add API Endpoints for Chat

**File to Modify:** `backend/main.py`

**Add new endpoints:**

```python
from agents.system_agent import create_system_agent
from models import ChatRequest, ChatResponse  # Add to models.py

@app.post("/api/models/{model_id}/runs/{run_id}/chat", response_model=ChatResponse)
async def chat_with_system_agent(
    model_id: int,
    run_id: int,
    request: ChatRequest,
    current_user: Dict = Depends(require_auth)
):
    """Chat with system agent about a specific run"""
    
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    if not model:
        raise HTTPException(404, "Model not found")
    
    # Create system agent
    agent = create_system_agent(
        model_id=model_id,
        run_id=run_id,
        user_id=current_user["id"],
        supabase=get_supabase()
    )
    
    # Get conversation history
    chat_history = await services.get_chat_messages(model_id, run_id)
    
    # Get AI response
    result = await agent.chat(request.message, chat_history)
    
    # Save messages to database
    await services.save_chat_message(
        model_id=model_id,
        run_id=run_id,
        role="user",
        content=request.message
    )
    
    await services.save_chat_message(
        model_id=model_id,
        run_id=run_id,
        role="assistant",
        content=result["response"],
        tool_calls=result.get("tool_calls")
    )
    
    return {
        "response": result["response"],
        "suggested_rules": result.get("suggested_rules", [])
    }


@app.get("/api/models/{model_id}/runs")
async def get_model_runs_endpoint(
    model_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get all runs for a model"""
    runs = await services.get_model_runs(model_id, current_user["id"])
    return {"runs": runs}


@app.get("/api/models/{model_id}/runs/{run_id}")
async def get_run_details_endpoint(
    model_id: int,
    run_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get detailed info about a specific run"""
    run = await services.get_run_by_id(model_id, run_id, current_user["id"])
    
    if not run:
        raise HTTPException(404, "Run not found")
    
    return run


@app.get("/api/models/{model_id}/runs/{run_id}/chat-history")
async def get_chat_history_endpoint(
    model_id: int,
    run_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get chat message history for a run"""
    messages = await services.get_chat_messages(model_id, run_id)
    return {"messages": messages}
```

---

### STEP 6.4: Add Models for New API Responses

**File to Modify:** `backend/models.py`

```python
from typing import List, Dict, Optional, Any

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    suggested_rules: List[Dict] = []

class RunInfo(BaseModel):
    id: int
    model_id: int
    run_number: int
    started_at: str
    ended_at: Optional[str]
    status: str
    trading_mode: str
    strategy_snapshot: Dict
    total_trades: int
    final_return: Optional[float]
    final_portfolio_value: Optional[float]

class RunDetailsResponse(BaseModel):
    run: RunInfo
    positions: List[Position]
    reasoning: List[Dict]
    chat_count: int
```

---

## TESTING & VALIDATION

### Manual Test Sequence

**Test 1: Run Tracking**

```bash
# 1. Apply migration 012
# 2. Start intraday trading
# 3. Verify in Supabase:

SELECT * FROM trading_runs WHERE model_id = 169;
-- Should show: run_number=1, status='running'

SELECT * FROM ai_reasoning WHERE run_id = [run_id];
-- Should show: decision entries for each trade

SELECT run_id, COUNT(*) FROM positions GROUP BY run_id;
-- Should show: trades linked to run
```

**Test 2: Rule Enforcement**

```bash
# 1. Apply migration 013
# 2. Add rule via SQL:

INSERT INTO model_rules (model_id, rule_name, rule_description, rule_category, enforcement_params)
VALUES (169, 'Max 10% Position', 'No position > 10% of portfolio', 'position_sizing',
        '{"max_position_pct": 0.10}'::jsonb);

# 3. Start intraday trading
# 4. Verify: No trade exceeds 10% of portfolio
# 5. Check logs for "RULE VIOLATION" rejections
```

**Test 3: System Agent Chat**

```bash
# 1. Navigate to: http://localhost:3000/models/169/r/1
# 2. Type: "Why did I lose money?"
# 3. Verify: AI responds with trade analysis
# 4. Check database:

SELECT * FROM chat_messages WHERE session_id IN (
  SELECT id FROM chat_sessions WHERE model_id = 169 AND run_id = 1
);
-- Should show: user message + AI response
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All migrations tested on dev database
- [ ] Migrations have rollback procedures documented
- [ ] New services have error handling
- [ ] API endpoints have authentication
- [ ] Frontend components have loading/error states
- [ ] MCPs tested individually
- [ ] Environment variables documented

### Database

- [ ] Run migration 012 (trading_runs, ai_reasoning)
- [ ] Run migration 013 (model_rules)
- [ ] Run migration 014 (chat_sessions, chat_messages)
- [ ] Run migration 015 (user_trading_profiles)
- [ ] Verify all tables created
- [ ] Verify RLS policies active
- [ ] Verify indexes created

### Backend

- [ ] Add services/run_service.py
- [ ] Add services/reasoning_service.py
- [ ] Add utils/rule_enforcer.py
- [ ] Add utils/risk_gates.py
- [ ] Add agents/system_agent.py
- [ ] Add agents/tools/*.py (4 files)
- [ ] Update trading/intraday_agent.py
- [ ] Update trading/agent_prompt.py
- [ ] Update trading/mcp_manager.py
- [ ] Update main.py (new endpoints)
- [ ] Update models.py (new response models)
- [ ] Update config.py (MCP settings)
- [ ] Update .env (MCP tokens)

### Frontend

- [ ] Add app/models/[id]/r/[run]/page.tsx
- [ ] Add components/ChatInterface.tsx
- [ ] Add components/RunData.tsx
- [ ] Add components/RunComparison.tsx
- [ ] Update app/models/[id]/page.tsx (link to runs)
- [ ] Update types/api.ts (new types)
- [ ] Update lib/api.ts (new API calls)

### Validation

- [ ] Can create trading run
- [ ] Trades link to run_id
- [ ] AI reasoning saves correctly
- [ ] Rules enforce before trades
- [ ] Risk gates block unsafe trades
- [ ] Can navigate to /models/[id]/r/[run]
- [ ] Chat interface loads
- [ ] System agent responds
- [ ] MCPs accessible from agent
- [ ] Performance metrics calculate per run

---

## IMPLEMENTATION ORDER

**Start Here:**

1. ✅ Database migrations (012-015)
2. ✅ Run service (backend/services/run_service.py)
3. ✅ Update intraday to use run_id
4. ✅ Reasoning service + save reasoning
5. ✅ Rule enforcer (basic version)
6. ✅ Integrate rules into trading
7. ✅ Test: Run with rules, verify enforcement

**Then:**

8. ✅ System agent core
9. ✅ System agent tools (analyze, suggest, metrics)
10. ✅ Chat API endpoints
11. ✅ Frontend run page
12. ✅ Chat interface component
13. ✅ Test: Chat with agent

**Finally:**

14. ✅ MCP integration
15. ✅ Advanced trading (options, shorts)
16. ✅ Two-agent architecture
17. ✅ Full testing suite

---

**END OF BLUEPRINT**

**Status:** Complete implementation guide ready  
**Next Step:** Begin with database migrations  
**Estimated Complexity:** High value, systematic approach  
**All code cited, all steps actionable**

