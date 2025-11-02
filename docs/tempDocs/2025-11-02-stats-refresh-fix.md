# Stats Auto-Refresh Implementation

**Date:** 2025-11-02 09:30  
**Status:** ✅ COMPLETE

---

## 🐛 ISSUE REPORTED

User reported that dashboard stats (Total Models, Runs Today, Combined P/L, Total Capital) were **not updating** after trading runs completed.

**Symptoms:**
- Stats showed "$0.024" P/L and "-0.0%" which were incorrect
- Stats remained static even after runs finished executing trades

---

## 🔍 ROOT CAUSES IDENTIFIED

### **Issue #1: No Auto-Refresh Mechanism**
**Location:** `frontend-v2/components/embedded/stats-grid.tsx`

**Problem:** Stats only loaded on initial mount, with no mechanism to refresh when trading activity occurred.

**Fix:**
- Added SSE connection to monitor running models
- Connected `useTradingStream` hook to detect trade/complete events
- Implemented auto-refresh on important events (trade, complete, session_complete)
- Added 1.5s delay for backend to finish updating before refresh

```typescript
// Connect to SSE for any running model to get real-time updates
useEffect(() => {
  getTradingStatus().then(statuses => {
    if (statuses.length > 0) {
      setRunningModelId(statuses[0].model_id)
    }
  })
}, [])

// Listen to SSE events and refresh stats on trades/completions
const { events } = useTradingStream(runningModelId, { 
  enabled: !!runningModelId,
  onEvent: (event) => {
    // Auto-refresh stats when important events occur
    if (event.type === 'trade' || event.type === 'complete' || event.type === 'session_complete') {
      console.log('[StatsGrid] Detected event:', event.type, '- refreshing stats')
      setTimeout(() => loadStats(), 1500) // Small delay for backend to update
    }
  }
})
```

### **Issue #2: Incorrect P/L Calculation**
**Location:** `frontend-v2/lib/api.ts` - `getPortfolioStats()` function

**Problem:** The function was summing **cumulative_return percentages** instead of calculating P/L in **dollar amounts**.

**Before (WRONG):**
```typescript
totalPL += performance?.metrics?.cumulative_return || 0  // Adding percentages!
```

**After (CORRECT):**
```typescript
const finalValue = performance?.metrics?.final_value || 0
const initialValue = performance?.metrics?.initial_value || model.initial_cash || 0

totalValue += finalValue
totalInitialValue += initialValue
// Calculate P/L in dollars, not percentage
totalPL += (finalValue - initialValue)
```

---

## ✅ CHANGES MADE

### **File 1:** `frontend-v2/components/embedded/stats-grid.tsx`

**Lines Changed:** 24-45 (21 lines added)

**What Changed:**
1. Added `runningModelId` state to track first running model
2. Added `useEffect` to fetch running model on mount
3. Connected `useTradingStream` hook with event handler
4. Auto-refresh triggered on trade/complete/session_complete events
5. Added console logging for debugging

### **File 2:** `frontend-v2/lib/api.ts`

**Lines Changed:** 234-255 (4 lines modified, 2 lines added)

**What Changed:**
1. Added `totalInitialValue` accumulator
2. Extracted `finalValue` and `initialValue` from performance data
3. Fixed P/L calculation to use `(finalValue - initialValue)` instead of summing percentages
4. Added fallback to `model.initial_cash` if `initial_value` not in performance metrics

---

## 🎯 EXPECTED BEHAVIOR AFTER FIX

### **When Trading Runs:**
1. SSE events stream from backend showing trades
2. StatsGrid detects 'trade' events via SSE
3. After each trade (with 1.5s delay), stats auto-refresh
4. User sees updated P/L, portfolio value in real-time

### **When Run Completes:**
1. Backend emits 'complete' or 'session_complete' event
2. StatsGrid detects completion event
3. Final stats refresh occurs
4. Dashboard shows accurate final numbers

### **P/L Calculation:**
- Now shows actual dollar amounts (e.g., "-$239.54")
- Percentage is calculated from total dollars: `(totalPL / totalInitialValue) * 100`
- Correct aggregation across multiple models

---

## 🧪 TESTING CHECKLIST

- [ ] Start intraday trading session
- [ ] Observe stats auto-update when trades execute
- [ ] Verify P/L shows correct dollar amounts
- [ ] Check that Total Capital updates with each trade
- [ ] Confirm stats refresh when session completes
- [ ] Test with multiple models running simultaneously
- [ ] Verify percentage calculation matches dollar P/L

---

## 📊 FILES MODIFIED

```
frontend-v2/
├── components/
│   └── embedded/
│       └── stats-grid.tsx          ✅ UPDATED (+21 lines)
└── lib/
    └── api.ts                      ✅ UPDATED (6 lines changed)
```

---

## 🔗 RELATED COMPONENTS

**These components also use SSE and may benefit from similar patterns:**
- `frontend-v2/components/context-panel.tsx` - Already has SSE refresh for positions
- `frontend-v2/components/embedded/model-cards-grid.tsx` - Could add SSE refresh for model stats
- `frontend-v2/components/navigation-sidebar.tsx` - Could add SSE refresh for model status

---

## 💡 LESSONS LEARNED

1. **Always verify unit consistency** - Percentages vs. dollars, shares vs. amounts
2. **SSE is perfect for real-time stats** - No polling needed
3. **Small delays matter** - Backend needs time to persist changes before frontend refetches
4. **Aggregate calculations need care** - Summing percentages ≠ total percentage

---

## 🚀 NEXT STEPS

1. User tests the fix with live trading
2. Monitor console logs for "[StatsGrid] Detected event" messages
3. Verify P/L shows realistic numbers (not tiny decimals)
4. Consider adding SSE refresh to other dashboard components

---

**✅ FIX COMPLETE - Ready for Testing**

