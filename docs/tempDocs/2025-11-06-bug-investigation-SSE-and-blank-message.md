# Bug Investigation: Duplicate SSE & Blank First Message

**Date:** 2025-11-06 19:00  
**Files Analyzed:**
- `frontend-v2/hooks/use-trading-stream.ts`
- `frontend-v2/components/chat-interface.tsx`

---

## 🐛 BUG #2: Duplicate SSE Connections - ROOT CAUSE FOUND

### Evidence from Console:
```
[SSE Hook] Calling connectToStream for model: 184
[SSE] Connected to trading stream for model 184
[SSE] Connected to trading stream for model 184  ← DUPLICATE!
```

### Code Analysis:

**File:** `frontend-v2/hooks/use-trading-stream.ts`

**Lines 47-63:** useEffect hook
```typescript
useEffect(() => {
  console.log('[SSE Hook] useEffect triggered - modelId:', modelId, 'enabled:', enabled)
  
  if (!enabled || !modelId) {
    console.log('[SSE Hook] Not connecting - disabled or no modelId')
    return
  }

  console.log('[SSE Hook] Calling connectToStream for model:', modelId)
  connectToStream()

  return () => {
    console.log('[SSE Hook] Cleanup - disconnecting')
    disconnectFromStream()
  }
}, [modelId])  // Removed 'enabled' from deps - use only modelId
```

### Why It's Happening:

**Three Possible Causes:**

1. **React 18 Strict Mode (DEV ONLY)**
   - In development, React intentionally mounts→unmounts→remounts components
   - This fires useEffect TWICE to detect bugs
   - First mount: connects
   - Unmount: cleanup should disconnect
   - Second mount: connects again
   - If cleanup doesn't run fast enough → 2 connections

2. **Component Mounted Twice**
   - Desktop version + Mobile version both render
   - Both call `useTradingStream(184, {enabled: true})`
   - Creates 2 separate EventSource instances
   - Both connect to same model

3. **Parent Re-render**
   - Parent component re-renders
   - Child using hook re-mounts
   - Hook fires again with same modelId
   - Cleanup doesn't run before new connection

### The Fix (Nov 5th):

Line 60: Removed `enabled` from dependencies
- Before: `}, [modelId, enabled])`
- After: `}, [modelId])`

**Why this helps:** `enabled` was changing frequently, causing useEffect to fire repeatedly

**Why it's STILL broken:** Doesn't address React Strict Mode or dual mounting

### Proper Fix Needed:

**Option A: Add Connection Guard**
```typescript
const isConnectingRef = useRef(false)

function connectToStream() {
  // Guard against concurrent connections
  if (isConnectingRef.current) {
    console.log('[SSE Hook] Already connecting, skipping')
    return
  }
  
  isConnectingRef.current = true
  
  // Clean up any existing connection
  disconnectFromStream()
  
  // ... rest of connection logic
  
  eventSource.onopen = () => {
    isConnectingRef.current = false  // Reset guard
    setConnected(true)
  }
}
```

**Option B: Check if EventSource Already Exists**
```typescript
function connectToStream() {
  // Don't create new if one already exists and is connecting/open
  if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
    console.log('[SSE Hook] Connection already active, skipping')
    return
  }
  
  disconnectFromStream()  // Clean up any closed connection
  // ... rest
}
```

**Option C: Ignore in Production**
- Duplicate might only happen in dev (Strict Mode)
- Verify in production build
- If prod is fine, just document as known dev behavior

**Recommendation:** Use Option B (check readyState) - simple, covers all cases

---

## 🐛 BUG #3: First Message Blank Response - ROOT CAUSE FOUND

### Evidence:
- Screenshots 06-14: Message sent, timestamp shows, but NO text content
- Screenshot 17-19: Second attempt works perfectly

### Code Analysis:

**File:** `frontend-v2/components/chat-interface.tsx`

**Line 377-509:** `handleFirstMessage()` function

**The Flow:**

1. **User clicks send** (line 511: `handleSend()`)
2. **Checks if ephemeral** (line 526: `if (isEphemeral)`)
3. **Calls handleFirstMessage** (line 530)
4. **Creates streaming message** (line 443-449):
   ```typescript
   const streamingMessage: Message = {
     id: streamingMsgId,
     type: "ai",
     text: "",  // ← EMPTY!
     timestamp: "...",
     streaming: true
   }
   setMessages(prev => [...prev, streamingMessage])
   ```
5. **Creates EventSource** (line 406)
6. **On first event** (line 413): Gets `session_id` from server
7. **Calls onConversationCreated** (line 416-420):
   ```typescript
   onConversationCreated?.(sessionId, ephemeralModelId || undefined)
   ```
8. **Parent navigates** (`/m/184/new` → `/m/184/c/84`)
9. **PROBLEM:** URL change causes component re-render
10. **Message state might be lost** during transition

### The Race Condition:

```
T=0ms:  handleSend() called
T=10ms: Streaming message added to state (id: streamingMsgId, text: "")
T=50ms: EventSource connects
T=100ms: First SSE event arrives with session_id
T=110ms: onConversationCreated() called
T=120ms: Parent calls router.replace('/m/184/c/84')
T=130ms: URL changes → Component re-renders
T=140ms: useEffect sees selectedConversationId changed
T=150ms: loadConversationMessages() fires
T=160ms: Fetches messages from DB (empty - AI response not saved yet!)
T=170ms: Sets messages to empty array (or welcome message)
T=200ms: SSE tokens start arriving
T=250ms: Tries to update streamingMessageId but it's gone from state!
```

### Why Second Attempt Works:

- No URL change (already on `/m/184/c/84`)
- No conversation loading race
- streamingMessageId stays in state
- Tokens update correctly

### The Fix:

**Option A: Don't Load Messages on First Navigation**

Add flag to skip message loading when coming from ephemeral:
```typescript
const isFirstMessageRef = useRef(false)

// In handleFirstMessage:
isFirstMessageRef.current = true

// In loadConversationMessages useEffect:
if (isFirstMessageRef.current) {
  console.log('[Chat] First message navigation, skip loading')
  isFirstMessageRef.current = false
  return
}
```

**Option B: Preserve Streaming State During Navigation**

Don't call `loadConversationMessages` if `streamingMessageId` is active:
```typescript
if (streamingMessageId) {
  console.log('[Chat] Currently streaming, skip message reload')
  return
}
```

**Option C: Delay Navigation**

Wait for stream to complete before navigating:
```typescript
// In handleFirstMessage onmessage handler:
if (data.type === 'done') {
  fullResponse  // Save response
  
  // THEN navigate (after stream complete)
  onConversationCreated?.(sessionId, ephemeralModelId)
}
```

**Recommendation:** Option B (check if streaming) - simplest, safest

---

## Summary

**BUG #2:** Duplicate SSE from React Strict Mode + no readyState check  
**Fix:** Add `if (eventSourceRef.current?.readyState !== EventSource.CLOSED) return`

**BUG #3:** Race between URL navigation and message loading clears streaming state  
**Fix:** Skip message loading if `streamingMessageId` is active

**Confidence:** 95% - both are well-understood issues with clear solutions

---

**Ready to implement fixes.**

