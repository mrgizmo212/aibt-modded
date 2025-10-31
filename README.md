# AIBT - AI Trading Platform

**Production-ready FastAPI backend + Functional Next.js 16 frontend**

[![MCP 2025-06-18](https://img.shields.io/badge/MCP-2025--06--18%20Compliant-green)](https://modelcontextprotocol.io/specification/2025-06-18)
[![Backend](https://img.shields.io/badge/Backend-Production%20Ready-brightgreen)]()
[![Frontend](https://img.shields.io/badge/Frontend-Functional-yellow)]()

> **Note:** Backend is production-ready and MCP-compliant. Frontend is fully functional but undergoing UI/UX refinements.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Important Files Guide](#-important-files-guide)
- [Local Development Setup](#-local-development-setup)
- [Render Deployment](#-render-deployment)
- [API Documentation](#-api-documentation)
- [MCP Services](#-mcp-services)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- OpenRouter API key

### Local Development (5 minutes)

```powershell
# 1. Clone and navigate
cd C:\Users\Adam\Desktop\cs103125\aibt-modded

# 2. Start Backend (Terminal 1)
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
# → Backend: http://localhost:8080
# → MCP Services: ports 8000-8003

# 3. Start Frontend (Terminal 2)
cd frontend
npm install
npm run dev
# → Frontend: http://localhost:3000
```

**Login:**
- Email: `adam@truetradinggroup.com`
- Password: `adminpass123`

---

## 📖 Project Overview

AIBT is an AI-powered trading platform that allows users to:
- Create and manage AI trading models
- Execute daily and intraday trading strategies
- Monitor portfolio performance in real-time
- View AI reasoning and decision logs
- Compare strategies on a global leaderboard

### Architecture

```
┌──────────────────┐
│  Next.js 16      │  7 pages, type-safe, responsive
│  Frontend        │  Ports: 3000 (dev), 3100 (Stagewise)
└────────┬─────────┘
         │ REST API + JWT
         ▼
┌──────────────────┐
│  FastAPI         │  34 endpoints, MCP-compliant
│  Backend         │  Port: 8080
└────────┬─────────┘
         │ Supabase SDK
         ▼
┌──────────────────┐
│  PostgreSQL      │  6 tables, Row Level Security
│  (Supabase)      │  Multi-user isolation
└──────────────────┘

┌──────────────────┐
│  MCP Services    │  4 services, 6 tools
│  (Localhost)     │  Ports: 8000-8003
└──────────────────┘
```

---

## ✨ Key Features

### ✅ Implemented & Working

**Backend (Production-Ready):**
- ✅ 34 REST API endpoints (21 GET, 9 POST, 3 PUT, 1 DELETE)
- ✅ JWT authentication via Supabase
- ✅ Row Level Security for data isolation
- ✅ MCP 2025-06-18 compliant (Streamable HTTP)
- ✅ Concurrent multi-user support (verified)
- ✅ Daily + Intraday trading modes
- ✅ Real-time SSE event streaming

**Frontend (Functional):**
- ✅ User authentication (login/signup)
- ✅ Dashboard with model cards
- ✅ Create/Edit/Delete models
- ✅ Portfolio chart visualization
- ✅ Real-time trading feed (SSE)
- ✅ Performance metrics
- ✅ AI reasoning logs
- ✅ Admin panel
- ⚠️ UI/UX refinements ongoing

**MCP Services (100% Compliant):**
- ✅ Math service (add, multiply)
- ✅ Stock price service (get_price_local)
- ✅ Web search service (get_information via Jina AI)
- ✅ Trade execution service (buy, sell)

---

## 🛠 Technology Stack

### Backend
- **Framework:** FastAPI 0.104+
- **Server:** Uvicorn (ASGI)
- **Database:** Supabase PostgreSQL
- **AI Engine:** LangChain 1.0+
- **MCP:** FastMCP 2.0+ (compliant with 2025-06-18 spec)
- **Auth:** JWT via Supabase
- **Cache:** Upstash Redis (for intraday data)

### Frontend
- **Framework:** Next.js 16.0.1
- **React:** 19.2.0
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom components (type-safe)
- **Build Tool:** Turbopack

### Infrastructure
- **Database:** Supabase (PostgreSQL 15+)
- **MCP Transport:** Streamable HTTP (2025-06-18)
- **Deployment:** Render-ready (backend), Vercel-ready (frontend)

---

## 📂 Important Files Guide

### 🔑 Core Backend Files

**Entry Point:**
- `backend/main.py` - FastAPI app with 34 endpoints

**Configuration:**
- `backend/config.py` - Settings (Supabase, MCP ports, CORS)
- `backend/.env` - Environment variables (API keys, database URL)

**Business Logic:**
- `backend/services.py` - All database operations
- `backend/auth.py` - JWT validation and user management
- `backend/models.py` - Pydantic request/response models
- `backend/errors.py` - Custom exception classes

**AI Trading Engine:**
- `backend/trading/base_agent.py` - LangChain agent with MCP config
- `backend/trading/intraday_agent.py` - Minute-by-minute trading logic
- `backend/trading/agent_manager.py` - Manages running agents
- `backend/trading/mcp_manager.py` - MCP service lifecycle

**MCP Services (4 servers, 6 tools):**
- `backend/mcp_services/tool_math.py` - Math operations
- `backend/mcp_services/tool_get_price_local.py` - Price lookups
- `backend/mcp_services/tool_jina_search.py` - Web search
- `backend/mcp_services/tool_trade.py` - Buy/sell execution

**Database:**
- `backend/migrations/001_initial_schema.sql` - Complete schema with RLS
- `backend/migrations/009_add_model_parameters.sql` - AI config columns
- `backend/migrations/011_add_custom_rules.sql` - Custom trading rules

**Testing & Utilities:**
- `backend/scripts/test_mcp_concurrent_timeout.py` - MCP compliance test
- `backend/scripts/verify_overview_claims.py` - Codebase verification
- `backend/scripts/check_models.py` - List database models
- `backend/scripts/migrate_data.py` - JSONL → PostgreSQL migration

---

### 🔑 Core Frontend Files

**Pages (7 total):**
- `frontend/app/page.tsx` - Root redirect
- `frontend/app/login/page.tsx` - Login page
- `frontend/app/signup/page.tsx` - Signup page
- `frontend/app/dashboard/page.tsx` - User dashboard
- `frontend/app/models/create/page.tsx` - Create model form
- `frontend/app/models/[id]/page.tsx` - Model detail page
- `frontend/app/admin/page.tsx` - Admin panel

**Components:**
- `frontend/components/PortfolioChart.tsx` - SVG line chart (227 LOC)
- `frontend/components/TradingFeed.tsx` - SSE real-time feed (159 LOC)
- `frontend/components/PerformanceMetrics.tsx` - Metrics display
- `frontend/components/LogsViewer.tsx` - AI reasoning logs
- `frontend/components/ModelSettings.tsx` - Edit model modal

**Core Logic:**
- `frontend/lib/api.ts` - Type-safe API client (548 LOC)
- `frontend/lib/auth-context.tsx` - Auth state management
- `frontend/types/api.ts` - All TypeScript type definitions

**Configuration:**
- `frontend/.env.local` - Supabase keys, API URL
- `frontend/next.config.ts` - Next.js config (image domains)

---

### 🔑 Documentation (Source of Truth)

**Main Docs:**
- `docs/overview.md` - Complete platform documentation (THIS FILE)
- `docs/bugs-and-fixes.md` - All bugs with fixes and lessons learned
- `docs/wip.md` - Current work in progress

**Session Docs:**
- `docs/tempDocs/` - Working docs (consolidated at session end)

---

## 💻 Local Development Setup

### 1. Prerequisites

**Required:**
- Python 3.11 or higher
- Node.js 18 or higher
- Git
- Code editor (VS Code recommended)

**Accounts Needed:**
- Supabase account (free tier works)
- OpenRouter account (for AI trading)
- Jina AI account (for web search)
- Upstash Redis account (for intraday caching)

---

### 2. Clone Repository

```powershell
git clone <your-repo-url>
cd aibt-modded
```

---

### 3. Backend Setup

#### A. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project
3. Note your:
   - Project URL: `https://[project-ref].supabase.co`
   - Anon Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...` (Settings → API)
   - Database URL: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

#### B. Initialize Database

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:
   ```sql
   -- Run each file from backend/migrations/ in order:
   -- 001_initial_schema.sql
   -- 002_fix_trigger.sql
   -- ... through 011_add_custom_rules.sql
   ```

3. Create admin user:
   - Go to Authentication → Users
   - Click "Add User"
   - Email: `adam@truetradinggroup.com`
   - Password: `adminpass123`
   - Confirm Email (skip verification)

4. Set admin role:
   ```sql
   UPDATE profiles SET role = 'admin' 
   WHERE email = 'adam@truetradinggroup.com';
   ```

#### C. Configure Backend Environment

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=[your-jwt-secret]
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Backend
PORT=8080
DATA_DIR=./data

# CORS (dual-port support)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100

# AI Services
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-[your-openrouter-key]
JINA_API_KEY=jina_[your-jina-key]

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://[your-redis].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]

# MCP Service Ports
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003

# Trading Agent Config
AGENT_MAX_STEPS=30
AGENT_MAX_RETRIES=3
AGENT_BASE_DELAY=1.0
AGENT_INITIAL_CASH=10000.0

# Auth
AUTH_REQUIRE_EMAIL_CONFIRMATION=false
AUTH_APPROVED_LIST_PATH=./config/approved_users.json
```

#### D. Install Backend Dependencies

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### E. Start Backend

```powershell
# Make sure venv is activated
python main.py
```

**Expected output:**
```
🚀 AI-Trader API Starting...
📊 Environment: development
🔐 Auth: Enabled (Supabase)
🗄️  Database: PostgreSQL (Supabase)
🌐 CORS: http://localhost:3000,http://localhost:3100
🔧 Starting MCP services...
  ✅ Math started (PID: xxxxx)
  ✅ Search started (PID: xxxxx)
  ✅ Trade started (PID: xxxxx)
  ✅ Price started (PID: xxxxx)
✅ MCP services ready
✅ API Ready on port 8080
```

**Verify:**
- API Docs: http://localhost:8080/docs
- Health Check: http://localhost:8080/api/health

---

### 4. Frontend Setup

#### A. Configure Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### B. Install Frontend Dependencies

```powershell
cd frontend
npm install
```

#### C. Start Frontend

**Option 1: Main Development Server**
```powershell
npm run dev
```
→ Opens at http://localhost:3000

**Option 2: Stagewise (Cursor Extension)**
```powershell
npm run dev -- -p 3100
```
→ Opens at http://localhost:3100 (for design workflow)

**Access:**
- Dashboard: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

---

## 🚢 Render Deployment

### Backend Deployment on Render

#### 1. Create New Web Service

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:

**Settings:**
```
Name: aibt-backend
Region: Oregon (or closest to you)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### 2. Environment Variables

Add all from your `.env` file:

**Required:**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
DATABASE_URL
OPENAI_API_BASE
OPENAI_API_KEY
JINA_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

**Configuration:**
```
PORT=8080
DATA_DIR=./data
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003
AGENT_MAX_STEPS=30
AGENT_MAX_RETRIES=3
AGENT_BASE_DELAY=1.0
AGENT_INITIAL_CASH=10000.0
AUTH_REQUIRE_EMAIL_CONFIRMATION=false
AUTH_APPROVED_LIST_PATH=./config/approved_users.json
NODE_ENV=production
```

#### 3. Deploy

- Click "Create Web Service"
- Wait for deployment to complete
- Note your backend URL: `https://aibt-backend.onrender.com`

#### 4. Verify Deployment

```powershell
# Test health endpoint
curl https://aibt-backend.onrender.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "mcp_services": {...}
# }
```

---

### Frontend Deployment on Vercel (Recommended)

#### 1. Create New Project

1. Go to https://vercel.com/new
2. Import your repository
3. Configure:

**Settings:**
```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 2. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://aibt-backend.onrender.com
```

#### 3. Deploy

- Click "Deploy"
- Wait for build to complete
- Frontend will be at: `https://your-app.vercel.app`

#### 4. Update Backend CORS

Update `ALLOWED_ORIGINS` in Render backend:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000,http://localhost:3100
```

Redeploy backend for CORS changes to take effect.

---

### Alternative: Frontend on Render

If deploying frontend to Render instead of Vercel:

**Settings:**
```
Name: aibt-frontend
Runtime: Node
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
```

**Environment Variables:**
Same as Vercel setup above.

---

## 📚 API Documentation

### Interactive API Docs

**Local:**
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

**Production:**
- `https://your-backend.onrender.com/docs`

### Endpoint Categories

**Public (5):**
- Health checks
- Stock prices
- Model config
- Available AI models

**Auth (4):**
- Signup, Login, Logout, Get Me

**Models (5):**
- CRUD operations for AI models

**Trading (5):**
- Start/stop trading
- Intraday trading
- Status checks
- SSE stream

**Admin (10):**
- User management
- Global settings
- Leaderboard
- Platform stats
- MCP control

**Analytics (3):**
- Positions, Logs, Performance

**Full list:** See `docs/overview.md` Section 5

---

## 🔧 MCP Services

### What are MCP Services?

Model Context Protocol services provide tools for AI agents to use during trading decisions.

### Services & Ports

**Math Service** (port 8000)
- `add(a, b)` - Addition
- `multiply(a, b)` - Multiplication

**Stock Service** (port 8003)
- `get_price_local(symbol, date)` - Historical prices
- Timeout: 300s (handles 500K trade fetches)

**Search Service** (port 8001)
- `get_information(query)` - Web search via Jina AI
- Timeout: 180s

**Trade Service** (port 8002)
- `buy(symbol, amount)` - Execute buy
- `sell(symbol, amount)` - Execute sell

### MCP Compliance

✅ **100% Compliant with MCP Specification 2025-06-18**

- Transport: Streamable HTTP (POST + GET + SSE)
- Session management: `Mcp-Session-Id` headers
- Multi-client: Concurrent users supported
- Security: Localhost-only, CORS protected

**Verification:** Run `python backend/scripts/test_mcp_concurrent_timeout.py`

**Audit:** See `docs/tempDocs/MCP_COMPLIANCE_AUDIT.md`

---

## 🧪 Testing

### Run MCP Tests

```powershell
cd backend/scripts
python test_mcp_concurrent_timeout.py
```

**Tests:**
1. All services connect with proper timeouts ✅
2. Concurrent users work in isolation ✅
3. Long operations (300s) work without timeout ✅

### Verify Platform

```powershell
cd backend/scripts
python verify_overview_claims.py
```

**Verifies:**
- API endpoint count
- Frontend page count
- MCP services and tools
- Database tables
- Script organization

### Available Test Scripts (36 total)

See `backend/scripts/` for:
- MCP tests
- Redis connection tests
- OpenRouter API tests
- Cash validation tests
- Database migration tests
- Bug verification scripts

---

## 📖 Documentation

### Source of Truth (3 files only)

**Must Read:**
1. `docs/overview.md` - Complete platform documentation
2. `docs/bugs-and-fixes.md` - All bugs, fixes, and lessons learned
3. `docs/wip.md` - Current work in progress

**Working Docs:**
- `docs/tempDocs/` - Session-specific documentation
- Consolidated into main 3 docs at session end

### Key Documentation

**MCP Compliance:**
- `docs/tempDocs/MCP_COMPLIANCE_AUDIT.md`

**Recent Updates:**
- `docs/tempDocs/OVERVIEW_UPDATE_SUMMARY.md`

---

## 🔐 Security

### Multi-Layer Isolation

**1. Database Level (Supabase RLS)**
```sql
-- Users can only see their own models
CREATE POLICY "Users can view own models" ON public.models
  FOR SELECT USING (auth.uid() = user_id);
```

**2. API Level (FastAPI)**
```python
# Every endpoint checks ownership
model = await services.get_model_by_id(model_id, current_user["id"])
if not model:
    raise NotFoundError("Model")  # 404 if not owner
```

**3. Session Level (MCP)**
- Each user gets unique `Mcp-Session-Id`
- Sessions don't interfere
- Stateless services prevent cross-contamination

**Result:** User A cannot access User B's models, even with direct URL

---

## 🐛 Troubleshooting

### Backend Issues

**MCP Services Won't Start:**
```powershell
# Check if ports are in use
netstat -ano | findstr "8000"
netstat -ano | findstr "8001"
netstat -ano | findstr "8002"
netstat -ano | findstr "8003"

# Kill processes if needed
taskkill /PID [process-id] /F
```

**Database Connection Failed:**
- Check Supabase project is active
- Verify `DATABASE_URL` in `.env`
- Test connection: `python backend/scripts/TEST_SUPABASE_CONNECTION.py`

**MCP ReadTimeout:**
- Fixed in latest version (300s timeout)
- If still occurs, increase `sse_read_timeout` in `backend/trading/base_agent.py`

---

### Frontend Issues

**CORS Errors:**
- Check backend `ALLOWED_ORIGINS` includes your frontend URL
- Restart backend after CORS changes

**Login Fails:**
- Verify Supabase keys in `frontend/.env.local`
- Check user exists in Supabase Auth
- Verify user has profile in `profiles` table

**Page Not Found:**
- Ensure all pages exist in `frontend/app/`
- Check Next.js is running on correct port
- Clear `.next` cache: `rm -rf .next && npm run dev`

---

### Deployment Issues

**Render Build Fails:**
- Check `requirements.txt` has all dependencies
- Verify Python version: 3.11+
- Check logs in Render dashboard

**Environment Variables Missing:**
- Verify all required vars are set in Render
- Check for typos in variable names
- Restart service after adding vars

**MCP Services Not Working on Render:**
- MCP services run as separate processes
- Render free tier may not support this
- Consider using Render Background Workers for MCP services
- Or deploy MCP services separately

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch (optional for local testing)
2. Make changes
3. Test locally
4. Update documentation (`overview.md`, `bugs-and-fixes.md`)
5. Commit with descriptive message
6. Push to repository

### Commit Format

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: reorganize code
test: add tests
chore: maintenance tasks
```

---

## 📞 Support

**Issues:** Check `docs/bugs-and-fixes.md` for known issues and solutions

**Documentation:** See `docs/overview.md` for complete platform guide

**MCP Spec:** https://modelcontextprotocol.io/specification/2025-06-18

---

## 📄 License

[Add your license here]

---

## 🙏 Acknowledgments

- **MCP Protocol:** Model Context Protocol by Anthropic
- **FastMCP:** Python MCP SDK
- **LangChain:** AI agent framework
- **Supabase:** Database and authentication
- **OpenRouter:** Multi-model AI API
- **Jina AI:** Web search capabilities

---

**Last Updated:** 2025-10-31  
**Verified Against Codebase:** ✅ All claims code-verified

**Platform Status:**
- Backend: 🟢 Production-Ready
- Frontend: 🟡 Functional (refinements ongoing)

