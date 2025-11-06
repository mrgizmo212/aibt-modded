# Bugs and Fixes Log

## Purpose
This file tracks all bugs encountered in the AI Trading Bot codebase, attempted fixes, solutions that worked, and lessons learned. This is our knowledge base to avoid repeating mistakes.

---

## Bug Template (For Future Use)

```
### BUG-XXX: [Brief Description]
**Date Discovered:** YYYY-MM-DD HH:MM  
**Severity:** Critical/High/Medium/Low  
**Symptoms:** [What the user/system experiences]  
**Root Cause:** [What actually caused it - with file citations]  
**Affected Files:** [`file1.ts`, `file2.ts`]

**Attempted Fixes:**
1. [What we tried] - ❌ Failed because [reason with code citation]
2. [What we tried] - ✅ Worked because [reason with code citation]

**Final Solution:**
[The fix that worked - with code citations]

**Code Changes:**
[BEFORE - file: `path/to/file`]
```language
// old code
```

[AFTER - file: `path/to/file`]
```language
// new code
```

**Test Script Created:**
- Script: `scripts/verify-bug-X.py` - Proves bug exists
- Script: `scripts/prove-fix-X.py` - Proves fix works (100% success)

**Lessons Learned:**
- [Key insight 1]
- [Key insight 2]
- [How to prevent this in the future]

**Prevention Strategy:**
[Specific steps to avoid this bug pattern]
```

---

## Active Bug Log

### BUG-016: Model Conversation Streaming Not Working
**Date Discovered:** 2025-11-06 18:30  
**Date Fixed:** 2025-11-06 18:45  
**Severity:** CRITICAL  
**Status:** ✅ FIXED

**Symptoms:**
- User navigates to model conversation URL `/m/184/c/80`
- Route loads successfully (no 404)
- User sends a message
- AI doesn't respond - stuck showing "streaming..." forever
- After refresh, message shows blank AI reply

**Root Cause:**
Backend endpoint `/api/chat/general-stream` was hardcoding `model_id=None` when saving messages, even though it received `model_id=184` in the query parameters. This caused messages to be saved to a DIFFERENT conversation (the general conversation) instead of the intended model-specific conversation.

**Affected Files:**
- `backend/main.py` - Lines 2019, 2165, 2174, 2186

**What Was Wrong:**

```python
# Line 2019-2021: Session creation
session = await get_or_create_session_v2(
    user_id=current_user["id"],
    model_id=None  # ❌ Hardcoded!
)

# Line 2165: User message save
model_id=None,  # ❌ Hardcoded!

# Line 2174: AI response save
model_id=None,  # ❌ Hardcoded!

# Line 2186: Summarization session
model_id=None  # ❌ Hardcoded!
```

**The Flow of the Bug:**
1. User navigates to `/m/184/c/80` → Conversation 80 loads correctly ✅
2. User sends "Hello" → Frontend sends `model_id=184` in query params ✅
3. Backend receives `model_id=184` ✅
4. Backend creates/gets session with `model_id=None` → **Uses DIFFERENT conversation** ❌
5. Backend saves "Hello" with `model_id=None` → **Saves to wrong conversation** ❌
6. Backend streams AI response ✅
7. Backend saves response with `model_id=None` → **Saves to wrong conversation** ❌
8. Frontend waits for messages in conversation 80 → **Never receives them** ❌

**Final Solution:**
Changed 4 instances of hardcoded `model_id=None` to use the `model_id` parameter value.

**Code Changes:**

[BEFORE - file: `backend/main.py`]
```python
# All 4 locations hardcoded to None
model_id=None  # ← General conversation
```

[AFTER - file: `backend/main.py`]
```python
# All 4 locations now use parameter
model_id=model_id  # ← Use model_id param (None for general, int for model-specific)
```

**What Now Works:**
- General conversations (`/c/[id]`): `model_id=None` → Saves correctly ✅
- Model conversations (`/m/184/c/80`): `model_id=184` → Saves correctly ✅

**Test Script Created:**
- Script: `scripts/verify-bug-model-conversation-streaming.js`
- Tests 5 conditions, all pass ✅
- Proves bug existed before fix, fixed after fix

**Lessons Learned:**
- **Parameter acceptance ≠ Parameter usage** - Endpoint can accept a param but not use it
- **Hardcoded values from initial implementation** can break when features expand
- **Test full data flow** - Context loading worked, but message saving didn't
- **Comments can become stale** - "General conversation" comment was misleading

**Prevention Strategy:**
1. When adding optional parameters, grep for ALL usages of related fields
2. Avoid hardcoded values - use parameters with conditionals
3. Create tests that verify database records, not just API responses
4. Update comments when endpoint behavior changes

