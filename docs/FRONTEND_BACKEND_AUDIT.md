# Frontend-Backend API Audit

**Date:** 2025-10-31  
**Purpose:** Verify frontend API client matches backend endpoints

---

## Executive Summary

### ✅ Complete Match: 18 endpoints
### ❌ Missing in Frontend: 8 endpoints
### ⚠️ Path Mismatch: 2 endpoints

**Overall Compatibility:** 69% (18/26 implemented)

---

## Detailed Audit

### ✅ AUTH ENDPOINTS - Complete Match (4/4)

| Endpoint | Method | Frontend Function | Status |
|----------|--------|-------------------|--------|
| `/api/auth/signup` | POST | `signup()` | ✅ Match |
| `/api/auth/login` | POST | `login()` | ✅ Match |
| `/api/auth/logout` | POST | ❌ Missing | ⚠️ Not implemented |
| `/api/auth/me` | GET | `getCurrentUser()` | ✅ Match |

**Issue:** Frontend has no `logout()` function

---

### ⚠️ MODELS ENDPOINTS - Path Mismatch (4/4)

| Backend Endpoint | Frontend Call | Status |
|------------------|---------------|--------|
| `GET /api/models` | `GET /api/models` | ✅ Match |
| `POST /api/models` | `POST /api/models` | ✅ Match |
| `PUT /api/models/{model_id}` | `PUT /api/models/{modelId}` | ✅ Match |
| `DELETE /api/models/{model_id}` | `DELETE /api/models/{modelId}` | ✅ Match |

**Status:** ✅ All match

---

### ❌ POSITIONS ENDPOINTS - Wrong Path (2/2)

| Backend Endpoint | Frontend Function | Frontend Path | Status |
|------------------|-------------------|---------------|--------|
| `GET /api/models/{model_id}/positions` | `fetchModelPositions()` | `/api/positions/{modelId}` | ❌ **WRONG PATH** |
| `GET /api/models/{model_id}/positions/latest` | `fetchModelLatestPosition()` | `/api/positions/{modelId}/latest` | ❌ **WRONG PATH** |

**🚨 CRITICAL:** Frontend is calling `/api/positions/` but backend expects `/api/models/{id}/positions/`

---

### ❌ LOGS & PERFORMANCE - Missing (2/2)

| Backend Endpoint | Frontend | Status |
|------------------|----------|--------|
| `GET /api/models/{model_id}/logs?date=YYYY-MM-DD` | ❌ Not implemented | Missing |
| `GET /api/models/{model_id}/performance` | ❌ Not implemented | Missing |

**Impact:** Frontend cannot:
- View trading logs
- Display performance metrics (Sharpe ratio, drawdown, etc.)

---

### ✅ TRADING ENDPOINTS - Complete Match (5/5)

| Backend Endpoint | Frontend Function | Status |
|------------------|-------------------|--------|
| `POST /api/trading/start/{model_id}` | `startTrading()` | ✅ Match |
| `POST /api/trading/stop/{model_id}` | `stopTrading()` | ✅ Match |
| `POST /api/trading/start-intraday/{model_id}` | `startIntradayTrading()` | ✅ Match |
| `GET /api/trading/status/{model_id}` | `fetchTradingStatus()` | ✅ Match |
| `GET /api/trading/status` | `fetchAllTradingStatus()` | ✅ Match |

**Status:** ✅ Perfect match including new intraday endpoint

---

### ✅ ADMIN ENDPOINTS - Partial Match (3/5)

| Backend Endpoint | Frontend Function | Status |
|------------------|-------------------|--------|
| `GET /api/admin/users` | `fetchAllUsers()` | ✅ Match |
| `GET /api/admin/models` | `fetchAllModels()` | ✅ Match |
| `GET /api/admin/stats` | `fetchAdminStats()` | ✅ Match |
| `GET /api/admin/leaderboard` | ❌ Not implemented | Missing |
| `PUT /api/admin/users/{user_id}/role` | ❌ Not implemented | Missing |

**Impact:** Admin dashboard cannot:
- View leaderboard
- Change user roles

---

### ❌ MCP ENDPOINTS - Completely Missing (3/3)

| Backend Endpoint | Frontend | Status |
|------------------|----------|--------|
| `POST /api/mcp/start` | ❌ Not implemented | Missing |
| `POST /api/mcp/stop` | ❌ Not implemented | Missing |
| `GET /api/mcp/status` | ❌ Not implemented | Missing |

**Impact:** Frontend cannot manage MCP services

---

### ❌ STOCK PRICES - Missing (1/1)

| Backend Endpoint | Frontend | Status |
|------------------|----------|--------|
| `GET /api/stock-prices` | ❌ Not implemented | Missing |

**Impact:** Cannot fetch NASDAQ 100 price data

---

### ✅ STREAMING - Match (1/1)

| Backend Endpoint | Frontend Function | Status |
|------------------|-------------------|--------|
| `GET /api/trading/stream/{model_id}` | `subscribeTradingEvents()` | ✅ Match |

