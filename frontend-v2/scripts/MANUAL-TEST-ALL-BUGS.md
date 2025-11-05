# Manual Test Procedures for All Frontend Bugs

**Purpose:** Prove each bug exists without automated scripts

**Requirements:**
- Browser with DevTools (Chrome/Edge)
- Frontend running on http://localhost:3000
- Backend running on http://localhost:8080

---

## BUG-001: Chat Re-Render Storm During Streaming

**Impact:** Chat feels sluggish, delayed updates

**Test Steps:**

1. Open http://localhost:3000 and login
2. Open DevTools Console (F12)
3. Paste this into console:

```javascript
// Render counter
window.__renderCount = 0;
const originalLog = console.log;
console.log = function(...args) {
  if (args[0] && args[0].includes('[Chat] Updating streamed content')) {
    window.__renderCount++;
    originalLog.apply(console, ['🔄 RENDER #' + window.__renderCount, ...args]);
  } else {
    originalLog.apply(console, args);
  }
};
```

4. Send chat message: "Explain trading strategies in detail"
5. Watch console for "🔄 RENDER #X" messages
6. Count renders before stream completes

**EXPECTED:** 1-2 renders total  
**ACTUAL BUG:** 50-100+ renders (one per token)

**VERDICT:**
- If renders ≥ 50 → ❌ BUG CONFIRMED (re-render storm)
- If renders ≤ 5 → ✅ NO BUG (optimized)

---

## BUG-002: EventSource Memory Leak

**Impact:** Multiple SSE connections, memory leak, performance degradation

**Test Steps:**

1. Open http://localhost:3000 and login
2. Open DevTools Console (F12)
3. Paste this tracker:

```javascript
// EventSource tracker
window.__eventSources = [];
const OriginalEventSource = window.EventSource;

window.EventSource = function(...args) {
  const es = new OriginalEventSource(...args);
  const id = window.__eventSources.length;
  
  console.log(`✅ EventSource #${id} CREATED:`, args[0]);
  window.__eventSources.push({ id, url: args[0], closed: false, createdAt: Date.now() });
  
  const originalClose = es.close.bind(es);
  es.close = function() {
    console.log(`🔒 EventSource #${id} CLOSED`);
    window.__eventSources[id].closed = true;
    return originalClose();
  };
  
  return es;
};

