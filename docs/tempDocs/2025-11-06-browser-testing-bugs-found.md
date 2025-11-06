# Browser Testing - Model Conversation Bugs

**Date:** 2025-11-06 18:30  
**Test URL:** https://ttgaibtfront.onrender.com/m/184/c/84  
**Model:** "Gay" (Model ID: 184)  
**Test:** Send message "how many runs has this model run?"  
**Duration:** 20 seconds observation

---

## 🐛 BUG #1: AI Doesn't Know About Runs in Model Conversations ⚠️ CRITICAL

### **Evidence:**

**Screenshot:** `20-BUG1-AI-doesnt-know-runs.png`

**User asks:** "how many runs has this model run?"

**AI responds:**
> "Please select a specific run or provide access to the run data so I can check how many runs MODEL 184: "Gay" has completed."

**The Problem:**
- ✅ Run #1 is VISIBLE in UI (right panel shows "All Runs: 1 total")
- ✅ Frontend fetched run data: `{runs: Array(1), total: 1}`
- ❌ AI doesn't know about it - asks user to provide access
- ❌ AI should simply say "This model has completed 1 run"

### **Root Cause:**

**Location:** `backend/main.py` - `/api/chat/general-stream` endpoint

When `model_id=184` is provided (model conversation):
1. ✅ Loads model configuration and injects into context
2. ❌ Does NOT load list of runs for the model
3. ❌ AI has no awareness of runs even though they exist

**What AI KNOWS:**
```
✅ Model name: "Gay"
✅ Trading style, AI model, permissions
✅ Custom rules/instructions
❌ How many runs exist
❌ Run performance summaries
❌ Run IDs
```

**What AI SHOULD KNOW:**
```
✅ Model has 1 run (Run #1)
✅ Run #1: Intraday IBM, 8 trades, -0.34% return
✅ Run is completed
```

### **Expected Behavior:**

User: "how many runs has this model run?"  
AI: "This model has completed 1 run: Run #1, which was an intraday run on IBM with 8 trades and a -0.34% return."

### **Actual Behavior:**

AI: "Please select a specific run or provide access to the run data..."

### **Impact:**

**Severity:** HIGH  
**User Experience:** Confusing - user can SEE the run in the UI but AI claims it can't access it  
**Frequency:** 100% - happens on every model conversation

### **Affected Files:**
- `backend/main.py` - `/api/chat/general-stream` endpoint (needs run summary loading)
- OR `backend/agents/system_agent.py` - `_get_system_prompt()` (if using SystemAgent)

---

## 🐛 BUG #2: Duplicate SSE Connections ⚠️ MEDIUM

### **Evidence:**

**Console logs show:**
```
[LOG] [SSE Hook] Calling connectToStream for model: 184
[LOG] [SSE] Connected to trading stream for model 184
[LOG] [SSE] Connected to trading stream for model 184  ← DUPLICATE!
[LOG] [SSE] Event received: connected undefined
[LOG] [SSE] Event received: connected undefined  ← DUPLICATE!
```

### **The Problem:**
- SSE connection to trading stream established TWICE
- Same "connected" event received twice
- Memory leak - multiple EventSource instances

### **Root Cause:**

**Location:** `frontend-v2/hooks/use-trading-stream.ts` OR component using it

Likely causes:
1. useEffect dependency array causing double execution
2. Component mounted twice (desktop + mobile)
3. Strict Mode in React (dev only)
4. Race condition on model selection

### **Impact:**

**Severity:** MEDIUM (was supposedly fixed on Nov 5th)  
**Memory:** Leaks over time with multiple connections  
**Performance:** Unnecessary network connections

---

## 🐛 BUG #3: First Message Shows Blank AI Response ⚠️ LOW

### **Evidence:**

**Screenshots:** `06-t0-message-sent.png` through `09-t6-streaming-state.png`

**Timeline:**
- T=0s: Message sent, "Streaming..." indicator appears
- T=2s: URL changes to `/m/184/c/84` (conversation created)
- T=2-6s: AI response shows timestamp (01:23 PM) but NO content
- T=6s+: Still showing blank response with just timestamp

**First attempt:** Blank response with timestamp only  
**Second attempt:** Response appeared correctly

### **The Problem:**
- First message in new conversation shows AI avatar + timestamp
- BUT no actual response content displays
- Only on retry does the response appear

### **Possible Causes:**
1. Race condition between URL change and message display
2. State not updating correctly on conversation creation
3. Message saved to DB but not rendered in UI
4. Response streamed but not captured by frontend

### **Impact:**

**Severity:** LOW  
**Frequency:** Intermittent (first message only)  
**Workaround:** Send message again

---

## 🐛 BUG #4: Context Panel Sections Disappear/Reappear ⚠️ LOW

### **Evidence:**

**Screenshots show:**
- Some frames: "All Runs" section fully visible with Run #1 card
- Other frames: "All Runs" heading shown but content loading
- Flickering/disappearing of "Positions" section

**Console shows:**
```
[API] Fetching: /api/models/184/runs (multiple times)
[API] Fetching: /api/models/184/positions (multiple times)
```

### **The Problem:**
- Context panel makes duplicate API calls
- Sections re-render causing visual flicker
- Loading states not coordinated

### **Root Cause:**

**Location:** `frontend-v2/components/context-panel.tsx`

Likely:
- useEffect firing multiple times
- Props changing causing re-fetches
- No caching of API responses

### **Impact:**

**Severity:** LOW  
**Visual:** Minor flicker/loading states  
**Performance:** Duplicate API calls

---

## 🐛 BUG #5: "No conversations yet" Shows Despite Conversation Existing ⚠️ LOW

