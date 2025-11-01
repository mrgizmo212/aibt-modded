# Overview.md Verification Against Codebase

**Date:** 2025-10-31  
**Purpose:** Verify all claims in overview.md against actual code

## VERIFICATION RESULTS

### ✅ VERIFIED CLAIMS:

1. **Technology Stack - Frontend**
   - Next.js 16.0.1 ✅ (`frontend/package.json` line 13)
   - React 19.2.0 ✅ (`frontend/package.json` line 14)
   - TypeScript 5+ ✅ (`frontend/package.json` line 25)
   
2. **Technology Stack - Backend**
   - FastAPI 0.104+ ✅ (`backend/requirements.txt` line 6)
   - Uvicorn ✅ (`backend/requirements.txt` line 7)
   - Supabase 2.0+ ✅ (`backend/requirements.txt` line 11)
   - LangChain ✅ (`backend/requirements.txt` lines 34-37)
   - FastMCP 2.0+ ✅ (`backend/requirements.txt` line 37)

3. **Frontend Pages**
   - Login page ✅ (`frontend/app/login/page.tsx`)
   - Signup page ✅ (`frontend/app/signup/page.tsx`)
   - Dashboard ✅ (`frontend/app/dashboard/page.tsx`)
   - Model detail ✅ (`frontend/app/models/[id]/page.tsx`)
   - Model create ✅ (`frontend/app/models/create/page.tsx`)
   - Admin page ✅ (`frontend/app/admin/page.tsx`)

4. **MCP Services (4)**
   - Math ✅ (`backend/mcp_services/tool_math.py`)
   - Trade ✅ (`backend/mcp_services/tool_trade.py`)
   - Search ✅ (`backend/mcp_services/tool_jina_search.py`)
   - Stock/Price ✅ (`backend/mcp_services/tool_get_price_local.py`)

5. **Scripts Organized**
   - Backend scripts ✅ (35 files in `backend/scripts/`)
   - Root scripts ✅ (7 files in `scripts/`)

### ❌ CLAIMS TO VERIFY/UPDATE:

1. **API Endpoint Count**
   - CLAIM: "51 endpoints"
   - ACTUAL: 34 endpoints (counted from main.py)
   - **NEEDS UPDATE**

2. **Date References**
   - Many dates reference "2025-10-29"
   - Current work is "2025-10-31"
   - **NEEDS UPDATE**

3. **Development Paths**
   - Claims path: `C:\Users\User\Desktop\CS1027\aibt`
   - Actual path: `C:\Users\Adam\Desktop\cs103125\aibt-modded`
   - **NEEDS UPDATE**

4. **Frontend Port**
   - CLAIM: "http://localhost:3000"
   - ACTUAL: "http://localhost:3100" (per .env.local and recent work)
   - **NEEDS UPDATE**

5. **Test Coverage Percentage**
   - CLAIM: "98% passing"
   - NEEDS: Actual verification
   - **NEEDS VERIFICATION**

6. **Data Summary**
   - Claims about 7 models, 306 positions, 359 logs
   - This is historical data - need to verify current state
   - **NEEDS VERIFICATION**

7. **Directory Structure**
   - Shows old structure with tests in wrong location
   - Now reorganized with scripts/ folders
   - **NEEDS UPDATE**

8. **MCP Compliance**
   - Not mentioned in overview.md
   - Should add MCP 2025-06-18 compliance
   - **NEEDS ADDITION**

9. **Recent Fixes**
   - MCP timeout fix (2025-10-31)
   - Type safety improvements (2025-10-31)
   - CORS fix (2025-10-31)
   - **NEEDS ADDITION**

