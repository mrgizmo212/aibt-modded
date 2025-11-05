# Frontend-v2 Comprehensive Audit via Browser Testing

**Date:** 2025-11-05 10:57  
**Method:** Live browser testing with Chrome DevTools + MCP Browser Tools  
**Duration:** 7 minutes of systematic testing  
**Status:** CRITICAL BUGS FOUND

---

## 🚨 CRITICAL BUGS (Blocking Features)

### BUG-007: SSE Chat Authentication Failure
**Severity:** CRITICAL - Chat completely broken  
**Evidence:** Console error every message send:
```
[ERROR] [Chat] Stream error: Error code: 401 - 
{'error': {'message': 'No cookie auth credentials found', 'code': 401}}
```

**What happens:**
1. User types message
2. Frontend creates EventSource for SSE
3. Backend responds with 401 Unauthorized
4. Stream fails immediately
5. No AI response ever arrives

**Root Cause:**
- **Backend expects:** Cookie-based authentication
- **Frontend sends:** Token in query parameter (`?token=xxx`)
- **Mismatch:** Backend can't validate token from query params

**Files Affected:**
- `use-chat-stream.ts` - Lines 46-87 (creates SSE URL with token param)
- `chat-interface.tsx` - Lines 350-478 (handleFirstMessage with token param)
- `backend/main.py` - SSE endpoints expecting cookie auth

**Impact:** **USERS CANNOT USE CHAT AT ALL**

---

### BUG-003: API Polling Storm
**Severity:** HIGH - Performance killer  
**Evidence:** Console logs in 7 minutes:
- `/api/trading/status` → **40+ requests**
- `/api/models` → **12+ requests**
- `/api/chat/sessions` → **10+ requests**

**Detailed Analysis:**

| Time Window | Trading Status Calls | Frequency |
|-------------|---------------------|-----------|
| 0-10s | 8 calls | ~1 per second |
| 10-20s | 6 calls | ~2 per second |
| Ongoing | Continuous | Non-stop |

**Root Causes:**

1. **navigation-sidebar.tsx** Line 159-164:
```typescript
const interval = setInterval(() => {
  loadTradingStatus()  // ← Fires every 30s
}, 30000)
```

2. **WORSE:** Multiple intervals stacking due to re-renders

**Console Evidence:**
```
[SSE Hook] useEffect triggered - modelId: null enabled: true
[SSE Hook] useEffect triggered - modelId: null enabled: false
[SSE Hook] useEffect triggered - modelId: null enabled: true
[SSE Hook] useEffect triggered - modelId: null enabled: false
[SSE Hook] useEffect triggered - modelId: null enabled: true
```

**This shows:** useEffect firing **5 times in rapid succession** → creating multiple intervals

**Impact:**
- Wasted API calls (hundreds per hour)
- Backend overload
- Browser performance degradation
- Battery drain on mobile

---

### BUG-008: Duplicate Event Listeners  
**Severity:** HIGH - Memory leak  
**Evidence:** Console shows same event 4 times:
```
[Nav] Conversation created event received: {sessionId: 56, modelId: undefined}
[Nav] Conversation created event received: {sessionId: 56, modelId: undefined}
[Nav] Conversation created event received: {sessionId: 56, modelId: undefined}
[Nav] Conversation created event received: {sessionId: 56, modelId: undefined}
```

**Root Cause:** Multiple components (or multiple instances) registering `window.addEventListener('conversation-created')` without cleanup

**Files Affected:**
- `navigation-sidebar.tsx` - Lines 177-200 (adds listener)
- Likely: `app/page.tsx` or other components also listening

**Impact:**
- 4x redundant API calls when conversation created
- Memory leak (listeners not removed on unmount)
- Performance degradation over time

---

## ⚠️ HIGH SEVERITY BUGS

### BUG-010: useEffect Infinite Loop Risk
**Severity:** HIGH  
**Evidence:** Console spam of useEffect triggers:
```
[SSE Hook] useEffect triggered - modelId: null enabled: true
[SSE Hook] useEffect triggered - modelId: null enabled: false
[SSE Hook] useEffect triggered - modelId: null enabled: true
(Repeats rapidly)
```

**Root Cause:** useEffect dependencies triggering each other

**Files Affected:**
- `use-trading-stream.ts` - Lines 46-63
- `navigation-sidebar.tsx` - Multiple useEffects with circular dependencies

**Impact:**
- Excessive re-renders
- Performance issues
- Potential infinite loops
- UI feels laggy

---

### BUG-011: SSE Hook Creates Multiple Connections
**Severity:** HIGH  
**Evidence:** Console shows:
```
[SSE Hook] Calling connectToStream for model: 169
[SSE] Connected to trading stream for model 169
[SSE Hook] Calling connectToStream for model: 169  ← DUPLICATE!
[SSE] Connected to trading stream for model 169   ← DUPLICATE!
```

