# How To Revert Redis Config Changes

## Quick Revert (30 seconds)

If you need to undo the Redis config changes, just restore ONE file:

### Step 1: Copy the backup
```powershell
Copy-Item backend/utils/general_tools.py.BACKUP backend/utils/general_tools.py
```

### Step 2: Commit and push
```powershell
git add backend/utils/general_tools.py
git commit -m "Revert to file-based config (disable Redis config)"
git push
```

That's it! System will work exactly as before.

---

## What Gets Reverted

✅ Config reads from files only (no Redis)
✅ Old behavior restored completely
✅ No other files affected

---

## Optional: Remove New Files

These are NOT needed for revert, but you can clean them up:

```powershell
# Delete new Redis client
Remove-Item backend/utils/sync_redis_config.py

# Delete test scripts
Remove-Item scripts/test-redis-config-*.py
```

---

## Files Changed Summary

**MODIFIED (need to revert):**
- `backend/utils/general_tools.py` - Only this matters

**NEW (can delete or ignore):**
- `backend/utils/sync_redis_config.py`
- `scripts/test-redis-config-sync.py`
- `scripts/test-redis-config-async.py`
- `scripts/test-redis-config-subprocess.py`
- `scripts/test-redis-config-isolation.py`
- `scripts/test-redis-config-ALL.py`

---

## The Backup File

Original `general_tools.py` is saved at:
- `backend/utils/general_tools.py.BACKUP`

This file has the OLD version (before Redis changes).