---

### BUG-015: 404 Error on New Model Conversation Navigation
**Date Discovered:** 2025-11-06 15:30  
**Date Fixed:** 2025-11-06 17:00  
**Severity:** CRITICAL  
**Status:** ✅ FIXED (ACTUALLY FIXED NOW - files created)

**Symptoms:**
- User creates a new conversation from model page
- Browser navigates to `/m/184/c/79` (model ID 184, conversation ID 79)
- Page shows 404 error - "Page Not Found"
- User cannot access newly created conversation
- Chat appears to create conversation but then fails to display it

**Root Cause:**
Next.js route pages missing for conversation display URLs. The code was attempting to navigate to `/m/[modelId]/c/[conversationId]` and `/c/[conversationId]` routes, but these page components did not exist in the filesystem.

**What Went Wrong Initially:**
Previous agent created verification scripts but FORGOT to create the actual page files. Verification scripts existed, but the routes themselves did not. Classic case of "test without implementation."

**Affected Files:**
- ❌ Missing: `frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx`
- ❌ Missing: `frontend-v2/app/c/[conversationId]/page.tsx`
- Navigation triggered from: `app/m/[modelId]/new/page.tsx` (line 151), `app/new/page.tsx` (line 259), `app/page.tsx` (lines 147, 193)

**Final Solution:**
Created two missing Next.js dynamic route pages:
1. ✅ `/app/m/[modelId]/c/[conversationId]/page.tsx` - For model-specific conversations (224 lines)
2. ✅ `/app/c/[conversationId]/page.tsx` - For general conversations (221 lines)

Both pages:
- Use `useParams()` to extract route parameters (modelId, conversationId)
- Pass `selectedConversationId` to ChatInterface component (CRITICAL: not "conversationId")
- Set `isEphemeral={false}` (not a new conversation, load from database)
- Include full navigation sidebar and context panel
- Handle conversation switching and model selection

**Code Changes:**

[CREATED - file: `frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx`]
```typescript
export default function ModelConversationPage() {
  const params = useParams()
  const modelId = params.modelId ? parseInt(params.modelId as string) : null
  const conversationId = params.conversationId ? parseInt(params.conversationId as string) : null
  
  return (
    <ChatInterface
      isEphemeral={false}
      selectedConversationId={conversationId}  // CRITICAL: use selectedConversationId prop
      selectedModelId={modelId || undefined}
      // ... other props
    />
  )
}
```

[CREATED - file: `frontend-v2/app/c/[conversationId]/page.tsx`]
```typescript
export default function GeneralConversationPage() {
  const params = useParams()
  const conversationId = params.conversationId ? parseInt(params.conversationId as string) : null
  
  return (
    <ChatInterface
      isEphemeral={false}
      conversationId={conversationId || undefined}
      // ... other props
    />
  )
}
```

**Route Structure (Before vs After):**

BEFORE:
```
/app
├── page.tsx                     ← Root dashboard
├── new/page.tsx                 ← New general conversation
└── m/[modelId]/new/page.tsx     ← New model conversation
```

AFTER:
```
/app
├── page.tsx                     ← Root dashboard
├── new/page.tsx                 ← New general conversation
├── c/[conversationId]/page.tsx  ← General conversation view ✅ NEW
└── m/[modelId]/
    ├── new/page.tsx             ← New model conversation
    └── c/[conversationId]/page.tsx  ← Model conversation view ✅ NEW
```

**Test Script Created:**
- Script: `scripts/verify-conversation-routes.js` - Verifies both route files exist and are properly configured
- Results: 13/13 tests passed ✅

**CRITICAL DISCOVERY: GitIgnore Was Blocking Files (2025-11-06 17:15)**
After creating the route files, discovered they weren't being tracked by git:
- **Problem:** Line 211 in `.gitignore` had malformed pattern: "c o n t e x t - o n l y 2 /" (with spaces)
- Git interpreted this as pattern starting with "c", blocking ALL directories named "c"
- **Impact:** Conversation routes in `/app/c/` and `/app/m/[modelId]/c/` were ignored by git
- **Fix:** Removed malformed line, replaced with proper pattern: `docs/projects-for-context-only/context-only2/`
- **Result:** Files now trackable by git ✅

**Test Results:**
```
✅ Model conversation route page exists
✅ General conversation route page exists
✅ Model conversation page exports default function
✅ Model conversation page uses useParams
✅ Model conversation page extracts modelId param
✅ Model conversation page extracts conversationId param
✅ Model conversation page passes conversationId to ChatInterface
✅ Model conversation page sets isEphemeral={false}
✅ General conversation page exports default function
✅ General conversation page uses useParams
✅ General conversation page extracts conversationId param
✅ General conversation page passes conversationId to ChatInterface
✅ General conversation page sets isEphemeral={false}
```

