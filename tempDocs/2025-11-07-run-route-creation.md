# Run Route Creation - 2025-11-07 17:30

## BUG-027: Missing Dedicated Run Route and Triple API Calls

**Problem:**
- Clicking run didn't change URL
- Triple API calls to fetch run details
- No shareable run URLs

**Solution:**
Created dedicated route `/m/[modelId]/r/[runId]/page.tsx` and updated all navigation handlers.

---

## What Was Done

### 1. Created New Route
**File:** `frontend-v2/app/m/[modelId]/r/[runId]/page.tsx` (205 lines)

**Purpose:**
- Dedicated page for run analysis
- URL pattern: `/m/186/r/101`
- Context defaults to "run"
- Passes runId to all components

### 2. Updated All handleRunClick Functions

**Changed in 5 files:**
- `app/m/[modelId]/new/page.tsx`
- `app/m/[modelId]/c/[conversationId]/page.tsx`
- `app/c/[conversationId]/page.tsx`
- `app/new/page.tsx`
- `app/page.tsx`

**Old (15 lines):**
```typescript
const handleRunClick = async (modelId, runId) => {
  setSelectedRunId(runId)
  const runData = await getRunDetails(modelId, runId)  // Duplicate!
  (window as any).__showRunInChat(modelId, runId, runData)
  setContext("run")
}
```

**New (3 lines):**
```typescript
const handleRunClick = async (modelId, runId) => {
  router.push(`/m/${modelId}/r/${runId}`)
}
```

---

## Benefits

### Performance
- ✅ Reduced API calls from 3 to 1 (66% reduction)
- ✅ No duplicate fetching
- ✅ Cleaner code (60 lines removed total)

### UX
- ✅ URL reflects content
- ✅ Shareable URLs (`/m/186/r/101`)
- ✅ Bookmarkable runs
- ✅ Proper navigation

### Architecture
- ✅ Clear route hierarchy
- ✅ Single source of truth (ContextPanel owns run data)
- ✅ Consistent with conversation routes

---

## Route Structure

**Before:**
```
/m/[modelId]/new  → Could be new chat OR viewing a run (confusing!)
```

**After:**
```
/m/[modelId]/new        → New model conversation ONLY
/m/[modelId]/c/[id]     → Model conversation
/m/[modelId]/r/[runId]  → Run analysis (NEW!)
```

---

## Related Issues Fixed

- ✅ ISSUE-2: URL doesn't change when clicking run
- ✅ ISSUE-1B: Triple API call when clicking run

---

**Status:** ✅ Complete
**Files Created:** 1
**Files Modified:** 5
**API Calls Reduced:** 66% (3 → 1)

