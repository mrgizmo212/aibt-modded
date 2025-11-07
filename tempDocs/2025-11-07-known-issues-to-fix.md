# Known Issues to Fix - 2025-11-07

## Issue List

### ISSUE-1: Duplicate API Calls on Navigation to /m/186/new
**Date Discovered:** 2025-11-07 17:00  
**Severity:** MEDIUM  
**Status:** ✅ FIXED (See BUG-028)

**Symptoms:**
- User clicks "New Chat" button from model conversation
- Navigates to `/m/186/new` successfully
- BUT excessive duplicate API calls occur:
  - `/api/models/186/logs` - called ~10+ times (should be 1-2)
  - `/api/models` - called 4+ times (should be 1-2)
  - `/api/models/186/runs` - called 4+ times (should be 1-2)

**Expected Behavior:**
- Each endpoint should be called ONCE (or TWICE in React Strict Mode)
- Total: ~6 API calls max

**Actual Behavior:**
- 20+ API calls on single navigation
- Similar to BUG-003 (API Polling Storm) which was fixed before

**Likely Causes:**
1. Multiple component instances mounting/unmounting
2. useEffect dependency array causing re-triggers
3. Context changes causing duplicate data loads
4. Possible unmemoized function causing infinite loop

**Affected Areas:**
- Navigation sidebar
- Context panel
- Chat interface

**Impact:**
- Wastes bandwidth
- Server load
- Slower page loads
- Battery drain on mobile

**To Investigate:**
- Check useEffect dependencies in navigation-sidebar.tsx
- Check context-panel.tsx loadModelData triggers
- Check for unmemoized functions in dependency arrays
- Look for React Strict Mode double-mount issues

---

### ISSUE-1B: Triple API Call When Clicking Run
**Date Discovered:** 2025-11-07 17:05  
**Severity:** LOW  
**Status:** ✅ FIXED (See BUG-027)

**Symptoms:**
- User clicks on a run
- `/api/models/186/runs/101` is called **3 times** (should be 1-2)
- Same run data fetched multiple times

**Expected Behavior:**
- Click run → Fetch run details ONCE (or twice in React Strict Mode)

**Actual Behavior:**
- Fetches 3 times
- Wastes bandwidth

**Likely Cause:**
- Multiple components calling `getRunDetails` for same run
- Page component + ContextPanel both fetching?
- Duplicate event handlers

---

### ISSUE-2: URL Doesn't Change When Clicking Run from /m/186/new
**Date Discovered:** 2025-11-07 17:05  
**Severity:** MEDIUM  
**Status:** ✅ FIXED (See BUG-027)

