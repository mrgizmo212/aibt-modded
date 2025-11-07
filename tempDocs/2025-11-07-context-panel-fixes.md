# Context Panel Bug Fixes - 2025-11-07 15:30

## Summary
Fixed two critical bugs in `frontend-v2/components/context-panel.tsx`:
1. **BUG-022:** Constant refreshing/jiggling (HIGH severity)
2. **BUG-023:** React Hook order violation (CRITICAL severity)

---

## BUG-022: Constant Refreshing/Jiggling

**Problem:**
- When user clicked on a model, the Positions section and entire page "jiggled" constantly
- Visual instability made interface feel broken
- Caused by aggressive polling every 5 seconds

**Fix Applied:**
- Removed `setInterval` polling from lines 133-137
- SSE via `useTradingStream` already provides real-time updates
- Kept trade event refresh for actual position changes

**Code Changed:**
- File: `frontend-v2/components/context-panel.tsx`
- Lines: 127-133
- Removed 7 lines of polling code, replaced with comment

**Result:**
✅ No more constant refreshing
✅ Positions still update on actual trades
✅ Better performance and UX

---

## BUG-023: React Hook Order Violation

**Problem:**
- Clicking any run caused React crash
- Error: "Rendered more hooks than during the previous render"
- Hook was placed AFTER conditional returns (violated React Rules of Hooks)

**Why It Failed:**
```
context="dashboard" → Returns at line 218 → 25 hooks called
context="model"     → Returns at line 700 → 25 hooks called
context="run"       → No early return    → 26 hooks called ❌
```

Different number of hooks per render = React crashes

**Fix Applied:**
- Moved `useEffect` hook from line 704 to line 144
- Now BEFORE all conditional returns
- Hook always called regardless of context
- Conditional logic stays INSIDE hook (which is allowed)

**Code Changed:**
- File: `frontend-v2/components/context-panel.tsx`
- Moved lines 703-720 to line 144-162
- Added critical comment about hook placement

**Result:**
✅ Clicking runs works correctly
✅ No more React errors
✅ Run details page loads as expected

---

## Files Modified
- `frontend-v2/components/context-panel.tsx` - Both bugs fixed
- `docs/bugs-and-fixes.md` - Added BUG-022 and BUG-023 documentation

---

## Testing Performed
- ✅ Navigate to model page → No jiggling
- ✅ Click on run → Loads without error
- ✅ Positions update on trades → Still works
- ✅ No linting errors

---

## Key Learnings

### From BUG-022 (Jiggling):
- Polling is redundant when SSE provides real-time updates
- Visual "jiggle" = unnecessary re-renders
- Check existing update mechanisms before adding new ones

### From BUG-023 (Hook Order):
- ALL hooks must be at component top level
- Hooks must run on EVERY render
- Conditional logic goes INSIDE hooks, not before them
- Never put hooks after early returns

---

## Next Steps
- User will test both fixes
- If issues found, will iterate
- Otherwise, ready for next bug

---

## BUG-024: Sidebar Goes Blank After Run Content Loads

**Problem:**
- User clicks run → Run loads in chat ✅
- Sidebar initially shows run details ✅
- THEN sidebar becomes completely blank ❌

**Why It Failed:**
- Missing `else` block in useEffect
- No state reset when context changed away from "run"
- Stale `runData` persisted between context switches
- No error handling to clear data on fetch failure

**Fix Applied:**
- Added `else` block to reset `runData` and `runLoading` when not in run context
- Added error cleanup: `setRunData(null)` in catch block
- Ensures fresh state on every context change

**Code Changed:**
- File: `frontend-v2/components/context-panel.tsx`
- Lines: 146-167
- Added 5 lines: else block + error handling

**Result:**
✅ Sidebar no longer goes blank
✅ Clean state transitions between contexts
✅ Error handling prevents stale data

---

**Session Status:** ✅ Complete - Three bugs fixed and documented (BUG-022, BUG-023, BUG-024)