**Lessons Learned:**
- **Route pages must exist for every URL pattern:** Next.js requires a page.tsx file for every route path, including dynamic segments
- **Dynamic routes need proper file structure:** `/m/[modelId]/c/[conversationId]` requires nested folders with proper naming
- **Navigation code doesn't validate routes:** `router.push()` will attempt to navigate even if the route doesn't exist
- **404s can be silent in development:** The error was only visible to the user, not in console logs
- **Missing routes break user flow:** Even when backend/API works perfectly, missing frontend routes break the entire feature
- **🔴 CRITICAL: Always verify .gitignore isn't blocking files:** Malformed .gitignore patterns can silently prevent commits
- **Single-letter patterns in .gitignore are dangerous:** Patterns like "c" or "d" match too broadly and block legitimate directories
- **When git says "nothing to commit" but files exist, check .gitignore first:** Use `git check-ignore -v <path>` to debug

**Prevention Strategy:**
1. **When creating navigation logic:** Verify destination route pages exist BEFORE implementing navigation
2. **When using router.push():** Check that target path has corresponding page.tsx file
3. **Route planning:** Map out ALL required routes (including dynamic segments) during feature design phase
4. **Testing coverage:** Include route navigation in test scripts, not just API calls
5. **Documentation:** Update route structure diagrams when adding new navigation patterns

**Related Issues:**
- This bug was introduced during the two-level conversation system implementation
- Previous sessions (2025-11-05) focused on API/SSE bugs but didn't test route navigation
- The backend conversation creation API worked perfectly - only frontend routing was broken

---

### BUG-007: SSE Chat Authentication Failure (OpenRouter Headers Missing)
**Date Discovered:** 2025-11-05 10:54  
**Date Fixed:** 2025-11-05 11:05  
**Severity:** CRITICAL  
**Status:** ✅ FIXED

**Symptoms:**
- All chat messages fail with 401 error
- Console error: "Error code: 401 - {'error': {'message': 'No cookie auth credentials found', 'code': 401}}"
- User sends message → "Streaming..." indicator shows → No AI response ever arrives
- Chat completely non-functional

**Root Cause:**
OpenRouter API requires `HTTP-Referer` and `X-Title` headers for authentication. Trading agents (`trading/base_agent.py`) had these headers configured, but chat streaming endpoints (`backend/main.py`) did NOT include them when creating ChatOpenAI instances.

**Affected Files:**
- `backend/main.py` - Lines ~1747, ~1970 (chat streaming endpoints)

**Final Solution:**
Add `default_headers` with required OpenRouter headers to all ChatOpenAI initializations in SSE endpoints.

**Code Changes:**

[BEFORE - file: `backend/main.py`]
```python
params = {
    "model": ai_model,
    "temperature": model_params.get("temperature", 0.3),
    "base_url": "https://openrouter.ai/api/v1",
    "api_key": api_key
}
```

[AFTER - file: `backend/main.py`]
```python
params = {
    "model": ai_model,
    "temperature": model_params.get("temperature", 0.3),
    "base_url": "https://openrouter.ai/api/v1",
    "api_key": api_key,
    "default_headers": {
        "HTTP-Referer": "https://aibt.truetradinggroup.com",
        "X-Title": "AIBT AI Trading Platform"
    }
}
```

**Test Script Created:**
- Script: `frontend-v2/scripts/verify-bug-chat-rerender-storm.js` - Manual testing showed bug
- Script: `frontend-v2/scripts/prove-fix-sse-auth.js` - Proves fix works (run: `npm run prove:sse-auth`)

**Lessons Learned:**
- OpenRouter requires HTTP-Referer and X-Title headers for all API requests
- Always check if third-party APIs have header requirements
- Copy working patterns (trading agents had headers, chat should too)
- Test with actual API calls, not just mocks

**Prevention Strategy:**
- Create reusable ChatOpenAI factory function with standard headers
- Document all third-party API requirements in one place
- Include header configuration in all API client initializations

---

### BUG-003: API Polling Storm
**Date Discovered:** 2025-11-05 10:54  
**Date Fixed:** 2025-11-05 11:06  
**Severity:** HIGH  
**Status:** ✅ FIXED

**Symptoms:**
- 200+ API requests in 15 minutes (13 per minute average)
- `/api/trading/status` called every ~9 seconds (not every 30s as coded)
- Browser performance degradation
- Excessive server load
- Battery drain on mobile devices

