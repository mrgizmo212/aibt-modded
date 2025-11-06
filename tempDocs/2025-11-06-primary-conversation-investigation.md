# Investigation: How Primary Conversation is Set Up

**Date:** 2025-11-06 20:00  
**Request:** User asked to investigate how "primary conversation" is set up  
**Status:** Investigation complete - NO CHANGES MADE

---

## Summary

**There is NO explicit "primary conversation" concept in the codebase.**

Instead, the system uses an **"active conversation"** approach with the `is_active` flag on chat sessions. Each user can have ONE active conversation per context (general chat, or per model).

---

## Database Schema

### `chat_sessions` Table Structure

```sql
CREATE TABLE public.chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),           -- Direct user ownership
  model_id INT REFERENCES models(id),               -- NULL for general, INT for model-specific
  run_id INT REFERENCES trading_runs(id),           -- NULL for conversations, INT for run-specific
  
  session_title TEXT,                                -- "New conversation", "Model X Discussion", etc.
  is_active BOOLEAN DEFAULT true,                    -- ← This is the "primary" indicator
  
  conversation_summary TEXT,                         -- AI-generated summary (>60 messages)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);
```

**Key Fields:**
- `is_active` - **This is what determines the "primary" or "active" conversation**
- `model_id` - NULL = general conversation, INT = model-specific conversation
- `user_id` - Direct ownership (no need to join through models table)

---

## How "Active" (Primary) Conversation Works

### 1. **Three Conversation Contexts:**

**General Conversations:**
- `model_id = NULL`
- `run_id = NULL`
- User can have ONE active general conversation

**Model Conversations:**
- `model_id = 184` (for example)
- `run_id = NULL`
- User can have ONE active conversation **per model**

**Run Conversations:**
- `model_id = 184`
- `run_id = 42`
- User can have ONE active conversation **per run**

---

## Code Flow: How Sessions Are Created

### Function: `get_or_create_session_v2()`

**Location:** `backend/services/chat_service.py` lines 169-263

**Logic:**

```python
async def get_or_create_session_v2(
    user_id: str,
    model_id: Optional[int] = None,
    run_id: Optional[int] = None,
    session_id: Optional[int] = None
) -> Dict:
```

**Step 1: If session_id provided (resuming existing conversation)**
```python
if session_id:
    # Fetch specific session by ID
    result = supabase.table("chat_sessions")\
        .select("*")\
        .eq("id", session_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if result.data:
        return result.data[0]
```

**Step 2: Try to get ACTIVE session for this context**
```python
# Try to get active session
query = supabase.table("chat_sessions")\
    .select("*")\
    .eq("user_id", user_id)\
    .eq("is_active", True)  # ← ONLY fetch active session

if model_id is not None:
    query = query.eq("model_id", model_id)
else:
    query = query.is_("model_id", "null")

if run_id is not None:
    query = query.eq("run_id", run_id)
else:
    query = query.is_("run_id", "null")

result = query.execute()

if result.data:
    return result.data[0]  # ← Returns the ONE active session
```

**Step 3: Create new session if none exists**
```python
# Create new session
new_session = supabase.table("chat_sessions").insert({
    "user_id": user_id,
    "model_id": model_id,
    "run_id": run_id,
    "session_title": session_title,
    "is_active": True,  # ← New sessions are active by default
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}).execute()
```

---

## When "Active" Status Changes

### Starting a New Conversation

**Function:** `start_new_conversation()` - lines 303-329

**Logic:**
1. **Mark ALL current active sessions as inactive** (for this context)
2. **Create new session with `is_active = True`**

```python
# Mark current active session(s) as inactive
update_query = supabase.table("chat_sessions")\
    .update({"is_active": False})\
    .eq("user_id", user_id)\
    .eq("is_active", True)

if model_id is not None:
    update_query = update_query.eq("model_id", model_id)
else:
    update_query = update_query.is_("model_id", "null")

update_query.execute()

# Create new active session
return await get_or_create_session_v2(user_id, model_id=model_id)
```

**Result:** Old conversation becomes inactive, new conversation becomes active.

---

### Resuming an Old Conversation

**Function:** `resume_conversation()` - lines 332-373

**Logic:**
1. **Deactivate all OTHER active sessions** (for this context)
2. **Mark THIS session as active**

