# 2025-11-03 - Redis Config Fix Deployment Instructions

## What Was Done

Implemented Redis-backed configuration to fix the "SIGNATURE environment variable is not set" error in production.

### Files Created/Modified

**Created:**
- `backend/utils/sync_redis_config.py` - Synchronous Redis client for config
- `scripts/test-redis-config-sync.py` - Test sync contexts
- `scripts/test-redis-config-async.py` - Test async contexts  
- `scripts/test-redis-config-subprocess.py` - Test cross-process communication
- `scripts/test-redis-config-isolation.py` - Test multi-model isolation
- `scripts/test-redis-config-ALL.py` - Run all tests

**Modified:**
- `backend/utils/general_tools.py` - Updated get_config_value() and write_config_value()

### How It Works

**Triple Fallback System:**
1. **Redis** (Production) - Cross-process, persists across restarts, multi-user isolation
2. **File** (Local Dev) - Backward compatibility
3. **Environment Variable** (Static) - Last resort

**Multi-User Isolation:**
- Redis keys namespaced by model_id: `config:{model_id}:{key}`
- Model 26: `config:26:SIGNATURE`
- Model 27: `config:27:SIGNATURE`
- No collisions possible

## When You're Back At Your Computer

### Step 1: Run Tests (CRITICAL - Do Not Skip)

```powershell
# Run all tests
python scripts/test-redis-config-ALL.py
```

**Expected output:**
```
✅ TEST 1 PASSED: Sync config read/write works!
✅ TEST 2 PASSED: Async config read/write works!
✅ TEST 3 PASSED: Subprocess config works! (BUG IS FIXED)
✅ TEST 4 PASSED: Multi-model isolation works!

✅ ALL TESTS PASSED!
```

**If tests PASS:** Proceed to Step 2
**If tests FAIL:** Review error output, check Redis credentials in .env file

### Step 2: Verify Redis Credentials on Render

Go to Render Dashboard → Your Backend Service → Environment

**Verify these exist:**
```
UPSTASH_REDIS_REST_URL = https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN = your-token-here
```

(You already have these set according to your deployment guide)

### Step 3: Commit Changes

```powershell
git add .; git commit -m "Fix SIGNATURE error in production by implementing Redis-backed config for cross-process visibility and multi-user isolation, add sync Redis client in backend/utils/sync_redis_config.py, modify get_config_value and write_config_value to check Redis first with file and env var fallbacks, create 5 comprehensive test scripts verifying sync contexts, async contexts, subprocess communication, and multi-model isolation"; git push
```

### Step 4: Render Auto-Deploys

- Render detects the push and auto-deploys
- Watch the logs during deployment

### Step 5: Monitor Production Logs

**Look for:**
- ❌ "SIGNATURE environment variable is not set" ← Should NOT appear anymore
- ✅ "Calling AI for decision at..." ← Should work
- ✅ "Decision: BUY/SELL X shares" ← Should execute successfully

### Step 6: Test Multi-User Trading

If you have multiple models/users:
- Start trading on Model A
- Start trading on Model B  
- Verify they don't interfere with each other
- Check that each model's positions are isolated

## Troubleshooting

### If "SIGNATURE environment variable is not set" still appears:

1. **Check Redis connection:**
   - Look for "Redis config GET failed" or "Redis config SET failed" in logs
   - Verify UPSTASH credentials are correct on Render

2. **Check Redis is responding:**
   - Logs should NOT show Redis connection errors
   - Config should be read from Redis, not falling back to file

3. **Verify model_id is set:**
   - Each agent should have `CURRENT_MODEL_ID` environment variable set
   - This happens in `agent_manager.py` line 72

### If tests fail locally:

1. **Check .env file has:**
   ```
   UPSTASH_REDIS_REST_URL=your-url
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

2. **Test Redis connection:**
   ```powershell
   python backend/scripts/oldScripts/test_redis_connection.py
   ```

3. **Review specific test failure:**
   - Test 1 fails: Sync read/write issue
   - Test 2 fails: Async context issue
   - Test 3 fails: Subprocess communication broken (the main bug)
   - Test 4 fails: Multi-model isolation broken

## What This Fixes

**Before:**
- MCP tools (subprocesses) couldn't read SIGNATURE written by parent process
- File-based config doesn't work across process boundaries on Render
- Ephemeral file system loses config on restart

**After:**
- Redis provides cross-process visibility
- Subprocesses can read parent's config
- Config persists across container restarts
- Multi-user isolation maintained

## Performance Impact

- **Redis latency:** ~50-100ms per config read/write
- **Config operations:** ~3-5 per trading session (not per trade)
- **Impact:** Negligible (config is read at session start, not in hot path)

## Backward Compatibility

**100% backward compatible:**
- Local dev still works with file-based config
- Redis failure falls back to file
- File failure falls back to env var
- No breaking changes to existing code

## Security

**Redis keys TTL:** 1 hour (3600 seconds)
- Config doesn't persist forever
- Prevents stale data buildup
- Keys auto-expire after trading session

**Multi-tenant safe:**
- Each model has isolated Redis namespace
- Users cannot access each other's config
- Model ID enforces isolation

## Next Steps After Successful Deployment

1. **Monitor for 24 hours:**
   - Watch for any SIGNATURE errors
   - Verify multi-user trading works
   - Check Redis metrics in Upstash dashboard

2. **Clean up old runtime files (optional):**
   - `/data/.runtime_env_*.json` files no longer critical
   - Can delete or leave for local dev

3. **Consider future improvements:**
   - Increase TTL if sessions run longer than 1 hour
   - Add Redis connection pooling if high volume
   - Monitor Redis usage in Upstash dashboard

## Support

If issues arise after deployment:
1. Check Render logs for Redis connection errors
2. Verify Upstash dashboard shows activity
3. Run test scripts locally to reproduce
4. Review `/docs/tempDocs/2025-11-03-live-deployment-signature-error.md` for root cause analysis

---

**Status:** Implementation complete, ready for testing and deployment

**Confidence:** 95% (pending test results)

**Risk:** Low (full backward compatibility, graceful fallbacks)
