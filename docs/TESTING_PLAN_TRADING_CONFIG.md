# Testing Plan: Trading Configuration Integration

**Date:** 2025-11-05  
**Purpose:** Verify AI agent uses model configuration correctly  
**Login:** adam@truetradinggroup.com / admin123!!

---

## 🧪 TEST SUITE OVERVIEW

### What We're Testing:
1. ✅ Frontend auto-population when style changes
2. ✅ "Create Model" button workflow
3. ✅ Margin account checkbox (conditional display)
4. ✅ Backend receives configuration
5. ✅ AI prompt includes configuration
6. ✅ Validation layer enforces rules
7. ✅ Performance metrics include context

---

## TEST 1: Auto-Population on Style Change

**Objective:** Verify changing trading style auto-fills instructions and defaults

**Steps:**
1. Log in to http://localhost:3000/login
2. Navigate to http://localhost:3000/new
3. Click "Create Model" button
4. Verify dialog opens with title "Create New Model"
5. Current style: "Day Trading" (default)
6. Click Trading Style dropdown
7. Select "Scalping"
8. **VERIFY:**
   - Custom Instructions auto-fills: "Focus on 1-5 min trades. Exit within 5 minutes..."
   - Order Types updates to: Market + Limit (2 selected)
   - Capabilities: All disabled (scalping defaults)
9. Change style to "Swing Trading"
10. **VERIFY:**
    - Instructions change to: "Hold 2-7 days. Focus on trend continuation..."
    - Order Types: Market, Limit, Stop-Limit, Trailing Stop (4 selected)
    - Shorting: ENABLED
    - Hedging: ENABLED

**Expected Console Logs:**
```
[ModelEdit] Style changed to scalping, applied defaults: {...}
[ModelEdit] Style changed to swing-trading, applied defaults: {...}
```

**Success Criteria:**
- ✅ Instructions auto-fill on style change
- ✅ Order types auto-update
- ✅ Capabilities auto-update
- ✅ User can still override any field

---

## TEST 2: Margin Account Conditional Display

**Objective:** Verify margin checkbox only appears when shorting is enabled

**Steps:**
1. In create dialog, shorting is disabled by default
2. **VERIFY:** No margin account checkbox visible
3. Enable "Short Selling" checkbox
4. **VERIFY:** Margin account checkbox appears below it (indented)
5. Text shows: "2-4x buying power • Required for shorting • Pattern Day Trader rules apply"
6. Enable margin account checkbox
7. Disable "Short Selling"
8. **VERIFY:** Margin checkbox disappears

**Success Criteria:**
- ✅ Margin checkbox only shows when shorting enabled
- ✅ Proper indentation and styling
- ✅ Clear description of what margin does

---

## TEST 3: Create New "Scalper" Model

**Objective:** Create complete model through UI and verify persistence

**Steps:**
1. Click "Create Model" button
2. Fill in form:
   - Name: "SCALPER AI"
   - Trading Style: Scalping
   - Instrument: Stocks (default)
   - AI Model: Select any model (e.g., "Qwen 3 Max")
   - Custom Instructions: Should be auto-filled, leave as-is
   - Short Selling: DISABLED (leave unchecked)
   - Order Types: Market + Limit (should be auto-selected)
   - Starting Capital: 15000
3. Click "Create Model" button
4. **VERIFY:** Toast shows "Model created successfully"
5. **VERIFY:** Dialog closes
6. **VERIFY:** Sidebar shows new "SCALPER AI" under "SCALPING" section
7. Reload page
8. **VERIFY:** Model still appears
9. Click edit on "SCALPER AI"
10. **VERIFY:** All fields load correctly

**Database Verification:**
Run SQL:
```sql
SELECT id, name, trading_style, allow_shorting, margin_account, allowed_order_types, custom_instructions 
FROM public.models 
WHERE name = 'SCALPER AI';
```

**Expected:**
- trading_style: "scalping"
- allow_shorting: false
- margin_account: false
- allowed_order_types: ["market", "limit"]
- custom_instructions: "Focus on 1-5 min trades..."

**Success Criteria:**
- ✅ Model created through UI
- ✅ Auto-populated values saved
- ✅ Sidebar groups correctly
- ✅ Data persists to database
- ✅ Reload shows model

---

## TEST 4: Create "Swing Trader" with Margin

**Objective:** Test shorting + margin account flow

**Steps:**
1. Click "Create Model"
2. Fill in:
   - Name: "SWING MASTER"
   - Style: Swing Trading
   - AI Model: Select any
   - Instructions: Auto-filled, leave as-is
   - **Enable "Short Selling"** ← Margin checkbox should appear
   - **Enable "Margin Account"**
   - Order Types: Should have 4 pre-selected (Market, Limit, Stop-Limit, Trailing Stop)
   - Starting Capital: 50000
3. Take screenshot showing margin checkbox
4. Click "Create Model"
5. **VERIFY:** Created successfully
6. **VERIFY:** Appears in sidebar under "SWING TRADING"

