# CONSOLIDATED SOURCE OF TRUTH - AIBT Platform

**Generated:** 2025-10-30  
**Consolidated From:** 15 fragmented documentation files + WHAT_IS_NEXT.md  
**Status:** ⚠️ ALL CLAIMS REQUIRE CODE VERIFICATION

---

## ⚠️ VERIFICATION STATUS

This document consolidates multiple AI-generated dev session notes. All claims are marked with confidence levels and require verification against actual code in Phase 2.

**Confidence Levels:**
- ✅ HIGH: Multiple sources agree, references specific files, initial code verification confirms
- ⚠️ MEDIUM: Single source, or minor contradictions, some code verification
- ❌ LOW: Contradictory sources, vague claims, or from WHAT_IS_NEXT.md only, unverified

**Sources Consolidated:**
- WHAT_IS_NEXT.md (AI session summary - treat skeptically)
- BACKEND_COMPLETE.md, BACKEND_VERIFICATION_REPORT.md
- IMPLEMENTATION_STATUS.md, FINAL_STATUS_REPORT.md
- FRONTEND_BLUEPRINT.md (2,559 lines), FRONTEND_COMPREHENSIVE_AUDIT.md
- FULL_PLATFORM_ARCHITECTURE.md, PLATFORM_COMPLETE.md
- SESSION_SUMMARY.md, COMPLETE_SYSTEMATIC_WORKFLOW.md
- CONTINUE_FRONTEND.md, START_PLATFORM.md
- FUTURE_TTG_INTEGRATION.md, nextjs16-features.md
- overview.md, bugs-and-fixes.md, wip.md

---

## 1. ARCHITECTURE & STRUCTURE

### 1.1 Overall Architecture

**Claim**: Three-tier full-stack application with FastAPI backend, Next.js 16 frontend, Supabase PostgreSQL database
- **Sources**: Multiple (WHAT_IS_NEXT.md, overview.md, FULL_PLATFORM_ARCHITECTURE.md)
- **Confidence**: ✅ HIGH
- **Files Referenced**: `/backend/main.py`, `/frontend/app/layout.tsx`
- **Code Verification**: ✅ CONFIRMED
  - `main.py` exists with FastAPI app initialization (lines 1-87)
  - Modern `@asynccontextmanager` lifespan pattern (lines 50-64)
  - Supabase client initialization (line 86)
  - CORS middleware configured (lines 76-83)

**Architecture Pattern**:
```
[Next.js 16 Frontend :3000]
         ↓ HTTP REST + JWT
[FastAPI Backend :8080]
         ↓ Supabase SDK
[PostgreSQL + RLS]
```

### 1.2 Technology Stack

**Backend:**
- **Framework**: FastAPI (✅ VERIFIED - imported in main.py line 6)
- **Database**: Supabase PostgreSQL (✅ VERIFIED - config.py lines 21-25)
- **Auth**: JWT via Supabase (✅ VERIFIED - auth.py imported in main.py line 15)
- **AI**: LangChain + OpenRouter + MCP (⚠️ PARTIAL - trading/ directory exists, not fully verified)

**Frontend:**
- **Framework**: Next.js 16 (⚠️ CLAIMED - need to verify package.json)
- **React**: 19.2 (⚠️ CLAIMED - need to verify package.json)
- **Bundler**: Turbopack (⚠️ CLAIMED - need to verify next.config.ts)
- **UI**: Shadcn UI + Tailwind CSS (⚠️ PARTIAL - need to verify)

**Confidence**: ✅ HIGH for backend stack, ⚠️ MEDIUM for frontend specifics

---

## 2. API ENDPOINTS

### 2.1 Endpoint Count CONTRADICTION

**CRITICAL CONTRADICTION DETECTED:**

**Claim A**: "51 API endpoints total"
- **Sources**: Multiple (WHAT_IS_NEXT.md, overview.md, BACKEND_VERIFICATION_REPORT.md)
- **Evidence**: "Total Tests: 51" appears in multiple docs

