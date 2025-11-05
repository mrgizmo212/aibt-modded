# Frontend-v2 Bugs - CONFIRMED via Browser Testing

**Date:** 2025-11-05 10:54  
**Method:** Live browser testing with Chrome DevTools  
**Status:** All critical bugs confirmed

---

## ✅ CONFIRMED BUGS

### BUG-003: Polling Spam - CRITICAL
**Evidence:** Network tab shows in ~10 seconds:
- `/api/trading/status` → 10+ requests
- `/api/models` → 3 requests  
- `/api/chat/sessions` → 6 requests

**Root Cause:** `navigation-sidebar.tsx` line 159-164
- `setInterval(() => loadTradingStatus(), 30000)`
- Fires EVERY 30 seconds regardless of changes

**Impact:** 
- Wasted API calls
- Server load
- Battery drain on mobile

---

### BUG-007: SSE Authentication Failure - CRITICAL
**Evidence:** Console error:
```
[ERROR] [Chat] Stream error: Error code: 401
{'error': {'message': 'No cookie auth credentials found', 'code': 401}}
```

**Root Cause:** Backend expects cookie auth for SSE, frontend sends token in query param

**Impact:**
- Chat streaming completely broken
- Users can't get AI responses
- BLOCKING issue

---

### BUG-008: Duplicate Event Listeners - HIGH
**Evidence:** Console shows same event 4 times:
```
[Nav] Conversation created event received: {sessionId: 56}
[Nav] Conversation created event received: {sessionId: 56}
[Nav] Conversation created event received: {sessionId: 56}
[Nav] Conversation created event received: {sessionId: 56}
```

**Root Cause:** Multiple components registering same window event listener without cleanup

**Impact:**
- Redundant API calls
- Performance degradation
- Memory leaks

---

### BUG-009: Message Not Showing After Send - HIGH  
**Evidence:** User sent message, but UI only shows user message, NO AI response visible

**Root Cause:** SSE auth failure prevents streaming (BUG-007)

**Impact:**
- Chat appears broken to users
- No visual feedback
- Looks like app crashed

---

## Priority Fixes Needed

1. **FIX SSE AUTH** (Blocks all chat functionality)
2. **FIX POLLING SPAM** (Performance killer)
3. **FIX DUPLICATE LISTENERS** (Memory leak)
4. **Then optimize re-renders** (After chat works)

---

**Next:** Create surgical fix plan for each bug