```python
# Get the session
session = await get_or_create_session_v2(user_id, session_id=session_id)

model_id = session.get("model_id")

# Deactivate current active sessions for this context
update_query = supabase.table("chat_sessions")\
    .update({"is_active": False})\
    .eq("user_id", user_id)\
    .eq("is_active", True)\
    .neq("id", session_id)  # ← Don't deactivate THIS session

# Apply model_id filter
if model_id is not None:
    update_query = update_query.eq("model_id", model_id)
else:
    update_query = update_query.is_("model_id", "null")

update_query.execute()

# Mark this session as active
result = supabase.table("chat_sessions")\
    .update({"is_active": True, "updated_at": datetime.now().isoformat()})\
    .eq("id", session_id)\
    .execute()
```

**Result:** Selected conversation becomes active, others become inactive.

---

## How `/api/chat/general-stream` Uses This

**Location:** `backend/main.py` lines 2016-2022

```python
from services.chat_service import get_or_create_session_v2

# Get or create conversation session (general or model-specific)
session = await get_or_create_session_v2(
    user_id=current_user["id"],
    model_id=model_id  # ← None for general, 184 for model-specific
)
conversation_summary = session.get("conversation_summary")
```

**What happens:**
1. If user has an **active** session for this context → Use it
2. If no active session exists → Create new one (automatically becomes active)

**This means:**
- General chat always uses the ONE active general conversation
- Model 184 chat always uses the ONE active model 184 conversation
- User never explicitly selects conversation - system uses active one

---

## Key Insights

### 1. **No "Primary" Flag - Only "Active" Flag**

There's no `is_primary` field. The `is_active` field serves this purpose.

### 2. **One Active Conversation Per Context**

- User Adam has ONE active general conversation
- User Adam has ONE active model 184 conversation  
- User Adam has ONE active model 182 conversation
- User Adam has ONE active run #5 conversation

**These are all SEPARATE "active" conversations - they don't conflict.**

### 3. **Automatic Context Switching**

When you:
- Navigate to `/new` → Uses active general conversation
- Navigate to `/m/184/new` → Uses active model 184 conversation
- Navigate to `/c/80` → Resumes conversation 80 (makes it active)

### 4. **Old Conversations Are NOT Deleted**

When you start a new conversation:
- Old conversation is marked `is_active = FALSE`
- Messages are preserved
- You can resume it later

---

## Database Indexes

**Performance optimizations for active session lookups:**

```sql
-- Index for fetching user's active sessions
CREATE INDEX idx_chat_sessions_user_active 
  ON public.chat_sessions(user_id, is_active);

-- Index for fetching user's general conversations (model_id IS NULL)
CREATE INDEX idx_chat_sessions_user_general
  ON public.chat_sessions(user_id) WHERE model_id IS NULL;

-- Index for fetching model-specific conversations
CREATE INDEX idx_chat_sessions_user_model
  ON public.chat_sessions(user_id, model_id) WHERE model_id IS NOT NULL;
```

These make active session lookups fast, even with thousands of conversations.

---

## Migration History

**Migration 014:** `backend/migrations/014_chat_system.sql`
- Created initial `chat_sessions` and `chat_messages` tables
- Required `model_id` (conversations tied to models only)

**Migration 015:** `backend/migrations/015_multi_conversation_support.sql`
- Made `model_id` nullable (enabled general conversations)
- Added `user_id` column (direct ownership)
- Added `is_active` flag (track active conversation)
- Added `conversation_summary` field (for long histories)
- Removed UNIQUE constraint (allow multiple conversations per model)

**Migration 018:** `backend/migrations/018_add_conversation_summary.sql`
- Ensured `conversation_summary` column exists

---

## Frontend Integration

**How frontend knows which conversation to load:**

1. **User sends message** → Frontend calls `/api/chat/general-stream?model_id=184`
2. **Backend uses `get_or_create_session_v2()`** → Returns active session
3. **Backend returns `session_id` in response** → e.g., session 80
4. **Frontend navigates to `/m/184/c/80`** → Shows conversation in URL
5. **User returns later** → Frontend loads conversation 80 via URL

**Key files:**
- `frontend-v2/app/m/[modelId]/c/[conversationId]/page.tsx` - Model conversation route
- `frontend-v2/app/c/[conversationId]/page.tsx` - General conversation route

---

## Conclusion

**"Primary conversation" = "Active conversation" = `is_active = TRUE`**

The system:
- ✅ Maintains ONE active conversation per context (general, per model, per run)
- ✅ Auto-selects active conversation when user sends message
- ✅ Allows resuming old conversations (switches active status)
- ✅ Never deletes old conversations (just marks inactive)
- ✅ Uses database indexes for fast active session lookups

**This is a clean, simple design that works well for multi-conversation support.**

---

**Investigation completed - NO ISSUES FOUND**
