# Test Scripts for Bug Fixes (2025-11-07)

## Available Tests

### 1. API Call Reduction Test (Browser Console)
**File:** `scripts/test-api-call-reduction.js`

**Purpose:** Verify BUG-028 fix reduced duplicate API calls by 60-75%

**How to run:**
1. Open browser (http://localhost:3000)
2. Open DevTools (F12)
3. Go to Console tab
4. Copy entire contents of `scripts/test-api-call-reduction.js`
5. Paste into console and press Enter
6. Navigate through app for 30 seconds:
   - Click models
   - Click runs
   - Switch conversations
7. Watch console for real-time call counting
8. Or type `window.reportAPICalls()` anytime for summary

**Expected Results (After Fix):**
```
✅ GET /api/models: 2-4 calls
✅ GET /api/trading/status: 2-4 calls
✅ GET /api/models/186/logs: 2-4 calls
✅ GET /api/chat/sessions: 2-4 calls
✅ GET /api/models/186/runs: 2-4 calls
```

**Before Fix:**
```
❌ GET /api/models: 8-12 calls
❌ GET /api/trading/status: 10-15 calls
❌ GET /api/models/186/logs: 15-20 calls
❌ GET /api/chat/sessions: 8-12 calls
```

---

### 2. Run Route Verification (Node.js)
**File:** `scripts/test-run-route-exists.js`

**Purpose:** Verify BUG-027 fix - dedicated run route exists and properly configured

**How to run:**
```powershell
node scripts/test-run-route-exists.js
```

**Tests:**
- ✅ Route file exists at `/m/[modelId]/r/[runId]/page.tsx`
- ✅ Exports default function
- ✅ Uses useParams hook
- ✅ Extracts runId and modelId from params
- ✅ Passes runId to ContextPanel
- ✅ Context set to "run"
- ✅ Has NavigationSidebar, ChatInterface
- ✅ Handles run click navigation

**Expected output:**
```
✅ ALL TESTS PASSED!
✅ Run route is properly configured
```

---

### 3. Mobile Component Optimization Test (Node.js)
**File:** `scripts/test-mobile-component-optimization.js`

**Purpose:** Verify BUG-028 fix - mobile components use conditional rendering

**How to run:**
```powershell
node scripts/test-mobile-component-optimization.js
```

**Tests:**
- ✅ MobileBottomSheet uses `{isOpen && children}`
- ✅ MobileDrawer uses `{isOpen && children}`
- ✅ Animation wrappers preserved
- ✅ Drag handles preserved
- ✅ Overlays preserved
- ✅ Headers and close buttons preserved

**Expected output:**
```
✅ ALL TESTS PASSED!
✅ Mobile components properly optimized
✅ Animations preserved
✅ No breaking changes detected
```

---

## Manual Testing Checklist

After running automated tests, manually verify:

### Run Route (BUG-027)
- [ ] Click a run from sidebar
- [ ] URL changes to `/m/[modelId]/r/[runId]`
- [ ] Sidebar shows run details
- [ ] Chat interface shows run context
- [ ] Can navigate to run URL directly

### Context Panel (BUG-022, 023, 024, 025)
- [ ] No jiggling when viewing models
- [ ] Clicking runs doesn't crash
- [ ] Sidebar doesn't go blank
- [ ] Run details load correctly

### Edit Model Dialog (BUG-026)
- [ ] Click "Edit Model" button
- [ ] Dialog opens without console errors
- [ ] All input fields have values
- [ ] No "controlled to uncontrolled" warnings

### Mobile Components (BUG-028)
- [ ] Open mobile drawer (resize to mobile viewport)
- [ ] Smooth slide-in animation
- [ ] NavigationSidebar loads correctly
- [ ] Close drawer - smooth slide-out
- [ ] Check network tab - no API calls when drawer closed

---

## Running All Tests

**PowerShell command to run all Node.js tests:**
```powershell
node scripts/test-run-route-exists.js; node scripts/test-mobile-component-optimization.js
```

**Expected:**
```
✅ ALL TESTS PASSED! (test 1)
✅ ALL TESTS PASSED! (test 2)
```

---

## Interpreting Results

### API Call Test
- **2x calls:** Perfect (React Strict Mode expected)
- **3-4x calls:** Acceptable in dev (may be component re-mounts)
- **5+ calls:** Problem - investigate further

### Route Test
- All ✅: Ready to use
- Any ❌: Fix the specific issue reported

### Mobile Test
- All ✅: Optimization working, animations preserved
- Any ❌: Review the specific component

---

**Created:** 2025-11-07  
**Updated:** 2025-11-07  
**Tests:** 3 total (1 browser, 2 Node.js)