**Claim B**: "27 endpoints counted in main.py"
- **Source**: Direct code analysis (grep results)
- **Evidence**: 27 `@app.` decorators found in main.py

**Analysis**:
- Docs may be counting:
  - GET/POST/PUT/DELETE as separate endpoints even for same route
  - Helper endpoints not decorated with `@app.`
  - Endpoints across multiple files
- OR actual endpoint count is 27 and docs inflated the number

**Resolution Required**: ⚠️ Count ALL route definitions across ALL files
**Status**: UNRESOLVED - needs full code verification

### 2.2 Verified Endpoints (from main.py grep)

**Public (3):**
- ✅ `GET /` - Health check (line 93)
- ✅ `GET /api/health` - Detailed health (line 105)
- ✅ `GET /api/stock-prices` - Stock data (line 480)

**Authentication (5):**
- ✅ `POST /api/auth/signup` (line 119)
- ✅ `POST /api/auth/login` (line 188)
- ✅ `POST /api/auth/logout` (line 225)
- ✅ `GET /api/auth/me` (line 238)
- ✅ `PUT /api/admin/users/{user_id}/role` (line 456)

**User Endpoints (9):**
- ✅ `GET /api/models` (line 256)
- ✅ `POST /api/models` (line 267)
- ✅ `GET /api/models/{model_id}/positions` (line 286)
- ✅ `GET /api/models/{model_id}/positions/latest` (line 316)
- ✅ `GET /api/models/{model_id}/logs` (line 351)
- ✅ `GET /api/models/{model_id}/performance` (line 373)
- ✅ `POST /api/trading/start/{model_id}` (line 538)
- ✅ `POST /api/trading/stop/{model_id}` (line 566)
- ✅ `GET /api/trading/status/{model_id}` (line 581)
- ✅ `GET /api/trading/status` (line 602)

**Admin Endpoints (7):**
- ✅ `GET /api/admin/users` (line 415)
- ✅ `GET /api/admin/models` (line 426)
- ✅ `GET /api/admin/leaderboard` (line 437)
- ✅ `GET /api/admin/stats` (line 448)
- ✅ `POST /api/mcp/start` (line 627)
- ✅ `POST /api/mcp/stop` (line 634)
- ✅ `GET /api/mcp/status` (line 641)

**Total Verified in main.py**: 27 endpoints
**Confidence**: ✅ HIGH - directly verified in code

---

## 3. DATABASE SCHEMA

**Claim**: 6 tables with Row Level Security
- **Sources**: Multiple sources agree
- **Confidence**: ✅ HIGH
- **Verify Against**: `backend/migrations/*.sql` files

**Tables Claimed:**
1. `profiles` - User accounts with roles
2. `models` - AI trading configurations
3. `positions` - Trading history
4. `logs` - AI reasoning (messages field)
5. `stock_prices` - Historical prices
6. `performance_metrics` - Cached calculations

**Recent Schema Changes Claimed:**
- Added `original_ai` column to models (tracks which AI originally traded)
- Added `updated_at` column to models (with trigger)

**Status**: ⚠️ MEDIUM - need to verify migration files

---

## 4. TEST RESULTS CONTRADICTION

### 4.1 The Contradiction

**Version A: 100% Pass Rate**
- **Sources**: BACKEND_VERIFICATION_REPORT.md, PLATFORM_COMPLETE.md
- **Claims**: "51 tests, 51 passed, 0 failed"
- **Quote**: "Total Endpoints Tested: 51, ✅ Passed: 51, ❌ Failed: 0, Success Rate: 100%"

**Version B: 98% Pass Rate**
- **Sources**: IMPLEMENTATION_STATUS.md, FINAL_STATUS_REPORT.md, overview.md, wip.md
- **Claims**: "51 tests, 50 passed, 1 failed (token expiry - non-critical)"
- **Quote**: "Total Tests: 51, Passed: 50, Failed: 1 (token expiry - non-critical), Success Rate: 98%"

