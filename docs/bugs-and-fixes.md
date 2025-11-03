# Bugs and Fixes

## 2025-11-03 - SIGNATURE Environment Variable Error (Production)

### Bug Description
**Severity:** Critical  
**Environment:** Render production deployment  
**Symptom:** "AI decision failed: Error calling tool 'sell': SIGNATURE environment variable is not set, defaulting to HOLD"

**Impact:**
- AI trading decisions fail
- All trades default to HOLD
- Multi-user trading broken

### Root Cause

**Architecture Mismatch:**
1. Backend uses file-based config: `/data/.runtime_env_{model_id}.json`
2. MCP tools run as subprocesses (separate processes)
3. Render has ephemeral file system
4. Subprocesses cannot reliably read parent process's written files

**Why it worked locally but failed on Render:**
- **Local:** Files persist across runs, subprocesses share file system
- **Render:** Ephemeral containers, cross-process file access unreliable, files wiped on restart

**Multi-User Impact:**
- Using global env var would cause data collisions
- User A and User B would overwrite each other's SIGNATURE
- Leads to wrong position files being accessed

### Solution Implemented

**Redis-Backed Configuration with Triple Fallback:**

1. **Created:** `backend/utils/sync_redis_config.py`
   - Synchronous Redis client (works in sync and async contexts)
   - Uses httpx.Client (not AsyncClient)
   - Namespaced keys: `config:{model_id}:{key}`

2. **Modified:** `backend/utils/general_tools.py`
   - `get_config_value()`: Redis → File → Env var (triple fallback)
   - `write_config_value()`: Writes to both Redis AND file

**How It Works:**
- Parent process writes SIGNATURE to Redis
- Subprocess reads SIGNATURE from Redis (cross-process visibility)
- Each model has isolated namespace (multi-user safe)
- 1-hour TTL prevents stale data

**Backward Compatibility:**
- ✅ File fallback for local dev
- ✅ Env var fallback for static config
- ✅ Graceful degradation if Redis down
- ✅ No breaking changes

### Test Coverage

Created 5 comprehensive test scripts:
1. `test-redis-config-sync.py` - Sync contexts (MCP tools)
2. `test-redis-config-async.py` - Async contexts (BaseAgent)
3. `test-redis-config-subprocess.py` - Cross-process communication ⭐
4. `test-redis-config-isolation.py` - Multi-model isolation ⭐
5. `test-redis-config-ALL.py` - Runs all tests

**Critical tests:**
- ✅ Subprocess can read parent's config (fixes production bug)
- ✅ Model 26 and Model 27 don't interfere (multi-user safe)

### Files Changed

**Created:**
- `backend/utils/sync_redis_config.py` (160 lines)
- `scripts/test-redis-config-*.py` (5 test files)

**Modified:**
- `backend/utils/general_tools.py` - Updated config functions

### Deployment Requirements

**Environment Variables (Already Set):**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Testing Before Deploy:**
```powershell
python scripts/test-redis-config-ALL.py
```

**Expected:** All 4 tests pass with 100% success

### Verification Steps

**After Deployment:**
1. Monitor Render logs for "SIGNATURE environment variable is not set" (should NOT appear)
2. Verify AI makes actual BUY/SELL decisions (not just HOLD)
3. Test multi-user trading (models don't interfere)
4. Check Upstash dashboard for Redis activity

### Lessons Learned

1. **Cross-process communication:** File-based config doesn't work reliably across subprocesses on cloud platforms
2. **Ephemeral file systems:** Cloud platforms like Render wipe files on restart
3. **Multi-user architecture:** Global env vars break isolation in multi-tenant systems
4. **Async/sync mixing:** Need separate sync Redis client for contexts that can't use await
5. **Architecture assumptions:** Local dev architecture may not work in production without modifications

### Alternative Solutions Considered

**Option 1: Global SIGNATURE env var**
- ❌ Breaks multi-user isolation
- ❌ Data collisions between users
- ✅ Quick fix (5 minutes)

**Option 2: Redis-backed config (CHOSEN)**
- ✅ Preserves multi-user isolation
- ✅ Cross-process visibility
- ✅ Production-ready
- ⚠️ Requires testing (1 hour)

**Option 3: Pass SIGNATURE as parameter**
- ✅ Best architecture (explicit dependencies)
- ⚠️ Requires refactoring MCP tool signatures
- ⚠️ Extensive code changes

### Prevention Strategy

**For future features:**
1. Always consider subprocess communication requirements
2. Test cross-process scenarios locally (use test scripts)
3. Assume ephemeral file systems in cloud
4. Use Redis or database for shared state
5. Never assume global env vars are safe for multi-user

**Architecture guidelines:**
- Cross-process state → Redis/Database
- Single-process state → In-memory/File
- Static config → Environment variables
- Dynamic config → Redis with TTL

### Related Documentation

- `/docs/tempDocs/2025-11-03-live-deployment-signature-error.md` - Detailed root cause analysis
- `/docs/tempDocs/2025-11-03-redis-implementation-analysis.md` - Implementation analysis
- `/docs/tempDocs/2025-11-03-DEPLOYMENT-INSTRUCTIONS.md` - Deployment guide

---

**Status:** Implemented, awaiting test verification and deployment

**Date:** 2025-11-03  
**Fixed By:** AI Agent with user collaboration  
**Confidence:** 95% (pending test results)