**Status:** ✅ SSE streaming implemented

---

## Critical Issues Found

### 🚨 Issue 1: Wrong Positions Path

**Frontend (WRONG):**
```typescript
export async function fetchModelPositions(modelId: number) {
  const response = await fetch(`${API_BASE_URL}/api/positions/${modelId}`, {
    headers: getHeaders(),
  })
}
```

**Backend (CORRECT):**
```python
@app.get("/api/models/{model_id}/positions")
```

**Fix Required:** Change `/api/positions/` → `/api/models/{id}/positions/`

---

### 🚨 Issue 2: Missing Type Definition

**Frontend types/api.ts is missing:**
- `AdminStats` type (imported but not defined)

**Backend has:**
```python
class SystemStatsResponse(BaseModel):
    total_users: int
    total_models: int
    total_positions: int
    total_logs: int
    active_models: int
    admin_count: int
    user_count: int
```

---

### ⚠️ Issue 3: Missing logout() Function

**Frontend:** Uses `logout()` from auth context but no API call
**Backend:** Has `POST /api/auth/logout`

**Current behavior:** Frontend just clears localStorage (might be sufficient)

---

## Missing Features in Frontend

### High Priority
1. **Positions endpoints** - Wrong path (will return 404)
2. **Logs endpoint** - Cannot view trading history
3. **Performance endpoint** - No metrics display
4. **AdminStats type** - TypeScript error

### Medium Priority
5. **Leaderboard** - Admin cannot see rankings
6. **User role management** - Admin cannot change roles
7. **Stock prices** - Cannot fetch market data

### Low Priority
8. **MCP management** - Usually managed via backend directly
9. **Logout API call** - LocalStorage clear works

---

## Recommendations

### Immediate Fixes (Breaking Issues)

**1. Fix Positions Path:**
```typescript
// CHANGE FROM:
fetch(`${API_BASE_URL}/api/positions/${modelId}`)

// TO:
fetch(`${API_BASE_URL}/api/models/${modelId}/positions`)
```

**2. Add AdminStats Type:**
```typescript
export interface AdminStats {
  total_users: number
  total_models: number
  total_positions: number
  total_logs: number
  active_models: number
  admin_count: number
  user_count: number
}
```

**3. Add Missing Functions:**
```typescript
export async function fetchModelLogs(modelId: number, date?: string)
export async function fetchModelPerformance(modelId: number)
export async function fetchLeaderboard()
export async function updateUserRole(userId: string, role: 'admin' | 'user')
```

---

## Endpoint Coverage Matrix

| Category | Backend Count | Frontend Count | Coverage |
|----------|---------------|----------------|----------|
| Auth | 4 | 3 | 75% |
| Models | 4 | 4 | 100% |
| Positions | 2 | 2 | 100% (wrong path) |
| Logs | 1 | 0 | 0% |
| Performance | 1 | 0 | 0% |
| Trading | 5 | 5 | 100% |
| Admin | 5 | 3 | 60% |
| MCP | 3 | 0 | 0% |
| Stock Prices | 1 | 0 | 0% |
| Streaming | 1 | 1 | 100% |
| **TOTAL** | **27** | **18** | **67%** |

---

## Files to Fix

1. **`frontend/lib/api.ts`**
   - Fix positions paths
   - Add missing endpoint functions
   - Add logout function

2. **`frontend/types/api.ts`**
   - Add AdminStats interface
   - Add missing response types

---

## Impact Assessment

### Will Break (Fix Immediately)
- ❌ Positions display (404 error - wrong path)
- ❌ Admin stats TypeScript error

### Will Limit Features (Fix Soon)
- ⚠️ No logs viewing
- ⚠️ No performance metrics
- ⚠️ No leaderboard
- ⚠️ No user role management

### Nice to Have (Fix Later)
- ℹ️ MCP management UI
- ℹ️ Stock price display
- ℹ️ Proper logout API call

---

## Next Steps

### Step 1: Fix Breaking Issues
Run fix script to correct positions paths and add missing types

### Step 2: Add Missing Endpoints
Implement logs, performance, leaderboard, and admin functions

### Step 3: Test All Endpoints
Verify each function calls the correct backend path

### Step 4: Update Frontend Components
Ensure components use corrected API functions

---

## Verification Commands

```powershell
# Check backend endpoints
cd aibt-modded\backend
python -c "import main; print([r.path for r in main.app.routes])"

# Test frontend build
cd ..\frontend
npm run build
```

---

## Summary

The frontend API client has **good coverage** of core features (auth, models, trading) but has:
- 🚨 **2 critical path errors** (positions endpoints)
- 🚨 **1 TypeScript error** (missing AdminStats type)
- ⚠️ **8 missing endpoints** (logs, performance, leaderboard, etc.)

**Priority:** Fix positions paths immediately - this will cause 404 errors in production.