**Database Verification:**
```sql
SELECT id, name, trading_style, allow_shorting, margin_account, allowed_order_types 
FROM public.models 
WHERE name = 'SWING MASTER';
```

**Expected:**
- trading_style: "swing-trading"
- allow_shorting: true
- margin_account: true
- allowed_order_types: ["market", "limit", "stop-limit", "trailing-stop"]

**Success Criteria:**
- ✅ Margin checkbox appears when shorting enabled
- ✅ Margin account saves to database
- ✅ Multiple order types save correctly

---

## TEST 5: Backend Configuration Loading

**Objective:** Verify backend logs show configuration when agent starts

**Prerequisites:** Models created in Tests 3 & 4

**Steps:**
1. Have backend terminal visible
2. Start trading run for "SCALPER AI" (if possible via UI, otherwise note for manual test)
3. Watch backend logs

**Expected Backend Logs:**
```
📋 Model Configuration Loaded:
   Style: scalping
   Margin Account: 🚫
   Shorting: 🚫
   Order Types: ['market', 'limit']

🤖 Agent Configuration:
   Style: scalping
   Margin: No
   Buying Power: 1.0x
   Shorting: Disabled
   Order Types: market, limit
```

4. Start trading run for "SWING MASTER"

**Expected Logs:**
```
📋 Model Configuration Loaded:
   Style: swing-trading
   Margin Account: ✅
   Shorting: ✅
   Order Types: ['market', 'limit', 'stop-limit', 'trailing-stop']

🤖 Agent Configuration:
   Style: swing-trading
   Margin: Yes
   Buying Power: 2.0x
   Shorting: Allowed
   Order Types: market, limit, stop-limit, trailing-stop
```

**Success Criteria:**
- ✅ Backend logs show full configuration
- ✅ Buying power calculated correctly (1x vs 2x)
- ✅ Shorting flag correct
- ✅ Order types list complete

---

## TEST 6: AI System Prompt Includes Configuration

**Objective:** Verify AI receives configuration in its prompt

**Method:** Check AI reasoning logs or print statements

**Expected in Prompt:**
```
================================================================================
⚙️ MODEL CONFIGURATION - MANDATORY CONSTRAINTS
================================================================================

🎯 TRADING STYLE: SCALPING
⏱️ SCALPING (1-5 minute holds)
- EXIT all positions within 5 minutes maximum
- Focus on quick price movements and high volume
- Tight stop losses (0.5-1%)
- High frequency, small gains per trade

🎯 ACCOUNT TYPE: Cash Account
- Buying Power: 1x cash (no leverage)

🎯 ALLOWED INSTRUMENTS: Stocks ONLY
- You can ONLY trade stocks
- Do NOT attempt other asset types

🎯 TRADING CAPABILITIES:
🚫 SHORT SELLING: DISABLED
   - You can ONLY go long (BUY shares)
   - All SELL orders must close existing long positions
🚫 MULTI-LEG OPTIONS: DISABLED
   - Single-leg positions only
🚫 HEDGING: DISABLED
   - Each position is directional only

🎯 ALLOWED ORDER TYPES: market, limit
- ONLY use these order types when placing trades
- Any other order type will be REJECTED

⚠️ RULE VIOLATIONS = AUTOMATIC REJECTION:
- Wrong instrument → REJECTED + logged
- Short when disabled/no margin → REJECTED + logged
- Wrong order type → REJECTED + logged
================================================================================
```

**Success Criteria:**
- ✅ Configuration section appears in prompt
- ✅ Style-specific guidance included
- ✅ Shorting status clear
- ✅ Order types listed
- ✅ Warnings about rejections

---

## TEST 7: Validation Layer (Manual Backend Test)

**Objective:** Verify trades are validated and rejected appropriately

**Note:** This requires triggering AI decisions, which may need backend testing or manual simulation

**Test Case A: Invalid Order Type**
- Model: SCALPER AI (allows: market, limit)
- AI tries: "BUY 100 AAPL STOP"
- **Expected:** REJECTED - "Order type 'stop' not allowed"

**Test Case B: Shorting When Disabled**
- Model: SCALPER AI (shorting: disabled)
- AI tries: "SHORT 50 TSLA"
- **Expected:** REJECTED - "Short selling is disabled"

**Test Case C: Shorting Without Margin**
- Model: Config has shorting=true, margin_account=false
- AI tries: "SHORT 100 AAPL"
- **Expected:** REJECTED - "Requires margin account"

**Test Case D: Valid Trade**
- Model: SCALPER AI
- AI tries: "BUY 100 AAPL MARKET"
- **Expected:** EXECUTED ✅

**Success Criteria:**
- ✅ Invalid trades rejected with clear error
- ✅ Rejection logged to database
- ✅ AI receives feedback in next decision
- ✅ Valid trades execute normally

---

## TEST 8: Margin Checkbox Updates Existing Model

**Objective:** Verify editing existing model to add margin works

**Steps:**
1. Open MODEL 212 edit dialog (currently Scalping, no shorting)
2. Enable "Short Selling"
3. **VERIFY:** Margin checkbox appears
4. Enable "Margin Account"
5. Save
6. Reload page
7. Open MODEL 212 edit again
8. **VERIFY:** Both checkboxes still checked