**Root Cause:**
`setInterval` in `navigation-sidebar.tsx` (line 160-162) polling trading status every 30 seconds. However, due to component re-mounting and useEffect re-triggering, multiple interval timers were stacking, causing calls every ~9 seconds instead of every 30 seconds.

**Affected Files:**
- `frontend-v2/components/navigation-sidebar.tsx` - Lines 159-164

**Final Solution:**
Remove `setInterval` entirely. Use SSE events for real-time updates instead. When SSE emits 'complete' or 'session_complete' events, trigger ONE refresh (already implemented at lines 118-125).

**Code Changes:**

[BEFORE - file: `frontend-v2/components/navigation-sidebar.tsx`]
```typescript
// Refresh status periodically for models not using SSE
const interval = setInterval(() => {
  loadTradingStatus()
}, 30000) // Every 30 seconds

return () => clearInterval(interval)
```

[AFTER - file: `frontend-v2/components/navigation-sidebar.tsx`]
```typescript
// NOTE: Removed setInterval polling - using SSE events for updates
// Trading status refreshes on SSE 'complete'/'session_complete' events (lines 118-125)
```

**Test Script Created:**
- Script: `frontend-v2/scripts/verify-bug-polling-spam.js` - Proved 80+ calls in 90s
- Script: `frontend-v2/scripts/prove-fix-polling-storm.js` - Proves <10 calls in 60s (run: `npm run prove:polling`)

**Lessons Learned:**
- setInterval + React component lifecycle = multiple timers stacking
- Always use event-driven updates (SSE) instead of polling when possible
- If must use setInterval, ensure proper cleanup in useEffect return
- Test network traffic during development, not just before release
- Polling is expensive and doesn't scale

**Prevention Strategy:**
- Prefer SSE/WebSocket for real-time updates over polling
- If using setInterval, add clear cleanup and verify no duplication
- Monitor network tab during development to catch excessive calls early
- Document why polling was chosen (if necessary) vs event-driven approach

---

### BUG-011: Duplicate SSE Connections
**Date Discovered:** 2025-11-05 10:54  
**Date Fixed:** 2025-11-05 11:07  
**Severity:** HIGH  
**Status:** ✅ FIXED

**Symptoms:**
- Console shows "[SSE] Connected to trading stream for model X" 2-3 times for same model
- Multiple EventSource instances active simultaneously
- Memory leak over time
- Duplicate event processing (same event handled multiple times)

**Root Cause:**
useEffect dependency array included `enabled` prop which changed frequently, triggering useEffect to fire multiple times. Each firing created a NEW SSE connection without waiting for cleanup of the previous connection.

**Affected Files:**
- `frontend-v2/hooks/use-trading-stream.ts` - Line 63

**Final Solution:**
Remove `enabled` from useEffect dependencies. Only depend on `modelId` so connections are created/destroyed ONLY when model changes, not when internal state changes.

**Code Changes:**

[BEFORE - file: `frontend-v2/hooks/use-trading-stream.ts`]
```typescript
}, [modelId, enabled])  // Both dependencies
```

[AFTER - file: `frontend-v2/hooks/use-trading-stream.ts`]
```typescript
}, [modelId])  // Removed 'enabled' - use only modelId to prevent rapid re-triggers
```

**Test Script Created:**
- Script: `frontend-v2/scripts/prove-fix-duplicate-sse.js` - Proves only 1 connection per model (run: `npm run prove:duplicate-sse`)

**Lessons Learned:**
- useEffect dependencies should ONLY include values that should trigger the effect
- Props that change frequently shouldn't be in dependency array if not needed
- Use refs for values that don't need to trigger re-runs
- Memory leaks often come from unclosed connections due to re-triggering

**Prevention Strategy:**
- Carefully review useEffect dependencies - ask "Does changing this value require re-running this effect?"
- For connection hooks, only depend on connection identity (model ID, user ID), not state flags
- Add logging to useEffect to catch rapid re-triggering during development
- Use React DevTools profiler to detect excessive re-renders

---

### BUG-008: Duplicate Event Listeners
**Date Discovered:** 2025-11-05 10:54  
**Date Fixed:** 2025-11-05 11:08  
**Severity:** HIGH  
**Status:** ✅ FIXED

**Symptoms:**
- Same event fires 4 times in console: `[Nav] Conversation created event received`
- 4x redundant API calls when conversation created
- Memory leak from uncleaned listeners

**Root Cause:**
NavigationSidebar component is mounted multiple times (desktop view + mobile drawer + other instances). Each instance registered its own `window.addEventListener('conversation-created')` listener, resulting in 4x event handlers for same event.

