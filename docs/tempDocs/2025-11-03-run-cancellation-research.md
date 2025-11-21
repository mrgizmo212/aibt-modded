# 2025-11-03 - Run Cancellation Research

## Task
Research where and how to implement run cancellation feature without breaking anything.

Requirements:
1. User can cancel a run
2. Canceled runs don't count (not saved to database if canceled before complete)
3. Visual confirmation of cancellation status
4. Handle failed runs vs canceled runs vs successful runs

## Database Schema Analysis

### `trading_runs` Table Schema
**Location:** `backend/migrations/012_add_run_tracking.sql` lines 11-47

```sql
CREATE TABLE IF NOT EXISTS public.trading_runs (
  id SERIAL PRIMARY KEY,
  model_id INT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  run_number INT NOT NULL,
  
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT CHECK (status IN ('running', 'completed', 'stopped', 'failed')) DEFAULT 'running',
  
  trading_mode TEXT CHECK (trading_mode IN ('daily', 'intraday')) NOT NULL,
  strategy_snapshot JSONB,
  
  -- Results (updated when run completes):
  total_trades INT DEFAULT 0,
  final_return DECIMAL(10,6),
  final_portfolio_value DECIMAL(12,2),
  max_drawdown_during_run DECIMAL(10,6),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_id, run_number)
);
```

**Key Findings:**
- Status field ALREADY supports: `'running'`, `'completed'`, `'stopped'`, `'failed'`
- `'stopped'` status exists but is NOT currently used in the code
- Database has `ended_at` timestamp field
- Has Row Level Security (RLS) enabled - users can only access their own runs

## Backend Code Analysis

### Run Creation Flow
**Location:** `backend/services/run_service.py` - `create_trading_run()` function (lines 16-63)

- Creates run with status='running' by default
- Generates auto-incrementing run_number per model
- Returns run record with id and run_number

### Run Completion Flow  
**Location:** `backend/services/run_service.py` - `complete_trading_run()` function (lines 66-97)

- Updates status to 'completed'
- Sets ended_at timestamp
- Saves final statistics (total_trades, final_return, etc.)

### Run Failure Flow
**Location:** `backend/services/run_service.py` - `fail_trading_run()` function (lines 100-113)

- Updates status to 'failed'
- Sets ended_at timestamp
- Does NOT save statistics

### Intraday Trading Execution
**Location:** `backend/main.py` - `/api/trading/start-intraday/{model_id}` endpoint (lines 910-1003)

Flow:
1. Creates run record (line 928-940)
2. Runs intraday session (line 968-976)
3. Completes run with statistics (line 979-996)

**Location:** `backend/trading/intraday_agent.py` - `run_intraday_session()` function (lines 24-588)

- This is a LONG synchronous function that processes all minutes
- Runs for 390 minutes (6.5 hours of trading time)
- NO cancellation mechanism currently exists
- Once started, it runs to completion

### Agent Manager
**Location:** `backend/trading/agent_manager.py`

Daily trading has:
- `stop_agent()` method (lines 161-180) - cancels the asyncio task
- Updates status to 'stopped' 
- BUT this is only for daily trading, NOT intraday

**Key Finding:** Intraday trading has NO stop mechanism!

## Frontend Code Analysis

### Trading Start UI
**Location:** `frontend-v2/components/embedded/trading-form.tsx`

- Has start button (line 256-261)
- NO cancel/stop button currently

### Trading Terminal Display
**Location:** `frontend-v2/components/trading-terminal.tsx`

- Shows real-time logs via SSE
- Handles event types: status, progress, trade, complete, error
- NO cancel button or cancellation UI

### API Client
**Location:** `frontend-v2/lib/api.ts`

- `stopTrading(modelId)` function exists (lines 217-220)
- Calls `POST /api/trading/stop/{modelId}`
- BUT this endpoint only works for daily trading (agent_manager)
- NO equivalent for intraday trading

## Critical Gap Identified

### The Problem:
1. **Database has 'stopped' status but nothing uses it**
2. **Intraday trading has NO cancellation mechanism**
   - `run_intraday_session()` is synchronous and runs all 390 minutes
   - No way to interrupt it mid-execution
3. **Daily trading CAN be stopped** via agent_manager
4. **UI has no cancel button** for either mode

### Requirement Conflict:
User wants: "not have that run count meaning if canceled before complete it will not save in the database"

**BUT:** Run is created in database BEFORE trading starts (line 928-940 in main.py)
- This is by design - to track all attempts
- Run gets an auto-incrementing run_number

**Options:**
A. Delete run from database if canceled (breaks run_number sequence)
B. Keep run with status='cancelled' (still counts but marked as cancelled)
C. Add 'cancelled' status to database schema

## Where Changes Would Be Needed

### Option B: Add 'cancelled' Status (Recommended)

#### 1. Database Migration
**File:** Create new migration `016_add_cancelled_status.sql`
```sql
ALTER TABLE public.trading_runs 
  DROP CONSTRAINT IF EXISTS trading_runs_status_check;

ALTER TABLE public.trading_runs 
  ADD CONSTRAINT trading_runs_status_check 
  CHECK (status IN ('running', 'completed', 'stopped', 'failed', 'cancelled'));
```

#### 2. Backend - Add Cancellation Service
**File:** `backend/services/run_service.py`
**Add new function:**
```python
async def cancel_trading_run(run_id: int) -> Dict:
    """
    Mark run as cancelled (user-initiated cancellation)
    Does NOT save final statistics
    """
    supabase = get_supabase()
    
    result = supabase.table("trading_runs").update({
        "status": "cancelled",
        "ended_at": datetime.now().isoformat()
    }).eq("id", run_id).execute()
    
    print(f"⏹️  Cancelled Run ID {run_id}")
    return result.data[0] if result.data else {}
```

