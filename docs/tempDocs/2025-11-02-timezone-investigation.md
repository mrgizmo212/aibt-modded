# Timezone Conversion Bug Investigation

**Date:** 2025-11-02 15:30  
**Status:** 🔍 INVESTIGATING

---

## 🐛 BUG REPORT

Only 18.8% of cached bars are being retrieved (3 out of 16 test times).

### Evidence from Terminal:

**Caching:**
```
  ✅ Cached 09:30 (bar 1/261)
  ✅ Cached 09:31 (bar 2/261)
  ...
  ✅ Cached 19:55 (bar 257/261)
  ✅ Cached 19:56 (bar 258/261)
  ✅ Cached 19:57 (bar 259/261)
  ✅ Cached 19:58 (bar 260/261)
  ✅ Cached 19:59 (bar 261/261)
```

**Retrieval:**
```
  ✅ 09:30: Found
  ✅ 09:45: Found
  ❌ 10:00: Missing
  ❌ 10:30: Missing
  ... (most missing)
  ✅ 15:59: Found
```

**Success Rate: 18.8% (3/16 found)**

---

## 🔬 ROOT CAUSE ANALYSIS

### The Issue:

Bars cached at "19:55" - "19:59" (UTC times) but should be "15:55" - "15:59" (EDT times).

Market closes at 4:00 PM EDT (16:00), which is 20:00 UTC. Last trading minute is 15:59 EDT = 19:59 UTC.

If caching stores as "19:59" but retrieval looks for "15:59", **cache miss!**

### The Old Bug:

```python
# OLD CODE (WRONG):
ts_edt = ts_utc + edt_offset  # Just shifts time, keeps UTC timezone
minute_str = ts_edt.strftime('%H:%M')
```

Problem: `datetime + timedelta` shifts the TIME but keeps the TIMEZONE as UTC. This creates semantically incorrect datetimes.

---

## ✅ THE FIX

**File:** `backend/intraday_loader.py` lines 242-249

```python
# NEW CODE (CORRECT):
ts_utc = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)

# Create EDT timezone (UTC-4)
edt_tz = timezone(timedelta(hours=-4))

# Convert to EDT
ts_edt = ts_utc.astimezone(edt_tz)
minute_str = ts_edt.strftime('%H:%M')
```

**Why this works:**
- `astimezone()` properly converts timezone-aware datetimes
- Changes BOTH the time AND the timezone
- Result: 19:59 UTC → 15:59 EDT ✓

---

## 🧪 TEST RESULTS

Created test script: `scripts/test-datetime-repr.py`

**Result:**
```
ts_utc = 2025-10-15 19:36:00+00:00
ts_edt = 2025-10-15 15:36:00-04:00
ts_edt.strftime('%H:%M') = '15:36'
```

**✅ Conversion works correctly!**
- UTC 19:36 → EDT 15:36
- The `astimezone()` fix is correct

---

## 🎯 NEXT STEPS

1. **RE-RUN the data loading** with the current code
2. **Verify cache keys** are now in EDT (15:55-15:59, not 19:55-19:59)
3. **Test retrieval** to confirm 100% success rate

The terminal output shown was likely from the OLD code before the fix.

**Command to test:**
```powershell
cd backend
python -c "import asyncio; from intraday_loader import load_intraday_session; asyncio.run(load_intraday_session(169, ['AAPL'], '2025-10-15', 'regular'))"
```

---

## 📋 FILES MODIFIED

- `backend/intraday_loader.py` - Fixed timezone conversion (lines 242-249)

---

## 🔑 KEY LEARNINGS

1. **Never use `datetime + timedelta` for timezone conversion**
   - Only shifts time, doesn't change timezone
   - Use `astimezone()` instead

2. **Timezone-aware datetimes must use proper conversion methods**
   - `astimezone()` handles both time AND timezone
   - Creates semantically correct results

3. **Cache keys must match between storage and retrieval**
   - Both must use same timezone (EDT)
   - Mismatch = cache miss

---

**STATUS:** Fix implemented, awaiting re-test to confirm 100% retrieval success.