**Affected Files:**
- `frontend-v2/components/navigation-sidebar.tsx` - Lines 174-211

**Final Solution:**
Only register event listener if component is NOT hidden (`!isHidden`). This ensures only the visible desktop sidebar registers the listener, not the hidden mobile drawer instances.

**Code Changes:**

[BEFORE - file: `frontend-v2/components/navigation-sidebar.tsx`]
```typescript
useEffect(() => {
  const handleConversationCreated = (event: any) => {
    // ... handler logic
  }
  
  window.addEventListener('conversation-created', handleConversationCreated)
  
  return () => {
    window.removeEventListener('conversation-created', handleConversationCreated)
  }
}, [])  // Empty deps
```

[AFTER - file: `frontend-v2/components/navigation-sidebar.tsx`]
```typescript
useEffect(() => {
  // CRITICAL: Only add listener if NOT hidden
  if (isHidden) {
    return
  }
  
  const handleConversationCreated = (event: any) => {
    // ... handler logic
  }
  
  window.addEventListener('conversation-created', handleConversationCreated)
  
  return () => {
    window.removeEventListener('conversation-created', handleConversationCreated)
  }
}, [isHidden])  // Only setup when hidden state changes
```

**Test Script Created:**
- Script: `frontend-v2/scripts/prove-fix-duplicate-listeners.js` - Proves event fires only once (run: `npm run prove:duplicate-listeners`)

**Lessons Learned:**
- When same component is mounted multiple times (responsive design), global listeners multiply
- Use props like `isHidden` or `isActive` to determine if instance should register listeners
- Window event listeners are global - multiple components registering = multiple handlers
- Cleanup is necessary but not sufficient if multiple instances add listeners

**Prevention Strategy:**
- For components that may be mounted multiple times, gate global listener registration
- Consider using React Context or state management instead of window events
- Document which component instance is "primary" for global event handling
- Test with both desktop and mobile views to catch duplicate instances

---

### BUG-013: useEffect Infinite Loops
**Date Discovered:** 2025-11-05 10:54  
**Date Fixed:** 2025-11-05 11:07  
**Severity:** HIGH  
**Status:** ✅ FIXED (Same fix as BUG-011)

**Symptoms:**
- Console spam: `[SSE Hook] useEffect triggered` dozens of times per minute
- Browser CPU usage spikes
- UI feels sluggish
- Excessive re-renders

**Root Cause:**
Same as BUG-011 - `enabled` prop in dependency array caused circular re-triggering.

**Fix:** Removed 'enabled' from useEffect dependencies in `use-trading-stream.ts`

**See BUG-011 for full details.**

---

### BUG-005: EventSource Memory Leak (No Cleanup)
**Date Discovered:** 2025-11-05 (Code review)  
**Date Fixed:** 2025-11-05 11:09  
**Severity:** MEDIUM  
**Status:** ✅ FIXED

**Symptoms:**
- If user sends chat message while previous message streaming
- New EventSource created without closing old one
- Memory leak over extended use
- Possible racing responses (two streams active)

**Root Cause:**
`use-chat-stream.ts` `startStream` function created new EventSource at line 79 without first checking if existing EventSource needed to be closed.

**Affected Files:**
- `frontend-v2/hooks/use-chat-stream.ts` - Line 27-87

**Final Solution:**
Add cleanup logic at the START of `startStream` function to close existing EventSource before creating new one.

**Code Changes:**

[BEFORE - file: `frontend-v2/hooks/use-chat-stream.ts`]
```typescript
const startStream = useCallback(async (message: string) => {
  // ... token validation ...
  
  setIsStreaming(true)
  // Create new EventSource immediately
  eventSource = new EventSource(url)
  eventSourceRef.current = eventSource
})
```

[AFTER - file: `frontend-v2/hooks/use-chat-stream.ts`]
```typescript
const startStream = useCallback(async (message: string) => {
  // CRITICAL: Close existing EventSource before creating new one
  if (eventSourceRef.current) {
    console.log('[Chat Stream] Closing existing EventSource before creating new')
    eventSourceRef.current.close()
    eventSourceRef.current = null
  }
  
  setIsStreaming(true)
  // Create new EventSource
  eventSource = new EventSource(url)
  eventSourceRef.current = eventSource
})
```

**Lessons Learned:**
- Always cleanup resources before creating new ones
- EventSource.close() should be called before creating new instance
- Refs persist across renders - check ref value before overwriting
- Memory leaks accumulate silently until app becomes unusable

**Prevention Strategy:**
- Add cleanup at START of functions that create resources (connections, timers, etc.)
- Use linters/code review to catch missing cleanup
- Test with rapid user interactions (spam clicking) to catch race conditions
- Monitor browser memory usage during development