**Root Cause:** useEffect firing multiple times creating duplicate SSE connections

**Files Affected:**
- `use-trading-stream.ts` - useEffect at lines 46-63

**Impact:**
- Multiple EventSource instances for same model
- Memory leak
- Duplicate event processing
- Server load (double subscriptions)

---

## ✅ FEATURES THAT WORK

### Working Features:
1. ✅ **Login/Authentication** - Successful login, token storage works
2. ✅ **Model Display** - Models show correctly in sidebar
3. ✅ **Run History** - Runs display with correct data
4. ✅ **Run Details** - Clicking run shows embedded component in chat
5. ✅ **Run Data Display** - Performance metrics, stats all render correctly
6. ✅ **Navigation** - Sidebar navigation, URL routing works
7. ✅ **Trading SSE** - Trading stream connects (for model 169)
8. ✅ **UI Rendering** - All components render beautifully

### What This Means:
**The HARD STUFF works:**
- Backend APIs ✅
- Database ✅
- Data fetching ✅
- UI components ✅
- Routing ✅

**The BROKEN STUFF is wiring/performance:**
- SSE authentication ❌
- Polling instead of event-driven ❌
- Multiple connections ❌
- Event listener cleanup ❌

---

## 📊 API Call Analysis (7 Minutes)

### Requests by Endpoint:

| Endpoint | Count | Reason |
|----------|-------|--------|
| `/api/trading/status` | 40+ | Polling storm |
| `/api/models` | 12+ | Excessive re-fetching |
| `/api/chat/sessions` | 10+ | Multiple listeners |
| `/api/chat/sessions/{id}/messages` | 6+ | Duplicate loads |
| `/api/models/{id}/runs` | 4 | Legitimate (model selection) |
| `/api/models/{id}/positions` | 2 | Legitimate |
| `/api/models/{id}/logs` | 4 | Some duplication |

**Total:** **78+ API requests in 7 minutes** (11 per minute average)

**Expected:** ~5-10 requests total for this user journey

**Waste:** **85-90% of API calls are unnecessary**

---

## 🎯 ROOT CAUSE ANALYSIS

### The Core Problems:

1. **React State Hell**
   - useEffect dependencies triggering each other
   - Multiple re-renders causing duplicate API calls
   - State updates triggering more state updates

2. **No Cleanup Logic**
   - EventSource not closed before creating new
   - Event listeners not removed on unmount
   - setInterval not cleared on component unmount

3. **Auth Architecture Mismatch**
   - Backend expects cookies
   - Frontend sends query params
   - SSE can't send custom headers

4. **Polling Instead of Event-Driven**
   - setInterval for trading status
   - Should use SSE for real-time updates
   - Redundant checks when nothing changed

---

## 💡 THE FIX STRATEGY

### Priority Order:

**1. Fix SSE Authentication (BLOCKING)**
   - Change backend to accept token from query param for SSE
   - OR change frontend to use cookie-based auth
   - **MUST FIX FIRST** - chat is completely broken

**2. Stop Polling Storm**
   - Remove setInterval in navigation-sidebar
   - Use SSE events for status updates
   - Add cleanup logic

**3. Fix Duplicate Listeners**
   - Add cleanup in useEffect return functions
   - Deduplicate event handlers
   - Use refs to prevent multiple registrations

**4. Fix SSE Connection Duplication**
   - Close existing connection before creating new
   - Add proper cleanup in use-trading-stream
   - Fix useEffect dependencies

**5. Optimize Re-Renders** (After above fixed)
   - Separate streaming component
   - Reduce useEffect complexity
   - Better state management

---

## 📈 Expected Impact After Fixes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Calls (7 min) | 78+ | ~8 | 90% reduction |
| Chat Functionality | Broken | Working | ✅ Fixed |
| SSE Connections/Model | 2+ | 1 | Memory leak fixed |
| Event Listener Duplicates | 4x | 1x | 75% reduction |
| UI Responsiveness | Sluggish | Smooth | Much better |

---

## 🔍 WHAT USERS SEE

### Current Experience:
```
User: "Why did my model buy AAPL?"
App: *Shows user message*
App: *Spinning "Streaming..." indicator*
App: *ERROR in console*
App: *No response ever appears*
User: "This is broken..."
```

### After Fixes:
```
User: "Why did my model buy AAPL?"
App: *Shows user message*
App: *Streams AI response token by token*
App: *Complete response with reasoning*
User: "This works great!"
```

---

## 📋 NEXT STEPS

1. Create surgical fix plan with exact code changes
2. Fix SSE auth FIRST (unblocks chat)
3. Fix polling storm
4. Fix duplicate listeners
5. Test each fix with prove-fix scripts
6. Deploy when 100% working

---

**Status:** Ready to create implementation plan

**Last Updated:** 2025-11-05 10:57 by AI Agent

