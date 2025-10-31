# Intraday Trading Implementation Plan

**Date:** 2025-10-30  
**Status:** IN PROGRESS  
**Infrastructure:** VERIFIED WORKING

---

## ✅ VERIFIED READY

- ✅ apiv3-ttg proxy: Fetches tick data
- ✅ Upstash Redis: Caches with TTL
- ✅ Aggregation: Converts trades → minute bars
- ✅ Isolation: Per-model keys
- ✅ Multi-user: Safe (RLS + per-model files)

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Backend Data Layer** (Foundation)

**1.1 Data Loader Service** ✅ IN PROGRESS
- [ ] File: `backend/services/intraday_loader.py`
- [ ] Function: `load_intraday_session()`
- [ ] Fetches from apiv3-ttg
- [ ] Aggregates to minute bars
- [ ] Caches in Redis
- [ ] Complexity: MEDIUM

**1.2 Database Migration** ⏳ NEXT
- [ ] File: `backend/migrations/008_intraday_support.sql`
- [ ] Add: `minute_time TIME` column to positions
- [ ] Add: Index on (model_id, date, minute_time)
- [ ] Complexity: LOW

**1.3 Intraday Models** ⏳ NEXT
- [ ] File: `backend/models.py`
- [ ] Add: `IntradayTradingRequest` schema
- [ ] Add: `TradingMode` enum
- [ ] Complexity: LOW

---

### **Phase 2: Backend Trading Logic**

**2.1 Intraday Trading Loop** ⏳
- [ ] File: `backend/trading/base_agent.py`
- [ ] Function: `run_intraday_session()`
- [ ] Loops through 390 minutes
- [ ] Queries Redis for each minute
- [ ] AI decides per minute
- [ ] Executes trades
- [ ] Complexity: MEDIUM

**2.2 Intraday Prompt** ⏳
- [ ] File: `backend/trading/agent_prompt.py`
- [ ] Function: `get_intraday_system_prompt()`
- [ ] Minute-specific context
- [ ] Fast decision requirements
- [ ] Complexity: LOW

**2.3 Agent Manager** ⏳
- [ ] File: `backend/trading/agent_manager.py`
- [ ] Add: `start_intraday_agent()`
- [ ] Pre-load data before starting
- [ ] Handle intraday vs daily routing
- [ ] Complexity: MEDIUM

---

### **Phase 3: Backend API**

**3.1 API Endpoint** ⏳
- [ ] File: `backend/main.py`
- [ ] Add: `POST /api/trading/start-intraday/{model_id}`
- [ ] Accepts: symbol, date, session
- [ ] Loads data, starts trading
- [ ] Complexity: LOW

**3.2 Progress Streaming** ⏳
- [ ] Enhance: `/api/trading/stream/{model_id}`
- [ ] Add: Minute progress events
- [ ] Add: Trade execution events
- [ ] Complexity: LOW

---

### **Phase 4: Frontend UI**

**4.1 Trading Mode Toggle** ⏳
- [ ] File: `frontend/app/models/[id]/page.tsx`
- [ ] Add: Radio buttons (Daily/Intraday)
- [ ] Add: Session selector (Pre/Regular/After)
- [ ] Add: Symbol selector (for single-stock intraday)
- [ ] Complexity: LOW

**4.2 Progress Display** ⏳
- [ ] Add: Progress bar (minute X of 390)
- [ ] Add: Current minute time display
- [ ] Add: Trades executed counter
- [ ] Complexity: LOW

**4.3 TypeScript Types** ⏳
- [ ] File: `frontend/types/api.ts`
- [ ] Add: IntradayTradingRequest interface
- [ ] Add: TradingMode type
- [ ] Complexity: TRIVIAL

---

### **Phase 5: Testing & Verification**

**5.1 Unit Tests** ⏳
- [ ] Test data loading
- [ ] Test aggregation
- [ ] Test minute loop
- [ ] Test Redis caching

**5.2 Integration Tests** ⏳
- [ ] End-to-end intraday session
- [ ] Concurrent daily + intraday
- [ ] Multi-user intraday

**5.3 Browser Testing** ⏳
- [ ] UI toggle works
- [ ] Progress updates
- [ ] Results display

---

## 📊 PROGRESS TRACKER

**Total Components:** 14  
**Completed:** 0  
**In Progress:** 1  
**Remaining:** 13

**Estimated Scope:** Substantial implementation

---

## 🔄 IMPLEMENTATION ORDER

1. ✅ Data loader service (STARTING)
2. Database migration
3. Models/schemas
4. Intraday trading loop
5. Intraday prompt
6. Agent manager updates
7. API endpoint
8. Frontend toggle
9. Progress display
10. TypeScript types
11. Testing
12. Documentation
13. Browser verification
14. Git commit

---

**Status:** Beginning Phase 1.1 - Data Loader Service