### 4.2 Analysis

**Possible Explanations:**
1. Tests were run at different times (Version A before, Version B after)
2. One token expiry test started failing
3. Documentation error - one set of docs is wrong

**Resolution**: ⚠️ MUST run actual test file (`backend/test_all.ps1`) and verify results
**Status**: UNRESOLVED

---

## 5. CRITICAL BUGS CLAIMED FIXED

### 5.1 BUG-001: Portfolio Value Calculation

**Severity**: Critical  
**Date Discovered**: 2025-10-29 16:30  
**Date Fixed**: 2025-10-29 17:45  
**Status**: ✅ CLAIMED FIXED

**Symptoms Documented:**
- Portfolio total_value showed only cash ($18.80)
- Stock holdings ignored in calculation
- Returns showed -99.81% (wrong)

**Root Cause Documented:**
- `backend/services.py`: `get_latest_position()` not calculating stock values
- `backend/main.py`: Endpoint explicitly returned cash for total_value

**Fix Applied (Documented):**
- Modified `services.py` (lines 141-184) to calculate stock values
- Added price lookup and valuation logic
- Modified `main.py` (lines 339-347) to use calculated total

**Verification Needed:**
- ⚠️ Read `backend/services.py` lines 141-184 and verify fix exists
- ⚠️ Read `backend/main.py` lines 339-347 and verify change
- ⚠️ Check if `PROVE_CALCULATION.py` script exists and what it shows

**Confidence**: ⚠️ MEDIUM - detailed documentation but unverified in actual code

### 5.2 BUG-002: Log Migration

**Severity**: High  
**Date Discovered**: 2025-10-29 18:00  
**Date Fixed**: 2025-10-29 19:15  
**Status**: ✅ CLAIMED FIXED

**Symptoms Documented:**
- 0 of 359 logs migrated (0% success initially)
- Users couldn't see AI reasoning

**Root Cause Documented:**
- `backend/FIX_LOG_MIGRATION.py` missing `load_dotenv()`
- Environment variables not loaded
- Null timestamp handling issues
- Pydantic model mismatch (`messages` field)

**Fix Applied (Documented):**
- Added `load_dotenv()` to FIX_LOG_MIGRATION.py
- Fixed null timestamp handling
- Changed `models.py` messages field from `Dict[str, Any]` to `Any`

**Result Claimed:**
- 359/359 logs migrated (100% success)
- All 7 models verified

**Verification Needed:**
- ⚠️ Read `backend/FIX_LOG_MIGRATION.py` and verify load_dotenv() exists
- ⚠️ Read `backend/models.py` and check messages field type
- ⚠️ Check if verification scripts exist (TEST_LOG_MIGRATION.py, VERIFY_LOG_MIGRATION.py)

**Confidence**: ⚠️ MEDIUM - detailed documentation but unverified

---

## 6. DATA SUMMARY

**Claim**: Current database state
- **3 users**: 1 admin (adam@truetradinggroup.com), 2 regular
- **7 AI models**: After cleanup (was 14, deleted 7 test models)
- **306 trading positions**
- **359 AI reasoning logs**: After migration fix (was 0)
- **10,100+ stock prices**: NASDAQ 100 historical data

**Model List Claimed:**
1. claude-4.5-sonnet - 67 positions, 37 logs
2. deepseek-deepseek-v3.2-exp - 50 positions, 112 logs
3. google-gemini-2.5-pro - 37 positions, 38 logs
4. minimax-minimax-m1 - 44 positions, 107 logs
5. openai-gpt-4.1 - 23 positions, 4 logs
6. openai-gpt-5 - 34 positions, 19 logs
7. qwen3-max - 51 positions, 42 logs