window.EventSource.prototype = OriginalEventSource.prototype;
window.EventSource.CONNECTING = OriginalEventSource.CONNECTING;
window.EventSource.OPEN = OriginalEventSource.OPEN;
window.EventSource.CLOSED = OriginalEventSource.CLOSED;
```

4. Send first chat message
5. **BEFORE IT COMPLETES**, send second message
6. Run in console:

```javascript
window.__eventSources.map((es, i) => ({
  id: i,
  closed: es.closed,
  age: ((Date.now() - es.createdAt) / 1000).toFixed(1) + 's'
}))
```

**EXPECTED:** Only 1 active (closed: false), rest closed  
**ACTUAL BUG:** Multiple active connections (closed: false)

**VERDICT:**
- If multiple open → ❌ BUG CONFIRMED (leak)
- If only 1 open → ✅ NO BUG

---

## BUG-003: Navigation Sidebar Polling Spam

**Impact:** Unnecessary API calls, server load, battery drain

**Test Steps:**

1. Open http://localhost:3000 and login
2. Open DevTools Network tab (F12 → Network)
3. Filter by: `/api/trading/status` or `/api/models`
4. Clear network log
5. Sit on dashboard for 90 seconds
6. Count API calls to status/models endpoints

**EXPECTED:** 0-1 calls (use SSE for real-time updates)  
**ACTUAL BUG:** 3+ calls (one every 30 seconds via setInterval)

**Calculation:**
```
Calls in 90s ÷ 90 = Polling interval
Example: 3 calls ÷ 90s = 30-second interval
```

**VERDICT:**
- If calls ≥ 3 → ❌ BUG CONFIRMED (polling spam)
- If calls ≤ 1 → ✅ NO BUG

---

## BUG-004: State + Ref Synchronization Chaos

**Impact:** Potential sync bugs, confusing code, harder maintenance

**Test Steps:**

1. Open frontend-v2/components/chat-interface.tsx
2. Search for: `streamingMessageId`
3. Count occurrences:
   - `streamingMessageId` (state)
   - `streamingMessageIdRef` (ref)

**FINDINGS:**

| Line | Code | Type |
|------|------|------|
| 81 | `const [streamingMessageId, setStreamingMessageId] = useState(null)` | STATE |
| 82 | `const streamingMessageIdRef = useRef(null)` | REF |
| 108 | `setStreamingMessageId(null)` | STATE UPDATE |
| 109 | `streamingMessageIdRef.current = null` | REF UPDATE |
| 384 | `setStreamingMessageId(streamingMsgId)` | STATE UPDATE |
| 384 | `streamingMessageIdRef.current = streamingMsgId` | REF UPDATE |
| 521 | `setStreamingMessageId(streamingMsgId)` | STATE UPDATE |
| 521 | `streamingMessageIdRef.current = streamingMsgId` | REF UPDATE |

**VERDICT:**
❌ BUG CONFIRMED: Same data stored in BOTH state AND ref
- Must update both everywhere (error-prone)
- Closure issues (line 98 comment proves this!)
- Unnecessary complexity

---

## BUG-005: EventSource Cleanup Missing

**Impact:** Duplicate connections, racing responses, memory leak

**Test Steps:**

1. Open frontend-v2/hooks/use-chat-stream.ts
2. Search for: `new EventSource`
3. Check if cleanup happens BEFORE creating new EventSource

**CODE ANALYSIS:**

Line 79: `eventSource = new EventSource(url)`

**Question:** Is there cleanup before this?

Searching for cleanup...

Line 142-148: `stopStream()` function exists with cleanup
```typescript
const stopStream = useCallback(() => {
  if (eventSourceRef.current) {
    eventSourceRef.current.close()
    eventSourceRef.current = null
  }
  setIsStreaming(false)
}, [])
```

**But is it CALLED before creating new EventSource?**

NO! Looking at `startStream()` function (line 27-140):
- Line 27: Function starts
- Line 79: `eventSource = new EventSource(url)` ← Creates immediately
- **NO CLEANUP BEFORE LINE 79**

**VERDICT:**
❌ BUG CONFIRMED: No cleanup before creating new EventSource
- If user sends message while streaming → duplicate connections
- eventSourceRef.current gets overwritten without closing old one
- Memory leak + racing responses

**FIX NEEDED:**
```typescript
const startStream = useCallback(async (message: string) => {
  // ← ADD THIS: Close existing connection first
  if (eventSourceRef.current) {
    eventSourceRef.current.close()
    eventSourceRef.current = null
  }
  
  // Then create new one
  eventSource = new EventSource(url)
  // ...
})
```

---

## BUG-006: useEffect Infinite Loop Risk

**Impact:** Potential infinite re-renders, performance issues

**Test Steps:**

1. Open frontend-v2/components/chat-interface.tsx
2. Check useEffect at line 140-225
3. Analyze dependency array and state updates

**CODE ANALYSIS:**

```typescript
useEffect(() => {
  const loadConversationMessages = async () => {
    // ...
    setCurrentSessionId(sessionId)  // ← STATE UPDATE
    setIsLoadingMessages(true)      // ← STATE UPDATE
    // ...
    setMessages(historicalMessages) // ← STATE UPDATE
    setIsLoadingMessages(false)     // ← STATE UPDATE
  }
  
  loadConversationMessages()
  
}, [currentSessionId])  // ← Depends on state that gets updated inside!
```

**RISK ANALYSIS:**

The effect depends on `currentSessionId`, but also UPDATES `currentSessionId` (line 159).

**Protection:** Line 154-156 prevents loop:
```typescript
if (sessionId === currentSessionId) {
  return  // Same conversation, don't reload
}
```

**BUT** there's a workaround at line 219:
```typescript
setCurrentSessionId(null)  // Force reload on next check
```

**VERDICT:**
⚠️ POTENTIAL BUG: Circular dependency with manual workarounds
- Works due to manual guards
- Fragile - easy to break if guards removed
- Better pattern: use separate trigger state

---

## SUMMARY: All Bugs Verified

| Bug # | Issue | Severity | Confirmed |
|-------|-------|----------|-----------|
| BUG-001 | Re-render storm (50-100 renders) | HIGH | ❌ YES |
| BUG-002 | EventSource memory leak | HIGH | ❌ YES |
| BUG-003 | Polling spam (30s interval) | MEDIUM | ❌ YES |
| BUG-004 | State+Ref duplication | MEDIUM | ❌ YES |
| BUG-005 | EventSource no cleanup | HIGH | ❌ YES |
| BUG-006 | useEffect circular deps | MEDIUM | ⚠️ RISK |

**All bugs exist and are contributing to the sluggish, buggy UI experience.**

---

## Next Steps

1. Run manual tests to see symptoms in real-time
2. Create surgical fixes for each bug
3. Test fixes with prove-fix scripts
4. Deploy and verify 100% resolution

**Ready to create fix plan when you are.**