#### 3. Backend - Add Cancellation Flag to Intraday Agent
**File:** `backend/trading/intraday_agent.py`

Add global cancellation flag mechanism:
- Add `cancellation_flags: Dict[int, bool] = {}` at module level
- Check flag in minute loop (line 269)
- If cancelled, break loop and return early
- Call `cancel_trading_run()` instead of `complete_trading_run()`

#### 4. Backend - Add Cancel Endpoint
**File:** `backend/main.py`

Add new endpoint:
```python
@app.post("/api/trading/cancel-intraday/{model_id}")
async def cancel_intraday_trading(
    model_id: int, 
    current_user: Dict = Depends(require_auth)
):
    """Cancel running intraday session"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    if not model:
        raise NotFoundError("Model")
    
    # Get active run
    from services.run_service import get_active_run
    run = await get_active_run(model_id)
    
    if not run:
        return {"status": "no_active_run"}
    
    # Set cancellation flag
    from trading.intraday_agent import set_cancellation_flag
    set_cancellation_flag(model_id)
    
    return {"status": "cancellation_requested", "run_id": run["id"]}
```

#### 5. Frontend - Add Cancel Button
**File:** `frontend-v2/components/embedded/trading-form.tsx`

Add cancel button that appears when trading is active:
- Check trading status
- Show "Cancel Trading" button if status == 'running'
- Call new API endpoint
- Show toast notification

#### 6. Frontend - Add Cancel API Function
**File:** `frontend-v2/lib/api.ts`

```typescript
export async function cancelIntradayTrading(modelId: number) {
  return apiFetch(`/api/trading/cancel-intraday/${modelId}`, {
    method: 'POST',
  })
}
```

#### 7. Frontend - Update Terminal to Show Cancellation
**File:** `frontend-v2/components/trading-terminal.tsx`

Add new event type handler:
```typescript
case 'cancelled':
  logEntry = {
    timestamp,
    type: 'warning',
    message: `⏹️  ${event.data?.message || 'Trading cancelled by user'}`,
    icon: <XCircle className="w-3 h-3 text-[#f59e0b]" />
  }
  break
```

## Architecture Map

### Cancellation Flow:

```
USER CLICKS CANCEL
  ↓
frontend: cancelIntradayTrading(modelId)
  ↓
POST /api/trading/cancel-intraday/{modelId}
  ↓
backend: set_cancellation_flag(model_id)
  ↓
intraday_agent: checks flag in loop
  ↓
intraday_agent: breaks loop, returns early
  ↓
main.py: catches early return
  ↓
services.cancel_trading_run(run_id)
  ↓
database: UPDATE status='cancelled', ended_at=NOW()
  ↓
event_stream.emit('cancelled')
  ↓
frontend: shows "Trading Cancelled" notification
```

### Status Display Logic:

Database stores:
- 'running' = Active trading session
- 'completed' = Finished successfully with statistics
- 'failed' = Error occurred, no statistics
- 'cancelled' = User stopped it, no statistics

Frontend shows:
- 🟢 Completed - "Run succeeded, X trades executed"
- 🔴 Failed - "Run failed: [error message]"
- 🟠 Cancelled - "Run cancelled by user"
- 🔵 Running - "Trading in progress..."

## Non-Breaking Implementation Strategy

1. Add migration for 'cancelled' status (backwards compatible - allows new value)
2. Add cancel service function (new code, doesn't modify existing)
3. Add cancellation flag to intraday_agent (check in loop, graceful exit)
4. Add cancel endpoint (new endpoint, doesn't modify existing)
5. Update frontend UI to show cancel button (conditional render)
6. Update terminal to display cancelled events (new case in switch)

**CRITICAL:** Do NOT delete runs from database
- Breaks run_number auto-increment
- Loses audit trail
- Better to mark as 'cancelled' and exclude from statistics

## Files That Need Changes (Summary)

### Backend:
1. Create: `backend/migrations/016_add_cancelled_status.sql`
2. Modify: `backend/services/run_service.py` - add `cancel_trading_run()`
3. Modify: `backend/trading/intraday_agent.py` - add cancellation flag mechanism
4. Modify: `backend/main.py` - add `/api/trading/cancel-intraday/{model_id}` endpoint
5. Update: `backend/models.py` - RunInfo model status type hint

### Frontend:
1. Modify: `frontend-v2/lib/api.ts` - add `cancelIntradayTrading()`
2. Modify: `frontend-v2/components/embedded/trading-form.tsx` - add cancel button UI
3. Modify: `frontend-v2/components/trading-terminal.tsx` - add cancelled event handler
4. Modify: `frontend-v2/lib/types.ts` - update Run status type

## Edge Cases to Handle

1. **Cancel during data loading** - should cancel immediately
2. **Cancel after all trades executed** - too late, mark completed
3. **Multiple cancel requests** - ignore if already cancelling
4. **Cancel after natural completion** - return "already completed"
5. **Network error during cancel** - retry mechanism needed
6. **Cancel daily vs intraday** - need separate endpoints

## Testing Requirements

1. Start intraday trading
2. Click cancel after 50 minutes
3. Verify status becomes 'cancelled'
4. Verify run saved with partial data
5. Verify run_number increments correctly
6. Start new run after cancel - should work
7. Check cancelled runs don't appear in performance calculations

## Next Steps (If Implementing)

1. Create database migration
2. Add backend service function
3. Add cancellation flag to agent
4. Add backend endpoint
5. Add frontend API function
6. Add cancel button to UI
7. Add cancelled status display
8. Test all scenarios
9. Update documentation

## Status: RESEARCH COMPLETE
Ready for implementation when user confirms approach.
