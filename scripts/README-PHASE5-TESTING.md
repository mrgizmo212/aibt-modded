# Phase 5 Testing - Ephemeral Conversation Flow

## Prerequisites

### 1. Node.js & Dependencies
```bash
node --version  # Should be 18+ (for native fetch)
npm install pg dotenv  # Install test dependencies
```

### 2. Environment Variables

Create or update `backend/.env`:
```bash
DATABASE_URL=postgresql://postgres.[project]:[password]@...
TEST_EMAIL=adam@truetradinggroup.com
TEST_PASSWORD=your_password_here
```

### 3. Services Running

**Backend:**
```powershell
cd backend
python main.py
# Should see: ✅ API Ready on port 8080
```

**Frontend:**
```powershell
cd frontend-v2
npm run dev
# Should see: ✓ Ready on http://localhost:3000
```

---

## Running Tests

### Quick Start
```bash
# From project root
node scripts/test-phase5-complete.js
```

### What Happens

**Automated Tests (1, 4, 5, 6):**
- Script runs automatically
- Shows real-time progress
- Outputs pass/fail for each

**Manual Tests (2, 3):**
- Script pauses and shows instructions
- You perform test in browser
- You report pass/fail (y/n)

---

## Test Breakdown

### Test 1: Backend Endpoint ✅ AUTOMATED
**What:** Verifies `/api/chat/stream-new` works
**How:** 
1. Logs in to get JWT token
2. Calls endpoint with test message
3. Parses SSE stream
4. Verifies session_created, token, done events

**Success:** All events received in correct order

---

### Test 2: General Chat Flow ⚪ MANUAL
**What:** User creates general conversation from `/new`
**Instructions:**
1. Navigate to `http://localhost:3000/new`
2. Open DevTools (Console + Network)
3. Type "hello world" and send
4. Verify:
   - Console: `[Chat] Ephemeral mode - creating session`
   - Console: `[Chat] ✅ Session created: {id}`
   - Network: GET `/api/chat/stream-new` (NOT POST `/api/chat/sessions`)
   - URL: Changes from `/new` to `/c/{id}` WITHOUT reload
   - Chat: AI response appears
   - Sidebar: New conversation appears

**Success:** All checks pass

---

### Test 3: Model Chat Flow ⚪ MANUAL
**What:** User creates model conversation from `/m/169/new`
**Instructions:**
1. Navigate to `http://localhost:3000/m/169/new`
2. Open DevTools
3. Type "analyze this model" and send
4. Verify:
   - Console: `[Chat] Ephemeral mode: true Model: 169`
   - Network: GET `/api/chat/stream-new?model_id=169`
   - URL: Changes from `/m/169/new` to `/m/169/c/{id}`
   - Sidebar: Conversation appears under MODEL 212

**Success:** All checks pass

---

### Test 4: Database Verification ✅ AUTOMATED
**What:** Verifies database integrity
**How:**
1. Queries recent sessions
2. Checks message counts
3. Searches for empty sessions

**Queries Executed:**
```sql
-- Recent sessions
SELECT id, session_title, model_id, user_id, created_at
FROM chat_sessions
WHERE user_id = '{test_user_id}'
ORDER BY created_at DESC
LIMIT 5;

-- Message counts
SELECT s.id, s.session_title, COUNT(m.id) as message_count
FROM chat_sessions s
LEFT JOIN chat_messages m ON s.id = m.session_id
WHERE s.user_id = '{test_user_id}'
GROUP BY s.id, s.session_title
ORDER BY s.created_at DESC
LIMIT 5;

-- Empty sessions (SHOULD BE ZERO)
SELECT COUNT(*) as empty_count
FROM chat_sessions s
WHERE s.user_id = '{test_user_id}'
AND NOT EXISTS (
  SELECT 1 FROM chat_messages m WHERE m.session_id = s.id
);
```

**Success:** 
- All sessions have titles (not "New Chat")
- All sessions have >= 2 messages
- Zero empty sessions

---

### Test 5: Regression Test ✅ AUTOMATED
**What:** Existing conversations still work
**How:**
1. Fetches list of sessions
2. Finds an existing session (not created in this test run)
3. Loads messages
4. Verifies existing endpoint works

**Success:** No regressions in existing functionality

---

### Test 6: Error Handling ✅ AUTOMATED
**What:** Graceful error handling
**Tests:**
- Request without token → Should return error
- Request with invalid token → Should return error

**Success:** Errors handled gracefully, no crashes

---

## Expected Output

