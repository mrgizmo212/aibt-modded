# Reset Trading Data - Start From Zero

**Purpose:** Wipe trading data to experience platform from empty state  
**Keeps:** Users and stock prices  
**Deletes:** All models, positions, logs

---

## 🔄 **What This Does**

### **BEFORE Reset:**
```
Dashboard shows:
- 7 AI models (pre-migrated)
- 306 positions
- 359 logs
- $70,000 total capital

You see existing data from migration
```

### **AFTER Reset:**
```
Dashboard shows:
- 0 models
- "No models yet" empty state
- "Create Your First Model" button

Fresh start - build from scratch!
```

---

## 📋 **How to Reset**

### **Step 1: Copy SQL**
```powershell
Get-Content C:\Users\User\Desktop\CS1027\aibt\backend\RESET_TRADING_DATA.sql | clip
```

### **Step 2: Run in Supabase**
1. Go to: https://supabase.com/dashboard/project/lfewxxeiplfycmymzmjz/sql/new
2. Paste SQL
3. Click "Run"

### **Step 3: Verify**
**Expected output:**
```
Users: 3 ✅ (adam, samerawada92, mperinotti - KEPT!)
Models: 0 ✅
Positions: 0 ✅
Logs: 0 ✅
Stock Prices: 10100+ ✅ (KEPT!)
```

### **Step 4: Refresh Frontend**
- Refresh browser: Ctrl+R
- Dashboard now shows empty state
- Ready to create first model!

---

## 🎯 **What You Can Do After Reset**

### **1. Create Your First Model:**

**Via API:**
```powershell
$admin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"adam@truetradinggroup.com","password":"adminpass123"}'

$at = $admin.access_token

Invoke-RestMethod -Uri "http://localhost:8080/api/models" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $at"} -Body '{"name":"My First Strategy","signature":"strategy-001","description":"Testing GPT-5 on NASDAQ 100"}'
```

**Or:** Wait for Create Model form page to be built

---

### **2. Start Trading:**
```
Dashboard → Shows new model
Click "Start"
Select AI: GPT-5
Dates: 10/29-10/30
Watch it trade!
```

---

### **3. Watch It Populate:**
```
Before trading:
- 0 positions
- 0 logs
- $0 capital

After 1 day of trading:
- ~3 positions
- ~5 log entries
- $10,000 capital (your new model!)
```

---

## ⚠️ **WARNING**

**This deletes:**
- All 7 AI models
- All 306 trading positions  
- All 359 AI reasoning logs
- All historical performance data

**Cannot undo!**

**Backup:** The original data still exists in `aitrtader/data/` if you need it

---

## 🎯 **Why Do This?**

**Experience the platform organically:**
1. Start with nothing
2. Create your first model
3. Watch AI make its first trade
4. See portfolio grow from $0
5. Understand how everything connects
6. No pre-existing data to confuse you

**Like a tutorial mode!** ✅

---

## 📝 **Recommendation**

**Before resetting:**
1. Take screenshots of current state
2. Note the portfolio values
3. Check out the leaderboard
4. See what 7 models looks like

**Then reset and rebuild from scratch!**

---

**Ready to wipe and start fresh?**

**Run:** `RESET_TRADING_DATA.sql` in Supabase

**This gives you the true "new user" experience!** 🚀