**Database Verification:**
```sql
SELECT id, name, allow_shorting, margin_account FROM public.models WHERE id = 169;
```

**Expected:**
- allow_shorting: true
- margin_account: true

**Success Criteria:**
- ✅ Can update existing model to add margin
- ✅ Changes persist
- ✅ Conditional display works in edit mode

---

## TEST 9: Performance Metrics Context

**Objective:** Verify metrics include trading style and leverage context

**Prerequisites:** Model has some trading history

**Steps:**
1. Trigger performance calculation (or wait for it to run)
2. Check database:
```sql
SELECT model_id, cumulative_return, trading_style, margin_account, leverage_used 
FROM public.performance_metrics 
WHERE model_id IN (169, 181);
```

**Expected:**
- MODEL 212 (scalping, cash): leverage_used = 1.0
- SWING TRADER PRO (swing, margin): leverage_used = 2.0

**Frontend Display (if implemented):**
- Shows: "Return: +15% (1x leverage)"
- Or: "Return: +24% (2x margin)"

**Success Criteria:**
- ✅ Metrics table has style/margin/leverage columns
- ✅ Values calculated correctly
- ✅ Context enables proper comparison

---

## TEST 10: End-to-End Flow

**Objective:** Complete user journey from create to trade

**Steps:**
1. Create new "DAY TRADER PRO" model:
   - Style: Day Trading
   - Shorting: Enabled
   - Margin: Enabled
   - Order Types: Market, Limit, Stop
   - Instructions: Auto-filled
   - AI Model: GPT-5 or Qwen
   - Capital: $25,000

2. Save and verify in database

3. Start intraday trading run (via UI if possible)

4. Monitor backend logs for:
   - ✅ Configuration loaded
   - ✅ Agent initialized with config
   - ✅ Buying power: 4.0x (day trading margin)
   - ✅ System prompt includes constraints

5. Watch for AI decisions and validations

6. After run completes, check:
   - Performance metrics saved with context
   - Any validation rejections logged
   - Trades executed within constraints

**Success Criteria:**
- ✅ Complete flow works end-to-end
- ✅ Configuration flows: UI → DB → Agent → Prompt → Validation → Execution
- ✅ No data lost at any step
- ✅ Metrics properly contextualized

---

## 🔍 BROWSER TESTING CHECKLIST

**For each test, capture:**
- ☐ Screenshots at key steps
- ☐ Console logs (look for errors)
- ☐ Network tab (verify API calls succeed)
- ☐ Database verification (SQL queries)
- ☐ Backend terminal logs

**What to look for:**
- ✅ Green success toasts
- ❌ Red error messages
- 🟡 Warning states
- 📊 Data persistence
- 🤖 Backend configuration logs

---

## 🚨 CRITICAL CHECKPOINTS

**After Tests 1-2 (UI Behavior):**
- Auto-population works ✅
- Margin checkbox conditional display ✅

**After Tests 3-4 (Create Flow):**
- Can create models via UI ✅
- All fields save correctly ✅
- Sidebar updates properly ✅

**After Tests 5-6 (Backend Integration):**
- Configuration loaded by agent ✅
- System prompt includes rules ✅

**After Tests 7-8 (Validation):**
- Invalid trades rejected ✅
- Valid trades execute ✅

**After Tests 9-10 (End-to-End):**
- Complete flow works ✅
- Metrics properly contextualized ✅

---

## 📋 TESTING ORDER

1. **Test 1** - Auto-population (quick, UI only)
2. **Test 2** - Margin checkbox (quick, UI only)
3. **Test 3** - Create Scalper (creates test data)
4. **Test 4** - Create Swing Trader (creates test data)
5. **Test 8** - Update MODEL 212 (modify existing)
6. **Test 5** - Backend logs (requires trading run)
7. **Test 6** - AI prompt verification (requires trading run)
8. **Test 7** - Validation (requires trading run or simulation)
9. **Test 9** - Metrics context (check database)
10. **Test 10** - End-to-end (full integration test)

---

## 🎯 PASS/FAIL CRITERIA

**MUST PASS (Blocking):**
- Auto-population works
- Create Model saves all fields
- Backend loads configuration
- Margin checkbox conditional display

**SHOULD PASS (Important but can fix later):**
- Validation layer rejects invalid trades
- Performance metrics include context
- AI prompt shows configuration

**NICE TO HAVE:**
- End-to-end trading run completes
- All console logs clean (no errors)

---

## 📸 SCREENSHOT PLAN

**Capture screenshots for:**
1. Style dropdown open (showing all 4 options)
2. Scalping instructions auto-filled
3. Swing Trading instructions auto-filled
4. Margin checkbox appearing when shorting enabled
5. Create dialog filled out completely
6. Sidebar showing new models grouped by style
7. Edit dialog showing all saved values
8. Backend terminal with configuration logs

---

**Ready to execute tests when backend/frontend restart!**

**Say "ready" when servers are running and I'll begin systematic testing.**