### **Evidence:**

**All screenshots show:**
- Sidebar "Conversations" section: "No conversations yet"
- BUT we're actively in conversation 84 (`/m/184/c/84`)

### **The Problem:**
- Conversations exist for Model 184
- Sidebar doesn't show them under "Conversations" section
- May be filtering issue (general vs model conversations)

### **Expected:**
- "Conversations" section should show model-specific conversations
- OR have separate section for model conversations

### **Impact:**

**Severity:** LOW  
**User can still access conversations** via URL or model sections

---

## 📊 CONSOLE LOG ANALYSIS

### **Duplicate SSE Connections Found:**
```
Line 31: [SSE Hook] Calling connectToStream for model: 184
Line 32: [SSE] Connected to trading stream for model 184
Line 41: [SSE] Connected to trading stream for model 184  ← DUPLICATE
```

### **Duplicate API Calls Found:**
```
/api/models - Called 6+ times
/api/models/184/logs - Called 4+ times  
/api/models/184/runs - Called 4+ times
/api/models/184/positions - Called 3+ times
/api/trading/status - Called 3+ times
```

**Pattern:** Multiple API calls for same data, likely from:
- Re-renders
- Multiple components fetching same data
- No caching layer

---

## 🎯 PRIORITY RANKING

### **P0 - Critical (Must Fix):**
1. **BUG #1** - AI doesn't know about runs in model conversations

### **P1 - High (Should Fix):**
2. **BUG #2** - Duplicate SSE connections (memory leak)

### **P2 - Medium (Nice to Fix):**
3. **BUG #3** - First message shows blank response
4. **BUG #4** - Context panel flicker/duplicate API calls
5. **BUG #5** - Conversations section doesn't show model conversations

---

## 📸 SCREENSHOT TIMELINE

**Captured 16 screenshots over 20+ seconds:**

1. `01-after-login-dashboard.png` - Dashboard after login
2. `02-gay-model-selected.png` - Model selected, context panel loaded
3. `03-model-conversation-loading.png` - Loading state on `/m/184/new`
4. `04-model-conversation-page-loaded.png` - Page fully loaded
5. `05-message-typed-before-send.png` - Message in input box
6. `06-t0-message-sent.png` - Immediately after send (Streaming indicator)
7. `07-t2-streaming-state.png` - 2s: URL changed to `/m/184/c/84`, blank response
8. `08-t4-streaming-state.png` - 4s: Still blank
9. `09-t6-streaming-state.png` - 6s: Still blank
10. `10-t8-streaming-state.png` - 8s: Still blank
11. `11-t10-streaming-state.png` - 10s: Still blank
12. `12-t12-streaming-state.png` - 12s: Still blank
13. `13-t14-streaming-state.png` - 14s: Still blank
14. `14-t16-streaming-state.png` - 16s: Still blank
15. `18-second-attempt-t5.png` - Second attempt, response appeared!
16. `20-BUG1-AI-doesnt-know-runs.png` - Final state showing BUG #1

---

## 🔍 KEY OBSERVATIONS

### **What Worked:**
✅ Login successful  
✅ Model selection works  
✅ Navigation to `/m/184/new` works  
✅ Message send works  
✅ URL transition `/m/184/new` → `/m/184/c/84` works (ephemeral → persistent)  
✅ Conversation created in database (ID: 84)  
✅ Second message response works  
✅ Context panel shows model info, runs, positions  

### **What's Broken:**
❌ First message response blank (only timestamp)  
❌ AI doesn't know about runs (BUG #1 - CRITICAL)  
❌ Duplicate SSE connections (BUG #2)  
❌ Context panel flickers with duplicate API calls  
❌ Conversations section doesn't show active conversation  

---

## 🎯 RECOMMENDED FIX ORDER

### **Fix #1: Add Run Summary to Model Context (BUG #1)**

**Where:** `backend/main.py` - `/api/chat/general-stream` endpoint

**What to add:** When `model_id` provided, also query runs table:

```python
# After loading model config (around line 2085)
if model_id:
    # Load model config (already done)
    model_config = ...
    
    # NEW: Load run summary
    runs_result = supabase.table("trading_runs")\
        .select("id, run_number, status, trading_mode, total_trades, final_return, intraday_symbol, intraday_date")\
        .eq("model_id", model_id)\
        .order("run_number", desc=True)\
        .limit(10)\
        .execute()
    
    run_summary = ""
    if runs_result.data:
        run_summary = f"\n\n<run_summary>\nThis model has completed {len(runs_result.data)} run(s):\n"
        for run in runs_result.data:
            run_summary += f"- Run #{run['run_number']}: {run['status']}, {run['trading_mode']} mode"
            if run.get('intraday_symbol'):
                run_summary += f" ({run['intraday_symbol']})"
            if run.get('total_trades'):
                run_summary += f", {run['total_trades']} trades"
            if run.get('final_return'):
                run_summary += f", {run['final_return']*100:.2f}% return"
            run_summary += f"\n"
        run_summary += "</run_summary>"
    
    # Add to model_context
    model_context += run_summary
```

### **Fix #2: Prevent Duplicate SSE (BUG #2)**

Already supposedly fixed on Nov 5th - need to verify the fix is working.

---

## 🧪 TEST SCRIPT NEEDED

**File:** `scripts/verify-bug-model-conversation-no-runs.js`

Should test:
1. Navigate to `/m/184/new`
2. Send message: "how many runs has this model run?"
3. Verify AI response includes "1 run" or "Run #1"
4. Verify AI doesn't say "please select a run"

**Success criteria:** AI knows about runs without being told

---

**Testing complete. Ready to present findings to user.**

