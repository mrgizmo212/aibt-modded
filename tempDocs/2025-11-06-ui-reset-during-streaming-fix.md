# BUG-018: UI Resets to Default State During Streaming

**Date:** 2025-11-06  
**Status:** ✅ FIXED  
**Severity:** High - User-facing, breaks UX

## Bug Description

When submitting a message on `/m/[id]/new`, the chat interface would briefly show the streaming message, then reset back to the default welcome state while the message was still being streamed.

**User Report:**
- Screenshot 1: Shows message submitted and streaming started (working)
- Screenshot 2: Shows UI reset to empty/default state during streaming (bug)

## Root Cause

**Race condition** between navigation and state management:

1. User submits first message in ephemeral mode (`/m/184/new`)
2. Backend creates session and returns `session_created` event with new session ID (102)
3. Stream completes, navigation triggers to `/m/184/c/102`
4. Streaming flags (`streamingMessageId`, `isTyping`) are cleared after 100ms delay
5. URL change triggers `useEffect` (line 139) that loads conversation messages
6. **RACE**: If `useEffect` runs AFTER the 100ms timeout, the guard check fails
7. Messages reload, clearing the streaming content from UI

### Why the Guard Failed

FILENAME: `frontend-v2/components/chat-interface.tsx`

The guard at lines 144-148 should prevent reload during streaming:

```typescript
if (streamingMessageId || isTyping) {
  console.log('[Chat] Currently streaming, skip message reload to prevent clearing streaming state')
  return
}
```

But this only works if the flags are still set when `useEffect` runs. The 100ms delay (line 483) was not guaranteed to be long enough.

The session change guard at line 151:

```typescript
if (sessionId === currentSessionId) {
  console.log('[Chat] Session unchanged, skipping reload')
  return
}
```

Also failed because `currentSessionId` was only updated when the `useEffect` ran, not when the session was actually created.

## The Fix

Set `currentSessionId` **immediately** when `session_created` event fires (line 433), not when navigation happens.

### Code Change

FILENAME: `frontend-v2/components/chat-interface.tsx` - lines 433-448

**Before:**
```typescript
if (data.type === 'session_created' && data.session_id) {
  createdSessionId = data.session_id
  console.log('[Chat] ✅ Session created:', createdSessionId)
  
  // NOTE: Do NOT navigate yet - wait for streaming to complete
  // Will call onConversationCreated in 'done' event
  
  // Dispatch event for sidebar refresh (this is safe)
  window.dispatchEvent(new CustomEvent('conversation-created', {
    detail: { sessionId: createdSessionId, modelId: ephemeralModelId }
  }))
}
```

**After:**
```typescript
if (data.type === 'session_created' && data.session_id) {
  createdSessionId = data.session_id
  console.log('[Chat] ✅ Session created:', createdSessionId)
  
  // FIX: Set currentSessionId IMMEDIATELY to prevent reload race condition
  // This ensures the useEffect guard at line 151 catches it when navigation happens
  setCurrentSessionId(createdSessionId.toString())
  
  // NOTE: Do NOT navigate yet - wait for streaming to complete
  // Will call onConversationCreated in 'done' event
  
  // Dispatch event for sidebar refresh (this is safe)
  window.dispatchEvent(new CustomEvent('conversation-created', {
    detail: { sessionId: createdSessionId, modelId: ephemeralModelId }
  }))
}
```

### How This Fixes It

Now the sequence is:

1. Session created → `currentSessionId` set to "102" **immediately**
2. Stream completes → navigation triggers to `/m/184/c/102`
3. `useEffect` runs → `sessionId = 102`, `currentSessionId = "102"`
4. Guard check at line 151: `sessionId === currentSessionId` → **true**
5. Reload skipped → streaming content preserved ✅

The race condition is eliminated because we set the session ID synchronously when the event fires, not after navigation or timeout.

## Testing Required

**Test Script:** `scripts/test-ui-reset-during-streaming.md`

Manual testing steps:
1. Navigate to `/m/[id]/new`
2. Submit a message
3. Observe UI during streaming
4. **Expected:** UI shows streaming message continuously, no reset
5. **Previously:** UI would briefly reset to welcome message

Test multiple scenarios:
- General chat `/new`
- Model-specific chat `/m/[id]/new`
- Fast responses (quick stream)
- Slow responses (long stream)
- Network latency variations

## Related Bugs

- BUG-016: Model conversation 404 error (fixed)
- BUG-017: `astream()` dict iteration error (fixed)

All three bugs were related to the model conversation streaming implementation.

## Prevention

✅ Set state synchronously when events fire, not after delays/timeouts
✅ Use immediate state updates to prevent race conditions with async operations
✅ Guard checks should rely on state that's set early, not late
✅ Test with various network speeds to catch timing-dependent bugs

## Lesson Learned

**Race conditions with React state and navigation are subtle:**
- State updates should happen as early as possible
- Don't rely on setTimeout delays to prevent race conditions
- Use synchronous state updates with navigation guards
- Test streaming scenarios thoroughly with screenshots/recordings