**Status**: ❌ LOW - Cannot verify without database access, purely from documentation

---

## 7. FRONTEND STATUS

### 7.1 Core Pages Claimed Built

**Claimed Complete:**
- ✅ `/login` - Login page
- ✅ `/signup` - Signup page
- ✅ `/dashboard` - User dashboard
- ✅ `/models/[id]` - Model detail page
- ✅ `/admin` - Admin dashboard

**Files Claimed to Exist:**
- `frontend/app/login/page.tsx`
- `frontend/app/signup/page.tsx`
- `frontend/app/dashboard/page.tsx`
- `frontend/app/models/[id]/page.tsx`
- `frontend/app/admin/page.tsx`
- `frontend/app/layout.tsx` (root layout with dark theme)
- `frontend/lib/api.ts` (API client)
- `frontend/lib/auth-context.tsx` (Auth provider)
- `frontend/lib/constants.ts` (Display names)
- `frontend/types/api.ts` (TypeScript types)

**Status**: ⚠️ MEDIUM - file list confirms these files exist, need to read and verify functionality

### 7.2 Optional Pages (Claimed Not Built)

**Remaining:**
- ❌ `/models/create` - Create model form
- ❌ `/profile` - User profile page
- ❌ `/models/[id]/logs` - Log viewer page

**Status**: Documented as "nice to have, not critical"

---

## 8. EXTERNAL PROJECTS

### 8.1 Context-Only (Project 1)

**Purpose**: Stock trading simulator showing tick-by-tick replay
- **Location**: `aibt/context-only/`
- **Tech Stack**: Next.js app with Polygon.io integration
- **Key Learnings Documented**:
  - Pattern for fetching tick data with pagination
  - Aggregating trades to bars
  - IndexedDB caching strategy
  - Nanosecond timestamp handling

**Integration with AIBT**: Reference only, demonstrates data fetching patterns
**Status**: ⚠️ MEDIUM - directory exists with ~70 files, claimed as context only

### 8.2 Context-Only2 (Project 2) 

**Purpose**: AI-Trader original project (GitHub: HKUDS/AI-Trader)
- **Location**: `aibt/context-only2/`
- **Contains**: Original AI trading agent code, data files, JSONL logs
- **Key Components**:
  - `agent/base_agent/base_agent.py` - Original AI agent
  - `agent_tools/` - MCP services (math, search, trade, price)
  - `data/agent_data/` - 7 AI model trading history
  - `tools/` - Utility functions

**Integration with AIBT**: Code copied from here to `aibt/backend/trading/`
**Status**: ✅ HIGH - verified directory exists with ~600 files

### 8.3 Integration Pattern

**Claim**: AIBT backend copied core components from context-only2
- `backend/trading/base_agent.py` ← copied from `context-only2/agent/base_agent/base_agent.py`
- `backend/trading/agent_prompt.py` ← copied from `context-only2/prompts/agent_prompt.py`
- `backend/mcp_services/*.py` ← copied from `context-only2/agent_tools/*.py`
- `backend/utils/*.py` ← copied from `context-only2/tools/*.py`

**Status**: ⚠️ MEDIUM - need to verify files exist and compare content

---

## 9. CONTRADICTIONS REQUIRING RESOLUTION

### 9.1 Test Results

**Contradiction**: 51/51 passed (100%) vs. 50/51 passed (98%)
- **Priority**: HIGH
- **Resolution**: Run `backend/test_all.ps1` and observe actual results
- **Impact**: Affects confidence in testing claims

### 9.2 Endpoint Count

**Contradiction**: 51 endpoints claimed vs. 27 found in main.py
- **Priority**: HIGH
- **Resolution**: Search for additional route definitions, count properly
- **Impact**: Affects architectural understanding

### 9.3 Log Migration Status

**Contradiction**: Some docs say 23 logs initially, others say 0 logs initially
- **Priority**: MEDIUM
- **Resolution**: Check database state or migration scripts
- **Impact**: Affects understanding of data migration success

