# Known Issues to Fix - 2025-11-07

## Issue List

### ISSUE-1: Duplicate API Calls on Navigation to /m/186/new
**Date Discovered:** 2025-11-07 17:00  
**Severity:** MEDIUM  
**Status:** 📝 NOTED - To be fixed later

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
**Status:** 📝 NOTED - To be fixed later

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
**Status:** 📝 NOTED - To be fixed later

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
**Status:** 📝 NOTED - To be fixed later

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

### ISSUE-6: "Create Model" Button Has Massive Delay or Not Working
**Date Discovered:** 2025-11-07 17:15  
**Severity:** HIGH  
**Status:** 📝 NOTED - To be fixed later

**Symptoms:**
- User clicks "Create Model" button from sidebar
- Nothing happens immediately
- Massive delay before anything loads
- Eventually loads (or doesn't)
- **NO logs showing button click** in console

**Expected Behavior:**
- Click button → Dialog opens immediately
- Form initializes
- Console shows dialog opening logs

**Actual Behavior:**
- Click → Nothing
- Long delay
- No immediate feedback
- No console logs for click event

**Likely Causes:**
1. Button click handler not attached
2. JavaScript error preventing handler execution
3. Modal/dialog component slow to mount
4. Heavy component initialization blocking UI
5. Missing onClick handler

**To Investigate:**
- Check if onClick handler exists on "Create Model" button
- Check for JavaScript errors when clicking
- Check ModelEditDialog component initialization
- Look for blocking operations in dialog mount

**Impact:**
- Poor UX (no feedback)
- Users think app is frozen
- May click multiple times (duplicate modals?)

---

## Next Steps
- Continue testing to find all bugs
- Fix all bugs in batch
- Document all fixes together

**Last Updated:** 2025-11-07 17:05

