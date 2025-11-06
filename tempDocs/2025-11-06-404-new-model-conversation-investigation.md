# 404 on New Model Conversation - Investigation

**Date:** 2025-11-06  
**Branch:** `cursor/fix-404-on-new-model-conversation-0ded`  
**Issue:** User gets 404 error when creating new model conversation at URL `/m/184/c/79`

---

## Root Cause Identified ✅

**The Problem:**
Multiple files are trying to navigate to `/m/[modelId]/c/[conversationId]` route, but this route PAGE DOES NOT EXIST in the filesystem.

**Evidence:**

Files attempting navigation to missing route:
1. `frontend-v2/app/new/page.tsx` - Line 259: `router.push(\`/m/${modelId}/c/${sessionId}\`)`
2. `frontend-v2/app/m/[modelId]/new/page.tsx` - Lines 135, 151, 191
3. `frontend-v2/app/page.tsx` - Lines 147, 193

**Current Route Structure:**
```
/app
├── page.tsx                     ← Root page (exists)
├── new/page.tsx                 ← New general conversation (exists)
├── m/[modelId]/new/page.tsx     ← New model conversation (exists)
├── c/[conversationId]/page.tsx  ← General conversation detail (MISSING ❌)
└── m/[modelId]/c/[conversationId]/page.tsx  ← Model conversation detail (MISSING ❌)
```

**Why it's 404:**
When a new conversation is created, the code calls:
```typescript
router.replace(`/m/${modelId}/c/${sessionId}`)
```

But Next.js can't find the page component at that path → 404 error

---

## Solution

**Create TWO missing route pages:**

1. `/app/m/[modelId]/c/[conversationId]/page.tsx` - Model-specific conversation view
2. `/app/c/[conversationId]/page.tsx` - General conversation view (for conversations without model)

Both pages should:
- Extract route params (modelId, conversationId)
- Load conversation from database
- Display ChatInterface with conversation data
- Show NavigationSidebar and ContextPanel
- Handle authentication

**Base Template:**
Use `/app/m/[modelId]/new/page.tsx` as reference (lines 1-225) but:
- Change from `isEphemeral={true}` to `isEphemeral={false}`
- Pass `conversationId` to ChatInterface
- Load conversation messages on mount

---

## Investigation Notes

**Previous Context from /tempDocs:**
- 2025-11-05: Frontend comprehensive testing revealed 7 bugs (SSE auth, polling, memory leaks)
- BUG-007 was fixed (SSE authentication with OpenRouter headers)
- Most features working but conversation navigation not tested

**This Bug:**
- Not documented in previous sessions
- Likely existed since two-level conversation system was implemented
- Only happens when creating NEW conversations (existing ones might work if navigated differently)

---

## Next Steps

1. ✅ Identified root cause
2. ✅ Create `/app/m/[modelId]/c/[conversationId]/page.tsx`
3. ✅ Create `/app/c/[conversationId]/page.tsx`
4. ✅ Test navigation flow (13/13 tests pass)
5. ✅ Update documentation

---

## Fix Complete ✅

**Files Created:**
1. `/workspace/frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx` - 243 lines
2. `/workspace/frontend-v2/app/c/[conversationId]/page.tsx` - 231 lines
3. `/workspace/scripts/verify-conversation-routes.js` - Test script

**Test Results:**
- All 13 tests passed ✅
- Route pages exist ✅
- Proper structure confirmed ✅
- useParams() extracts IDs correctly ✅
- ChatInterface receives conversationId ✅
- isEphemeral={false} set correctly ✅

**Documentation Updated:**
- `/docs/bugs-and-fixes.md` - Added BUG-015 with full details

**Status:** ✅ COMPLETE - Ready for user testing in browser