```
═══════════════════════════════════════════════════════════
  🧪 PHASE 5 TESTING - EPHEMERAL CONVERSATION FLOW
═══════════════════════════════════════════════════════════

Configuration:
  Backend:  http://localhost:8080
  Frontend: http://localhost:3000
  Database: Connected
  User:     adam@truetradinggroup.com
  Model ID: 169

[1/6] Backend Endpoint 🔴 CRITICAL
─────────────────────────────────────────────────────────
ℹ️  Logging in to get JWT token...
✅ Logged in as adam@truetradinggroup.com
ℹ️  Testing /api/chat/stream-new endpoint...
✅ SSE connection established
✅ Session created: 32
✅ Received 15 tokens
✅ Done event received
✅ Test 1: PASSED

[2/6] General Chat Flow (Manual) 🔴 CRITICAL
─────────────────────────────────────────────────────────
ℹ️  This test requires browser interaction

Instructions:
1. Navigate to: http://localhost:3000/new
2. Open DevTools (F12) → Console + Network tabs
3. Type "hello world" in chat input
4. Click Send button
5. Observe the following:
   - Console: [Chat] Ephemeral mode - creating session with first message
   - Console: [Chat] ✅ Session created: {id}
   - Network: GET /api/chat/stream-new (NOT POST /api/chat/sessions)
   - URL bar: Changes from /new to /c/{id} WITHOUT page reload
   - Chat: AI response appears
   - Sidebar: New conversation appears in CONVERSATIONS section

Did all checks pass? (y/n): y
✅ Test 2: PASSED

[3/6] Model Chat Flow (Manual) 🔴 CRITICAL
─────────────────────────────────────────────────────────
ℹ️  This test requires browser interaction

Instructions:
1. Navigate to: http://localhost:3000/m/169/new
...

Did all checks pass? (y/n): y
✅ Test 3: PASSED

[4/6] Database Verification 🔴 CRITICAL
─────────────────────────────────────────────────────────
ℹ️  Connecting to database...
✅ Database connected
ℹ️  Checking recent sessions...
✅ Found 4 recent sessions
  Session 32: "Test Message Analysis" (model: general)
  Session 33: "Model Performance Review" (model: 169)
  Session 30: "Model 212 Exit Analysis" (model: general)
  Session 31: "Run #5 Strategy" (model: 169)
ℹ️  Checking message counts...
  Session 32: 2 messages ✓
  Session 33: 2 messages ✓
  Session 30: 12 messages ✓
  Session 31: 5 messages ✓
✅ All sessions have messages
ℹ️  Checking for empty sessions...
✅ Zero empty sessions ✅ (GOAL ACHIEVED!)
✅ Test 4: PASSED

[5/6] Regression Test - Existing Conversations ⚪ OPTIONAL
─────────────────────────────────────────────────────────
ℹ️  Fetching existing sessions...
✅ Testing existing session: 30 "Model 212 Exit Analysis"
ℹ️  Fetching messages...
✅ Loaded 12 messages
ℹ️  Testing message send to existing session...
✅ Existing endpoint verified
✅ Test 5: PASSED - No regressions detected

[6/6] Error Handling ⚪ OPTIONAL
─────────────────────────────────────────────────────────
ℹ️  Test 6A: Request without token...
✅ No auth: Correctly rejected
ℹ️  Test 6B: Request with invalid token...
✅ Invalid token: Correctly rejected
✅ Test 6: PASSED - Error handling works

═══════════════════════════════════════════════════════════
Overall: 6/6 tests passed
═══════════════════════════════════════════════════════════

🎉 ALL TESTS PASSED! Implementation is solid!

Next steps:
  - Update documentation (overview.md, wip.md)
  - Commit changes
  - Deploy to staging
  - Conduct user acceptance testing
```

---

## Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install pg dotenv
```

### "DATABASE_URL not set"
Check `backend/.env` has:
```
DATABASE_URL=postgresql://...
```

### "Login failed"
Verify `TEST_PASSWORD` in `.env` or provide via env var:
```bash
TEST_PASSWORD=yourpass node scripts/test-phase5-complete.js
```

### Backend not responding
```bash
# Check backend is running
curl http://localhost:8080/api/health
```

### Frontend not running
```bash
cd frontend-v2
npm run dev
```

---

## Success Criteria

**Critical tests (must pass):**
- ✅ Test 1: Backend endpoint
- ✅ Test 2: General chat flow
- ✅ Test 3: Model chat flow
- ✅ Test 4: Database verification

**Optional tests:**
- ✅ Test 5: Regression
- ✅ Test 6: Error handling

**Overall success:** All 4 critical tests pass + zero empty sessions in database

---

## What Gets Tested

**Automated (no user action):**
- Backend endpoint functionality
- SSE stream parsing
- Database integrity
- Error handling
- Regression checks

**Manual (requires browser):**
- URL transitions
- Sidebar updates
- UI responsiveness
- Visual verification

**Why manual tests:** Browser automation (Playwright) adds complexity. Manual tests are faster to execute and verify visual elements.

---

**Run the script and report results!**