---

## 10. FILES TO VERIFY IN PHASE 2

**HIGH PRIORITY** (Critical for understanding):

Backend Core:
- [ ] `/backend/main.py` (664 lines) - Complete read needed
- [ ] `/backend/services.py` - Verify BUG-001 fix (lines 141-184)
- [ ] `/backend/auth.py` - Authentication implementation
- [ ] `/backend/models.py` - Verify messages field type (BUG-002 fix)
- [ ] `/backend/config.py` - ✅ VERIFIED (138 lines read)

Backend Trading:
- [ ] `/backend/trading/base_agent.py` - AI agent core
- [ ] `/backend/trading/agent_manager.py` - Agent lifecycle
- [ ] `/backend/trading/mcp_manager.py` - MCP service control
- [ ] `/backend/trading/agent_prompt.py` - Trading prompts

Backend MCP Services:
- [ ] `/backend/mcp_services/tool_trade.py`
- [ ] `/backend/mcp_services/tool_get_price_local.py`
- [ ] `/backend/mcp_services/tool_jina_search.py`
- [ ] `/backend/mcp_services/tool_math.py`

Database:
- [ ] `/backend/migrations/*.sql` (5 files) - Schema verification
- [ ] `/backend/migrate_data.py` - Data migration script

Testing & Verification:
- [ ] `/backend/test_all.ps1` - ⚠️ CRITICAL: Resolve test count contradiction
- [ ] `/backend/PROVE_CALCULATION.py` - BUG-001 verification
- [ ] `/backend/FIX_LOG_MIGRATION.py` - BUG-002 fix
- [ ] `/backend/VERIFY_LOG_MIGRATION.py` - BUG-002 verification

**MEDIUM PRIORITY**:

Frontend Core:
- [ ] `/frontend/app/layout.tsx`
- [ ] `/frontend/app/login/page.tsx`
- [ ] `/frontend/app/signup/page.tsx`
- [ ] `/frontend/app/dashboard/page.tsx`
- [ ] `/frontend/app/models/[id]/page.tsx`
- [ ] `/frontend/app/admin/page.tsx`
- [ ] `/frontend/lib/api.ts`
- [ ] `/frontend/lib/auth-context.tsx`
- [ ] `/frontend/types/api.ts`
- [ ] `/frontend/package.json` - Verify Next.js 16, React 19.2 versions

Configuration:
- [ ] `/backend/.env` - Check what keys are actually configured
- [ ] `/backend/config/approved_users.json` - Verify user whitelist
- [ ] `/frontend/.env.local` - Frontend config

**LOW PRIORITY**:

Documentation Cross-Reference:
- [ ] Compare claims in docs with actual code findings
- [ ] External project comparison (context-only2 vs aibt/backend/trading)

---

## 11. CONSOLIDATION METADATA

**Files Consolidated**: 15 fragmented docs + 3 main docs = 18 total
**Claims Extracted**: ~150 distinct claims
**Claims by Confidence**:
- ✅ HIGH: ~30 (20%) - Verified in code
- ⚠️ MEDIUM: ~80 (53%) - Multiple sources, not verified
- ❌ LOW: ~40 (27%) - Single source or contradicted

**Critical Contradictions Found**: 3
1. Test results (100% vs 98%)
2. Endpoint count (51 vs 27)
3. Initial log count (23 vs 0)

**Major Gaps**:
- No database access to verify data claims
- Frontend functionality not tested
- Bug fix code not fully verified
- External project integration not validated

**Next Steps**: 
1. Complete Phase 2 code verification
2. Run actual tests (test_all.ps1)
3. Resolve contradictions
4. Generate final Phase 3 report with 100% verified claims

---

**END OF CONSOLIDATED SOURCE OF TRUTH**

*This document will be updated as Phase 2 code verification progresses.*

