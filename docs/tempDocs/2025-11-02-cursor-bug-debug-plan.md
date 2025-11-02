# AAPL Cursor Bug - Debugging Plan

**Date:** 2025-11-02  
**Agent:** Current debugging session  
**Status:** 🔬 Investigation plan created

---

## 🎯 THE BUG

**AAPL cursor doesn't advance during Polygon API pagination**

- AAPL: Cursor `YXA9MTA4NzE2NDAmYXM9...` identical across all 50 pages
- IBM: Cursor advances correctly on each page
- Result: AAPL only gets first 6 minutes of data (50k trades), IBM gets full day (264 minutes)

---

## 🧠 HYPOTHESIS (from Sequential Thinking analysis)

**Most likely cause:** Polygon API cursor logic breaks for high-volume symbols when massive trades exist in narrow time windows.

**Why:**
- AAPL has 50k trades in just 6 minutes (09:30-09:35) on Oct 21
- Cursor might encode "give me more from this time range"
- But there IS no more data in those 6 minutes
- So cursor returns same page repeatedly
- IBM has lower volume, cursor advances through time correctly

**Alternative possibilities:**
1. Proxy caching/routing issue
2. Cursor encoding/decoding bug in our code
3. Date-specific Polygon API issue
4. Symbol-specific Polygon routing (tape 3 vs tape 1)

---

## 🧪 DEBUGGING APPROACH

Created 2 test scripts to PROVE the issue and test solutions:

### **Script 1: `scripts/prove-cursor-bug.py`**

**Purpose:** Prove that AAPL cursor is stuck, IBM cursor works

**What it does:**
1. Fetches first 5 pages of AAPL trades
2. Logs EXACT cursor value on each page
3. Fetches first 5 pages of IBM trades
4. Logs EXACT cursor value on each page
5. Compares: Are cursors identical or different?
6. Checks: Are trades duplicates or new data?

**Expected result:**
- AAPL: All 5 cursors identical → BUG CONFIRMED
- IBM: All 5 cursors different → Working correctly

**How to run:**
```powershell
cd scripts
python prove-cursor-bug.py
```

---

### **Script 2: `scripts/test-timestamp-pagination.py`**

**Purpose:** Test alternative pagination using timestamps instead of cursors

**What it does:**
1. Fetches page 1 with `timestamp.gte = session_start`
2. Gets last trade's timestamp from page 1
3. Fetches page 2 with `timestamp.gte = last_timestamp + 1 nanosecond`
4. Repeats for 10 pages
5. Tests both AAPL and IBM

**Expected result:**
- If AAPL gets 100+ minutes: ✅ Timestamp pagination WORKS!
- If AAPL still gets 6 minutes: ❌ Issue is more fundamental

**How to run:**
```powershell
cd scripts
python test-timestamp-pagination.py
```

---

## 🔧 SOLUTION OPTIONS (based on test results)

### **If timestamp pagination works:**

**IMPLEMENT:** Replace cursor-based pagination in `backend/intraday_loader.py`

```python
# Current (lines 76-96): Uses cursor from next_url
# Replace with: Use last trade timestamp + 1 nanosecond

current_start = start_nano
while current_start < end_nano and page < max_pages:
    params = {
        "timestamp.gte": current_start,
        "timestamp.lte": end_nano,
        "limit": 50000,
        "order": "asc"
    }
    
    # Fetch page...
    
    # Set next start to last trade + 1
    if trades:
        last_ts = trades[-1]['participant_timestamp']
        current_start = last_ts + 1
    else:
        break
```

---

### **If timestamp pagination ALSO fails:**

**Alternative 1:** Use Polygon `/aggs` endpoint
- Aggregates data on Polygon side
- Better pagination for high-volume
- Less granular (minute bars only)

**Alternative 2:** Hybrid approach
- Use `/trades` for low-volume symbols (IBM, etc.)
- Use `/aggs` for high-volume symbols (AAPL, TSLA, MSFT)
- Switch based on symbol or volume detection

**Alternative 3:** Contact Polygon support
- Report cursor pagination bug
- Ask for proper high-volume pagination method
- Get official recommendation

---

## 📊 FILES TO MODIFY (if timestamp pagination works)

**Backend:**
- `backend/intraday_loader.py` - Lines 13-127 (fetch function)
  - Replace cursor logic with timestamp-based pagination
  - Remove cursor extraction (lines 80-92)
  - Add timestamp advancement logic

**No frontend changes needed** - this is purely backend data fetching

---

## 🎯 NEXT STEPS FOR USER

**Step 1: Run diagnostic script**
```powershell
cd scripts
python prove-cursor-bug.py
```

**Expected output:**
- Will show AAPL cursor stuck (all identical)
- Will show IBM cursor advancing (all different)
- Confirms Polygon API issue

**Step 2: Run alternative pagination test**
```powershell
python test-timestamp-pagination.py
```

**Expected output:**
- If AAPL gets 100+ minutes: ✅ We have a fix!
- If AAPL still gets 6 minutes: ❌ Need deeper investigation

**Step 3: Based on results**
- If timestamp pagination works: I'll implement the fix
- If it fails: We'll try `/aggs` endpoint or contact Polygon

---

## 💡 KEY INSIGHTS FROM ANALYSIS

1. **Cursor is opaque:** We can't decode what it means, just use it
2. **Polygon controls cursor logic:** We can't fix their pagination
3. **Workaround is needed:** Either timestamps or different endpoint
4. **IBM proves our code works:** Same code, different symbol, works fine
5. **High-volume is the trigger:** AAPL, TSLA, MSFT likely have same issue

---

## 🔬 WHAT WE'RE TESTING

**Hypothesis to prove/disprove:**
> Polygon API cursor pagination has undocumented limitations for high-volume symbols that cause cursors to become "stuck" when massive trades exist in narrow time windows.

**Test 1 proves:** Is cursor actually stuck?  
**Test 2 proves:** Does timestamp-based pagination work around it?

---

## 📝 FOR NEXT AGENT

**If user runs tests and shares results:**

1. Read test output carefully
2. Check if cursors are identical (AAPL) vs different (IBM)
3. Check if timestamp pagination gets more data
4. Based on results, implement appropriate fix

**Quick reference:**
- Cursor bug location: `backend/intraday_loader.py` lines 76-96
- Current approach: Extract cursor from next_url, use it for next page
- Alternative: Use last trade timestamp + 1 for next page

---

**This debugging plan gives us concrete proof and a tested solution path.** 🎯

