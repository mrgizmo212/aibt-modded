# How to Verify Cash Validation Fix

## Quick Test

### Step 1: Restart Backend (Fresh)
```powershell
cd aibt-modded\backend
python main.py
```

### Step 2: Run Test Script
In a **NEW** terminal:
```powershell
cd aibt-modded\backend
python test_cash_validation.py
```

---

## What To Look For

### ✅ GOOD - Validation Working

You should see messages like this in the logs:

```
❌ INSUFFICIENT FUNDS for BUY 200 shares
   Need: $61,574.00 | Have: $10,000.00
   Skipping trade

💰 BUY 32 shares @ $307.87
   Why: rising close, strong volume
   Cost: $9,851.84 (AFFORDABLE!)
```

### ❌ BAD - Validation NOT Working

If you see this, the fix didn't apply:

```
💰 BUY 200 shares @ $307.87
   (No "INSUFFICIENT FUNDS" message)
   
Final Position: {'CASH': -51574.0, 'IBM': 200}
                         ^^^^^^^^^ NEGATIVE CASH = BUG!
```

---

## Manual Test (Without Script)

### 1. Check Available Models
```powershell
python check_models.py
```

### 2. Pick a Model ID from the List

### 3. Start Intraday Trading
Use the frontend or call the API directly:

**Via API (PowerShell):**
```powershell
$token = "YOUR_JWT_TOKEN"
$modelId = 156  # Use a valid ID from check_models.py

$body = @{
    symbol = "IBM"
    date = "2025-10-27"
    session = "regular"
    base_model = "openai/gpt-4o-mini"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/trading/start-intraday/$modelId" -Method POST -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} -Body $body
```

### 4. Watch Backend Logs

Look for these patterns:

**GOOD (Validation Working):**
```
🕐 Minute 1/391: 09:30 - IBM @ $307.87
  ❌ INSUFFICIENT FUNDS for BUY 200 shares
     Need: $61,574.00 | Have: $10,000.00
     Skipping trade
  
  💰 BUY 32 shares
     Cost: $9,851.84 (within budget)
```

**BAD (Validation Broken):**
```
🕐 Minute 1/391: 09:30 - IBM @ $307.87
  💰 BUY 200 shares
  💾 Recorded: BUY 200 IBM @ $307.87
  (No rejection message = BUG!)
```

---

## Expected Results After Fix

### Starting Capital: $10,000

**First Minute (09:30, IBM @ ~$308):**
- AI suggests: BUY 200 shares
- Cost: 200 × $308 = $61,600
- **Result:** ❌ REJECTED (insufficient funds)
- AI adjusts: BUY 32 shares
- Cost: 32 × $308 = $9,856
- **Result:** ✅ ACCEPTED (affordable)

**Subsequent Minutes:**
- Only trades within cash limits execute
- Can't sell more shares than owned
- Final cash will be POSITIVE (never negative)

---

## Final Verification

After running a full intraday session, check:

```
✅ Session Complete:
   Minutes Processed: 391
   Trades Executed: 23
   Final Position: {'CASH': 8543.21, 'IBM': 4}
                            ^^^^^^^ POSITIVE CASH = GOOD!
```

**Red Flags:**
- ❌ Negative cash
- ❌ First trade costs > $10,000
- ❌ No "INSUFFICIENT FUNDS" messages ever appear

**Green Flags:**
- ✅ "INSUFFICIENT FUNDS" messages appear in logs
- ✅ Final cash is positive
- ✅ All executed trades were affordable
- ✅ Trade counts are lower (many rejected = good!)

---

## Quick Commands

```powershell
# 1. Restart backend (CTRL+C first to stop)
cd aibt-modded\backend
python main.py

# 2. In new terminal - Run validation test
cd aibt-modded\backend
python test_cash_validation.py

# 3. Check models
python check_models.py

# 4. Run comprehensive test
cd ..
python test_ultimate_comprehensive.py
```

---

## Summary

The fix is in the code, but you need a **fresh backend restart** to see it work. The current logs show the OLD behavior before the fix was applied.

After restart, you'll see realistic trading with proper cash constraints!