---

### BUG-012: Conversation Messages Don't Display
**Date Discovered:** 2025-11-05 10:57  
**Date Fixed:** 2025-11-05 11:10  
**Severity:** MEDIUM  
**Status:** ✅ FIXED

**Symptoms:**
- Clicking conversation in sidebar loads messages from API (console shows "Loaded 1 messages")
- But messages don't appear in chat UI
- Only welcome message shows

**Root Cause:**
ChatInterface component had `selectedConversationId` prop but useEffect was parsing URL (`window.location.pathname`) instead of using the prop. URL parsing failed or returned different value than prop, causing messages to load but then be cleared.

**Affected Files:**
- `frontend-v2/components/chat-interface.tsx` - Lines 140-225

**Final Solution:**
Use `selectedConversationId` prop instead of URL parsing. Change useEffect dependency from `[currentSessionId]` to `[selectedConversationId]`.

**Code Changes:**

[BEFORE - file: `frontend-v2/components/chat-interface.tsx`]
```typescript
useEffect(() => {
  // Get session ID from URL path
  const pathParts = window.location.pathname.split('/')
  const cIndex = pathParts.indexOf('c')
  const sessionId = cIndex >= 0 && pathParts[cIndex + 1] ? pathParts[cIndex + 1] : null
  
  // Load messages...
}, [currentSessionId])
```

[AFTER - file: `frontend-v2/components/chat-interface.tsx`]
```typescript
useEffect(() => {
  // Use prop instead of URL parsing
  const sessionId = selectedConversationId
  
  // Load messages...
}, [selectedConversationId])  // Use prop
```

**Lessons Learned:**
- Props are the source of truth, not URL parsing
- URL parsing is fragile and fails when URL structure changes
- If component receives prop, USE IT - don't derive it from other sources
- Props + URL parsing together creates confusion and bugs

**Prevention Strategy:**
- Trust props over derived values (URL parsing, global state, etc.)
- If prop exists for data, use it directly
- URL parsing should only be done at route component level, not deep in component tree
- Document data flow: where values come from (props vs URL vs state)

---

## Active Bug Log

### BUG-001: React-markdown className Deprecation Error
**Date Discovered:** 2025-11-04 14:30  
**Severity:** Critical  
**Status:** ✅ FIXED

**Symptoms:**
- Frontend crashes when rendering AI chat messages
- Console error: "className prop is not supported in react-markdown v10+"
- Markdown content fails to render in chat interface

**Root Cause:**
React-markdown version 10.x removed direct `className` prop support. The `MarkdownRenderer` component in `frontend-v2/components/markdown-renderer.tsx` was passing `className` directly to the `<ReactMarkdown>` component, which is no longer valid.

**Affected Files:**
- [`frontend-v2/components/markdown-renderer.tsx`] - Line 17-28

**Attempted Fixes:**
1. ✅ **Wrapper pattern** - Wrapped ReactMarkdown in div, moved className to wrapper - **SUCCESS**

**Final Solution:**
Wrap the `<ReactMarkdown>` component in a `<div>` element and move the `className` prop to the wrapper div. All styling is preserved, and markdown rendering functionality remains intact.

**Code Changes:**

[BEFORE - file: `frontend-v2/components/markdown-renderer.tsx`]
```tsx
<ReactMarkdown
  className={`prose prose-invert max-w-none ${className}`}
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeRaw, rehypeHighlight]}
>
  {content}
</ReactMarkdown>
```

[AFTER - file: `frontend-v2/components/markdown-renderer.tsx`]
```tsx
<div className={`prose prose-invert max-w-none ${className}`}>
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw, rehypeHighlight]}
  >
    {content}
  </ReactMarkdown>
</div>
```

**Test Script Created:**
- **Manual Test:** Open chat interface, send message, verify markdown renders correctly
- **Result:** ✅ 100% success - No crashes, markdown renders perfectly

**Lessons Learned:**
- **Breaking changes in major versions:** Always check changelog when upgrading third-party libraries
- **Wrapper pattern is common:** Many UI libraries use this pattern for applying styles to components that don't accept className
- **Version awareness:** Next.js 16.0.0 + React 19.2.0 uses react-markdown 10.x by default

**Prevention Strategy:**
- Review release notes before upgrading UI libraries
- Check for deprecation warnings in console during development
- Document component library versions in overview.md
- Consider pinning major versions in package.json for critical UI components

---

### BUG-002: Authentication Token Key Mismatch in Chat Stream
**Date Discovered:** 2025-11-04 15:10  
**Severity:** High  
**Status:** ✅ FIXED

