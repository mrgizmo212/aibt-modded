# Frontend-v2 Bug Verification Scripts

**Purpose:** Prove that specific frontend bugs exist before fixing them

**Location:** `frontend-v2/scripts/`

---

## Prerequisites

**Before running tests, start BOTH frontend and backend:**

```powershell
# Terminal 1: Start Backend
cd backend
python main.py

# Terminal 2: Start Frontend
cd frontend-v2
npm run dev

# Terminal 3: Run Tests
cd frontend-v2/scripts
npm install
```

This installs Puppeteer for automated browser testing.

---

## Available Tests

### 1. Chat Re-Render Storm (BUG-001)

**Proves:** Every SSE token causes full message array re-render

**Run:**
```powershell
npm run verify:rerender-storm
```

**What it does:**
- Opens browser with DevTools
- Logs in automatically
- Sends chat message
- Counts renders vs tokens
- Reports if renders = tokens (BUG!)

**Expected Result:** 1-2 renders total  
**Bug Result:** 50-100+ renders (one per token)

---

### 2. EventSource Memory Leak (BUG-002)

**Proves:** New EventSource created without closing old one

**Run:**
```powershell
npm run verify:eventsource-leak
```

**What it does:**
- Hooks EventSource constructor
- Sends multiple messages
- Tracks which connections are still open
- Reports if multiple active connections

**Expected Result:** 1 active connection  
**Bug Result:** 2+ active connections

---

### 3. Polling Spam (BUG-003)

**Proves:** Navigation sidebar polls API every 30 seconds unnecessarily

**Run:**
```powershell
npm run verify:polling-spam
```

**What it does:**
- Monitors network requests
- Waits 90 seconds
- Counts API calls to /api/trading/status
- Reports polling frequency

**Expected Result:** 0-1 calls  
**Bug Result:** 3+ calls (polling)

---

### 4. All Tests

**Run all tests in sequence:**

```powershell
npm run verify:all
```

---

## Manual Testing (No Installation Required)

If you don't want to install Puppeteer, follow the procedures in:

**`MANUAL-TEST-ALL-BUGS.md`**

Each bug has step-by-step instructions for manual browser testing.

---

## After Testing

Once bugs are confirmed:
1. Document results in `/docs/bugs-and-fixes.md`
2. Create fix implementation plan
3. Implement fixes
4. Create prove-fix scripts showing 100% resolution

---

## Test Results Template

```
BUG-001: Chat Re-Render Storm
- Tested: YYYY-MM-DD HH:MM
- Result: ❌ CONFIRMED / ✅ NOT FOUND
- Tokens: X
- Renders: Y
- Impact: HIGH / MEDIUM / LOW

BUG-002: EventSource Leak
- Tested: YYYY-MM-DD HH:MM
- Result: ❌ CONFIRMED / ✅ NOT FOUND
- Active Connections: X
- Impact: HIGH / MEDIUM / LOW

BUG-003: Polling Spam
- Tested: YYYY-MM-DD HH:MM
- Result: ❌ CONFIRMED / ✅ NOT FOUND
- Calls in 90s: X
- Interval: ~Ys
- Impact: MEDIUM / LOW
```

---

**Last Updated:** 2025-11-05