**Symptoms:**
- User is on `/m/186/new` (new model chat page)
- User clicks on a run (Run #2) from sidebar
- Run details appear in chat area ✅
- BUT URL stays as `/m/186/new` instead of changing to run context ❌
- When user sends message, creates NEW conversation instead of run conversation

**Expected Behavior:**
- Click run → URL should change to indicate run context (maybe `/m/186/r/101`?)
- OR stay in model chat but chat should be aware it's in run analysis mode
- Sending message should create run-specific conversation

**Actual Behavior:**
- URL stays at `/m/186/new`
- Chat thinks it's in ephemeral mode
- New message creates general conversation, not run conversation
- Run context is lost

**Impact:**
- User confusion (URL doesn't reflect state)
- Creates wrong conversation type
- Run analysis context not preserved

**To Investigate:**
- How should run click work from `/m/186/new`?
- Should URL change? Or should chat interface handle run mode differently?
- Check `handleRunClick` in page component
- Check if chat interface needs run context awareness

---

### ISSUE-3: Duplicate "Conversation Created" Events
**Date Discovered:** 2025-11-07 17:05  
**Severity:** LOW  
**Status:** ✅ FIXED (See BUG-028)

**Symptoms:**
- When sending first message, `conversation-created` event fires TWICE:
```
[Nav] Conversation created event received: {sessionId: 132, modelId: 186}
[Nav] Conversation created event received: {sessionId: 132, modelId: 186}
```

**Expected Behavior:**
- Event should fire ONCE per conversation creation

**Actual Behavior:**
- Event fires twice
- Causes duplicate API calls to refresh sessions

**Likely Cause:**
- Multiple NavigationSidebar instances listening to same event
- Similar to BUG-008 (Duplicate Event Listeners) which was supposedly fixed

**To Investigate:**
- Check if `isHidden` guard is working in navigation-sidebar.tsx
- Check for multiple component mounts (desktop + mobile)

---

### ISSUE-4: Messages Loaded Twice for Same Conversation
**Date Discovered:** 2025-11-07 17:10  
**Severity:** LOW  
**Status:** ✅ FIXED (See BUG-028)

**Symptoms:**
- User clicks conversation in sidebar
- Console shows: `[Chat] Loaded 2 messages for conversation 130` **TWICE**
- API endpoint `/api/chat/sessions/130/messages` called **TWICE**

**Expected Behavior:**
- Load messages ONCE per conversation switch

**Actual Behavior:**
- Loads messages twice
- Duplicate API call

**Likely Cause:**
- useEffect triggering twice due to dependency changes
- Multiple component mounts (desktop + mobile)
- Session state changing multiple times

---

### ISSUE-5: Excessive Trading Status Polling
**Date Discovered:** 2025-11-07 17:10  
**Severity:** LOW  
**Status:** ✅ FIXED (See BUG-028)

**Symptoms:**
- `/api/trading/status` called **5+ times** during conversation navigation
- `[Navigation] Trading status response: []` appears multiple times

**Expected Behavior:**
- Check trading status ONCE per navigation

**Actual Behavior:**
- Called 5+ times
- Even though no agents are running (returns empty)

**Likely Cause:**
- Multiple NavigationSidebar instances
- useEffect re-triggering
- No memoization on trading status check

---

### ISSUE-6: "Create Model" Button Only Works on /new Route
**Date Discovered:** 2025-11-07 17:15  
**Date Fixed:** 2025-11-07 18:30  
**Severity:** HIGH  
**Status:** ✅ FIXED (See BUG-029)

**Root Cause Found:**
- Incorrect conditional rendering: `{isEditDialogOpen && editingModel && (`
- The `&& editingModel` check prevented dialog from rendering when `editingModel` is `null` (create mode)
- Only `/new/page.tsx` had correct conditional: `{isEditDialogOpen && (`
- Other 5 pages had the buggy double check

**Symptoms:**
- User clicks "Create Model" button from sidebar
- **Works perfectly on `/new` route** ✅
- **Does NOT work on other routes:**
  - `/m/186/new` ❌
  - `/m/186/c/131` ❌
  - `/c/130` ❌
  - `/m/186/r/101` ❌
  - `/` (main dashboard) ❌

**Expected Behavior:**
- Click "Create Model" → Dialog opens immediately on ALL routes

**Actual Behavior:**
- `/new`: Works instantly ✅ (correct conditional)
- All other routes: Dialog doesn't render ❌ (buggy conditional)

**The Fix:**
Removed `&& editingModel` check from 5 page components:
1. ✅ `frontend-v2/app/page.tsx` line 206
2. ✅ `frontend-v2/app/c/[conversationId]/page.tsx` line 211
3. ✅ `frontend-v2/app/m/[modelId]/new/page.tsx` line 219
4. ✅ `frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx` line 208
5. ✅ `frontend-v2/app/m/[modelId]/r/[runId]/page.tsx` line 215

**Technical Details:**
- `handleCreateModel()` sets `editingModel` to `null` for create mode
- `ModelEditDialog` component correctly handles both `null` (create) and actual model data (edit)
- The double conditional `&& editingModel` was preventing render when `null` (falsy)

**Verification:**
- All pages now use correct conditional: `{isEditDialogOpen && (`
- Create model button should work on all routes
- Edit model button continues to work (when `editingModel` has data)

**Impact:**
- HIGH - Users can now create models from ANY page
- UX significantly improved
- Consistent behavior across all routes

---

---

### FEATURE-1: Run Conversations in Navigation Sidebar
**Date Added:** 2025-11-07 19:00  
**Status:** ✅ IMPLEMENTED

**Problem:**
- Run conversations stored in database but invisible in sidebar
- No way to access past run analysis discussions
- Users had to remember which runs they discussed
- Navigation between runs difficult

**Solution Implemented:**
Added "Run Conversations" section to navigation sidebar that:
- Shows all runs that have conversations
- Displays run metadata (run number, date, return %)
- Click navigates to run details page (`/m/[modelId]/r/[runId]`)
- Can delete run conversations
- Organized separately from model conversations

**Files Modified:**
- ✅ `backend/services/chat_service.py` - Added `has_run` parameter, includes run data in response
- ✅ `backend/main.py` - Updated endpoint to accept `has_run` query parameter
- ✅ `frontend-v2/lib/api.ts` - Updated `listChatSessions` to accept `has_run` option
- ✅ `frontend-v2/components/navigation-sidebar.tsx` - Added complete run conversations UI and state management

**Critical Patterns Used:**
- ✅ isHidden guard - Prevents duplicate API calls from mobile drawer
- ✅ runConversationsLoaded flag - Load only once
- ✅ Event listener with debouncing - Prevents spam
- ✅ Cleanup functions - No memory leaks
- ✅ Exact same patterns as BUG-028 fixes

**UI Structure:**
```
Momentum Scalper (expanded)
├── + New Chat
├── 💬 CONVERSATIONS
│   └── Model conversations
├── 🏃 RUN CONVERSATIONS
│   └── Run #2 - Today (2 msgs • -1.31%)
```

**Navigation Flow:**
- Click run conversation → Navigate to `/m/186/r/101`
- View run stats + continue conversation
- Easy switching between different run analyses

---

## Next Steps
- Continue testing to find all bugs
- Fix all bugs in batch
- Document all fixes together

**Last Updated:** 2025-11-07 19:00