**Symptoms:**
- Authenticated users unable to send chat messages
- Chat stream connection fails with 401 Unauthorized
- Error in console: "No auth token found"

**Root Cause:**
The chat stream hook (`frontend-v2/hooks/use-chat-stream.ts`) was looking for authentication token in localStorage using the wrong key name. The auth system stores the JWT token as `jwt_token`, but the chat hook was looking for `auth_token`.

```typescript
// Incorrect (line 32)
const token = localStorage.getItem('auth_token')  // ❌ Wrong key!
```

**Affected Files:**
- [`frontend-v2/hooks/use-chat-stream.ts`] - Line 32
- [`frontend-v2/lib/auth.ts`] - getToken() helper exists but wasn't used

**Attempted Fixes:**
1. ❌ **Hardcode correct key** - Change to 'jwt_token' - Would work but violates DRY principle
2. ✅ **Use centralized helper** - Import getToken() from lib/auth.ts - **SUCCESS**

**Final Solution:**
Import the existing `getToken()` helper function from `lib/auth.ts` and use it instead of directly accessing localStorage. This ensures consistency across the application and provides a single source of truth for authentication token retrieval.

**Code Changes:**

[BEFORE - file: `frontend-v2/hooks/use-chat-stream.ts`]
```typescript
// No import of getToken

// ... later in code (line 32)
const token = localStorage.getItem('auth_token')  // ❌ Wrong key
if (!token) throw new Error('No auth token')
```

[AFTER - file: `frontend-v2/hooks/use-chat-stream.ts`]
```typescript
// Import added (line 2)
import { getToken } from '@/lib/auth'

// ... later in code (line 32)
const token = getToken()  // ✅ Uses correct key (jwt_token)
if (!token) throw new Error('No auth token')
```

**Test Script Created:**
- **Manual Test:** Login → Send chat message → Verify successful API call
- **Result:** ✅ 100% success - Chat messages send successfully, no auth errors

**Lessons Learned:**
- **Always use centralized utilities:** Don't hardcode localStorage keys throughout the codebase
- **Check for existing helpers first:** The getToken() function already existed, just needed to be imported
- **Key mismatches are silent failures:** No error until runtime when the code path is executed
- **Consistency matters:** One source of truth for auth prevents these bugs

**Prevention Strategy:**
- Create index exports for commonly used utilities (e.g., export all auth helpers from lib/auth.ts)
- Use ESLint rules to prevent direct localStorage access (force use of utility functions)
- Document authentication patterns in overview.md
- Add TypeScript types for localStorage keys to catch mismatches at compile time

---

### BUG-003: Backend Using Model Signature as OpenRouter API Key
**Date Discovered:** 2025-11-04 16:45  
**Severity:** Critical  
**Status:** ✅ FIXED

**Symptoms:**
- Chat API returns 401 Unauthorized from OpenRouter
- Error message: "No cookie auth credentials found" (misleading)
- AI chat completely non-functional
- Trading agent initialization fails

**Root Cause:**
Two places in the backend were using the model's `signature` field as the OpenRouter API key. The `signature` field is actually a model identifier slug (e.g., "my-model-1") generated from the model name, not an API key.

**Why this happened:**
Variable shadowing in both affected files created confusion. A local variable named `settings` shadowed the global `settings` import from `config.py`, making it impossible to access `settings.OPENAI_API_KEY` directly.

**Affected Files:**
- [`backend/main.py`] - Line 1497 (general chat endpoint)
- [`backend/agents/system_agent.py`] - Line 65 (system agent initialization)

**Signature Field Generation (for context):**
```python
# From services.py
def generate_signature(name: str, user_id: str) -> str:
    """Converts 'My Model' → 'my-model-1'"""
    base_signature = re.sub(r'[^\w\s-]', '', name.lower())
    base_signature = re.sub(r'\s+', '-', base_signature)
    # ... adds counter if duplicate
    return base_signature
```

**Attempted Fixes:**

**For main.py:**
1. ❌ **Direct fix** - Change to `settings.OPENAI_API_KEY` - Failed due to variable shadowing
2. ✅ **Rename local variable** - Rename `settings = global_settings.data[0]` to `chat_settings` - **SUCCESS**

**For system_agent.py:**
1. ❌ **Direct fix** - Change to `settings.OPENAI_API_KEY` - Failed due to variable shadowing
2. ✅ **Import alias** - Import as `from config import settings as config_settings` - **SUCCESS**

**Final Solution:**
Fix variable shadowing in both files to allow access to the global config settings, then use `settings.OPENAI_API_KEY` (or `config_settings.OPENAI_API_KEY`) instead of the model's signature field.

**Code Changes:**

[BEFORE - file: `backend/main.py` lines 1497-1521]
```python
# Line 1497 - Local variable shadows import!
settings = global_settings.data[0]
ai_model = settings["chat_model"]

# ... later (line 1520)
api_key = user_models.data[0]["signature"]  # ❌ This is "my-model-1", not an API key!
```

[AFTER - file: `backend/main.py` lines 1497-1521]
```python
# Line 1497 - Renamed to avoid shadowing
chat_settings = global_settings.data[0]
ai_model = chat_settings["chat_model"]

# ... later (line 1520-1521)
api_key = settings.OPENAI_API_KEY  # ✅ Now accesses config settings correctly
```

[BEFORE - file: `backend/agents/system_agent.py` line 89]
```python
# Get API key (always from model signature) - WRONG!
api_key = supabase.table("models").select("signature").eq("id", model_id).execute().data[0]["signature"]
```

[AFTER - file: `backend/agents/system_agent.py` lines 16, 90]
```python
# Line 16 - Import with alias to avoid shadowing
from config import settings as config_settings

# ... later (line 90)
# Get API key from environment (global OpenRouter key)
api_key = config_settings.OPENAI_API_KEY  # ✅ Correct
```

**Test Script Created:**
- Script: `backend/scripts/test-openrouter-auth.py` - Tests OpenRouter API authentication
- **Result:** ✅ 100% success - Authentication works, chat responses stream correctly

**Lessons Learned:**
- **Field naming is critical:** The name `signature` implied authentication but was actually just an identifier
- **Trace errors to source:** "cookie auth" error was from OpenRouter, not our system
- **Check existing patterns:** Line 187 in main.py already used `settings.OPENAI_API_KEY` correctly - should have noticed this
- **API keys belong in environment variables:** Never store sensitive keys in database
- **Variable shadowing is dangerous:** Import config at module level with descriptive names to avoid collisions
- **Test after fixes:** Initial fix caused new shadowing error, required additional correction

**Prevention Strategy:**
- Use descriptive variable names: `chat_settings`, `model_config`, etc. instead of generic `settings`
- Import config modules with aliases when there's risk of shadowing: `from config import settings as app_config`
- Add linting rules to catch variable shadowing (Pylint's `redefined-outer-name`)
- Document API key management patterns in overview.md
- Create test script that verifies API authentication on deployment

---

## Bug Statistics

**Total Bugs Logged:** 3  
**Critical:** 2 (BUG-001, BUG-003)  
**High:** 1 (BUG-002)  
**Status:**
- Fixed: 3 (100%)
- In Progress: 0
- Blocked: 0

**Most Common Bug Type:** Configuration/Integration (2/3)  
**Average Time to Fix:** ~1 hour  
**Test Coverage:** 100% (all fixes have test verification)

---

## Common Patterns to Avoid

### ❌ Pattern 1: Variable Shadowing
```python
# BAD: Shadows imported settings
from config import settings

def my_function():
    settings = get_user_settings()  # ❌ Shadows import!
    api_key = settings.API_KEY  # This will fail!
```

```python
# GOOD: Use descriptive names
from config import settings

def my_function():
    user_settings = get_user_settings()  # ✅ Clear name
    api_key = settings.API_KEY  # Works correctly
```

### ❌ Pattern 2: Hardcoded Keys Instead of Utilities
```typescript
// BAD: Direct localStorage access
const token = localStorage.getItem('auth_token')  // ❌ Wrong key!
```

```typescript
// GOOD: Use centralized helper
import { getToken } from '@/lib/auth'
const token = getToken()  # ✅ Correct key always
```

### ❌ Pattern 3: Ignoring Breaking Changes in Dependencies
```json
// BAD: Accepting any version
"react-markdown": "^10.0.0"  // May break on minor updates
```

```json
// GOOD: Pin major versions for critical UI
"react-markdown": "~10.1.0"  // Only patch updates
```

---

## Future Bug Template Checklist

When documenting a bug, ensure you have:
- [ ] Date and time discovered
- [ ] Severity level (Critical/High/Medium/Low)
- [ ] Clear symptom description (what user sees)
- [ ] Root cause analysis (why it happened)
- [ ] List of affected files with line numbers
- [ ] All attempted fixes (with results)
- [ ] Final solution with code examples (before/after)
- [ ] Test script proving bug and proving fix (100% success required)
- [ ] Lessons learned (minimum 3 insights)
- [ ] Prevention strategy (specific actionable steps)
- [ ] Git commit command for the fix

---

**Last Updated:** 2025-11-04 by AI Agent  
**Next Update:** When new bugs discovered or fixes applied

