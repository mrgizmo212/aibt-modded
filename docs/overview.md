# TTG AI Platform - Trading System PT 1

**Last Updated:** 2025-11-01 17:50 (Added shadcn MCP Server with 5 custom component registries: @prompt-kit, @react-bits, @magicui, @elements, @animate-ui)  
**Status:** 🟢 Backend Production-Ready + Advanced Features | 🟡 Frontend Functional (UI refinements ongoing)  
**MCP Compliance:** ✅ 100% Compliant with MCP 2025-06-18 Specification  
**Blueprint Status:** ✅ 100% Implemented (Run tracking, AI reasoning, System agent, Rules engine)

---

## 1. PROJECT DESCRIPTION

**TTG AI** is an **AI trading platform** built with a production-ready FastAPI backend and functional Next.js 16 frontend. The backend is fully tested and MCP-compliant; the frontend provides all core features but requires UI/UX refinement for production deployment.

### What It Does:
- **Control** AI trading agents (start/stop trading)
- **Monitor** real-time trading activity and positions
- **Visualize** portfolio performance across 7 AI models
- **Analyze** detailed AI reasoning logs
- **Track** trading sessions with run-based organization
- **Chat** with AI strategy analyst about trading performance
- **Enforce** structured trading rules programmatically
- **Manage** MCP services (Math, Search, Trade, Price)
- **Compare** AI strategies via global leaderboard
- **Administer** users and permissions

### Target Users:
- **Traders:** Monitor AI trading performance
- **Researchers:** Analyze AI decision-making
- **Developers:** Test and compare strategies
- **Admins:** Manage platform and users

---

## 2. ARCHITECTURE

### High-Level Pattern:
**Modern Three-Tier Full-Stack Application**

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js 16 Frontend                         │
│  - App Router with Server Components                        │
│  - React 19.2                                                │
│  - Shadcn UI (Dark Theme)                                    │
│  - TypeScript                                                │
│  - Mobile-First Responsive                                   │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP REST API + JWT Auth
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                            │
│  - 38 REST API endpoints (24 GET, 10 POST, 3 PUT, 1 DELETE) │
│  - JWT authentication via Supabase                           │
│  - Admin authorization with RLS                              │
│  - AI Trading Engine (LangChain + MCP 2025-06-18)            │
│  - System Agent (conversational strategy analyst)            │
│  - Rule Enforcement Engine (structured rules + risk gates)   │
│  - MCP service management (4 services, 6 tools)              │
└────────────────┬────────────────────────────────────────────┘
                 │ Supabase Client SDK
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                    │
│  - profiles (users with roles)                               │
│  - models (AI trading configurations)                        │
│  - positions (portfolio history)                             │
│  - logs (AI reasoning - 359 entries)                         │
│  - stock_prices (10,100+ prices)                             │
│  - performance_metrics (calculated on-demand)                │
│  - trading_runs (session tracking with run numbers)          │
│  - ai_reasoning (complete audit trail)                       │
│  - model_rules (structured enforceable rules)                │
│  - chat_sessions & chat_messages (strategy discussions)      │
│  - user_trading_profiles (risk parameters)                   │
│  - Row Level Security (RLS) for data privacy                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions:

1. **Supabase as Single Source of Truth** - All data in PostgreSQL
2. **Row Level Security** - Database-level user isolation
3. **JWT Authentication** - Secure token-based auth
4. **Admin Authorization** - Role-based access control
5. **Modern Next.js 16** - Turbopack, PPR, React 19
6. **AI Trading Integration** - Full control of agents and MCP services
7. **Mobile-First** - Responsive design for all devices

---

## 3. TECHNOLOGY STACK

### Backend (FastAPI):
- **Framework:** FastAPI 0.115+
- **Server:** Uvicorn (ASGI)
- **Database:** Supabase PostgreSQL
- **Auth:** JWT tokens via Supabase
- **AI:** LangChain + OpenRouter + MCP
- **Dependencies:**
  - `fastapi`
  - `uvicorn`
  - `supabase-py`
  - `python-dotenv`
  - `pydantic`
  - `langchain`
  - `langchain-openai`
  - `langchain-mcp-adapters`
  - `fastmcp`

### Frontend (Next.js):
- **Framework:** Next.js 16 (October 2025 release)
  - **Bundler:** Turbopack (default - fast builds)
  - **Rendering:** Partial Pre-Rendering (PPR)
  - **React:** 19.2
- **Language:** TypeScript 5+
- **UI Library:** Shadcn UI (Radix + Tailwind)
- **Styling:** Tailwind CSS (dark theme)
- **Auth:** Supabase Auth client
- **HTTP:** Native fetch API
- **MCP Integration:** shadcn MCP Server (Cursor-compatible)
  - **Config:** `.cursor/mcp.json`
  - **Component Registry:** `components.json`
  - **Natural Language Component Installation**
  - **6 Total Registries:** shadcn + 5 custom (@prompt-kit, @react-bits, @magicui, @elements, @animate-ui)

### Database (Supabase):
- **Type:** PostgreSQL 15+
- **Auth:** Built-in Supabase Auth
- **Security:** Row Level Security (RLS)
- **Real-time:** Available (not yet used)

---

## 4. DIRECTORY STRUCTURE

```
aibt-modded/
├── backend/                          # FastAPI Backend (100% Complete)
│   ├── main.py                       # FastAPI app (38 endpoints)
│   ├── config.py                     # Settings with AI config
│   ├── models.py                     # Pydantic models
│   ├── services.py                   # Business logic
│   ├── auth.py                       # JWT validation
│   ├── errors.py                     # Custom exceptions
│   ├── streaming.py                  # SSE event streaming
│   ├── pagination.py                 # Pagination helpers
│   ├── intraday_loader.py            # Intraday data fetching
│   │
│   ├── trading/                      # AI Trading Engine
│   │   ├── base_agent.py             # LangChain agent (MCP 2025-06-18)
│   │   ├── intraday_agent.py         # Intraday trading agent
│   │   ├── agent_manager.py          # Agent lifecycle
│   │   ├── mcp_manager.py            # MCP service control
│   │   └── agent_prompt.py           # Trading prompts
│   │
│   ├── mcp_services/                 # 4 MCP Services (6 Tools)
│   │   ├── tool_math.py              # Math: add, multiply
│   │   ├── tool_jina_search.py       # Search: get_information
│   │   ├── tool_trade.py             # Trade: buy, sell
│   │   ├── tool_get_price_local.py   # Price: get_price_local
│   │   └── start_mcp_services.py     # Service startup (legacy)
│   │
│   ├── services/                     # Backend Services (NEW)
│   │   ├── run_service.py            # Trading run management
│   │   ├── reasoning_service.py      # AI reasoning logging
│   │   └── chat_service.py           # Chat session management
│   │
│   ├── agents/                       # System Agent (NEW)
│   │   ├── system_agent.py           # Conversational strategy analyst
│   │   └── tools/                    # Agent tools
│   │       ├── analyze_trades.py     # Trade analysis
│   │       ├── suggest_rules.py      # Rule suggestions
│   │       └── calculate_metrics.py  # Performance metrics
│   │
│   ├── utils/                        # Utilities
│   │   ├── general_tools.py          # Helper functions
│   │   ├── price_tools.py            # Price utilities
│   │   ├── result_tools.py           # Performance calculations
│   │   ├── model_config.py           # AI model configurations
│   │   ├── settings_manager.py       # Settings management
│   │   ├── redis_client.py           # Upstash Redis client
│   │   ├── rule_enforcer.py          # Rule enforcement engine (NEW)
│   │   └── risk_gates.py             # Hard-coded safety gates (NEW)
│   │
│   ├── migrations/                   # Database migrations (15 files)
│   │   ├── 001_initial_schema.sql
│   │   ├── 009_add_model_parameters.sql
│   │   ├── 010_add_global_settings.sql
│   │   ├── 011_add_custom_rules.sql
│   │   ├── 012_add_run_tracking.sql     # Run tracking & AI reasoning (NEW)
│   │   ├── 013_structured_rules.sql     # Structured rules system (NEW)
│   │   ├── 014_chat_system.sql          # Chat sessions (NEW)
│   │   └── 015_user_profiles_advanced.sql # User profiles & advanced trading (NEW)
│   │
│   ├── scripts/                      # Testing & Utility Scripts (36 files)
│   │   ├── test_mcp_concurrent_timeout.py
│   │   ├── test_redis_connection.py
│   │   ├── check_models.py
│   │   ├── migrate_data.py
│   │   ├── verify_overview_claims.py
│   │   └── ... (31 more test/utility scripts)
│   │
│   └── requirements.txt              # Python dependencies
│
├── frontend/                         # Next.js 16 (100% Complete)
│   ├── app/                          # App Router (8 pages + 1 shared layout)
│   │   ├── layout.tsx                # Dark theme layout (shared wrapper, not a page)
│   │   ├── page.tsx                  # Root redirect
│   │   ├── login/page.tsx            # Login page
│   │   ├── signup/page.tsx           # Signup page
│   │   ├── dashboard/page.tsx        # User dashboard
│   │   ├── models/create/page.tsx    # Create model form
│   │   ├── models/[id]/page.tsx      # Model detail
│   │   ├── models/[id]/r/[run]/page.tsx # Run detail + Chat (NEW)
│   │   └── admin/page.tsx            # Admin dashboard
│   │
│   ├── components/                   # React Components
│   │   ├── PerformanceMetrics.tsx
│   │   ├── PortfolioChart.tsx
│   │   ├── LogsViewer.tsx
│   │   ├── ModelSettings.tsx
│   │   ├── TradingFeed.tsx
│   │   ├── ChatInterface.tsx         # System agent chat (NEW)
│   │   └── RunData.tsx               # Run details display (NEW)
│   │
│   ├── lib/                          # Utilities
│   │   ├── api.ts                    # API client (type-safe)
│   │   ├── auth-context.tsx          # Auth provider
│   │   └── constants.ts              # Display names
│   │
│   ├── types/
│   │   └── api.ts                    # TypeScript type definitions
│   │
│   ├── package.json                  # Dependencies (Next 16, React 19.2)
│   └── next.config.ts                # Next.js config
│
├── scripts/                          # Root-Level Scripts (7 files)
│   ├── start_backend.ps1             # Start backend server
│   ├── start_frontend.ps1            # Start frontend server
│   ├── PUSH_TO_GITHUB_FIXED.ps1      # Git push automation
│   ├── test_everything.py            # Comprehensive tests
│   └── ... (3 more)
│
└── docs/                             # Documentation (Source of Truth)
    ├── overview.md                   # This file
    ├── bugs-and-fixes.md             # Bug history with dates
    ├── wip.md                        # Current work tracking
    └── tempDocs/                     # Session working docs
        ├── MCP_COMPLIANCE_AUDIT.md
        └── ... (session-specific docs)
```

---

## 5. API ENDPOINTS (38 Total - Verified)

**Base URL:** `http://localhost:8080`  
**Auth:** JWT tokens via Supabase  
**Breakdown:** 24 GET, 10 POST, 3 PUT, 1 DELETE

**Evidence:** `backend/main.py` Lines 125-1172 - All endpoints verified via code inspection and grep

### Public Endpoints (4):
- `GET /` - Root health check
- `GET /api/health` - Detailed health status
- `GET /api/stock-prices` - Historical stock prices
- `GET /api/model-config` - AI model configuration
- `GET /api/available-models` - List available AI models

### Authentication (4):
- `POST /api/auth/signup` - Create account (whitelist required)
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user profile

### User Model Management (5):
- `GET /api/models` - List user's models
- `POST /api/models` - Create new model
- `PUT /api/models/{id}` - Update model
- `DELETE /api/models/{id}` - Delete model
- `GET /api/models/{id}/positions` - Position history (paginated)

### Model Data & Analytics (3):
- `GET /api/models/{id}/positions/latest` - Current position
- `GET /api/models/{id}/logs` - AI reasoning logs (by date)
- `GET /api/models/{id}/performance` - Performance metrics

### Run Management & Analysis (4 - NEW):
- `GET /api/models/{id}/runs` - List all trading runs for a model
- `GET /api/models/{id}/runs/{run_id}` - Get detailed run information
- `POST /api/models/{id}/runs/{run_id}/chat` - Chat with system agent about run
- `GET /api/models/{id}/runs/{run_id}/chat-history` - Get chat message history
**Evidence:** `backend/main.py` Lines 1060, 1073, 1091, 1153

### Trading Operations (6):
- `GET /api/trading/status` - All agent statuses
- `GET /api/trading/status/{id}` - Single model status
- `POST /api/trading/start/{id}` - Start daily trading
- `POST /api/trading/start-intraday/{id}` - Start intraday trading
- `POST /api/trading/stop/{id}` - Stop trading
- `GET /api/trading/stream/{id}` - SSE event stream

### Admin Endpoints (10):
- `GET /api/admin/users` - List all users
- `GET /api/admin/models` - List all models
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/leaderboard` - Global model rankings
- `GET /api/admin/global-settings` - All global settings
- `GET /api/admin/global-settings/{key}` - Get setting by key
- `PUT /api/admin/global-settings/{key}` - Update global setting
- `PUT /api/admin/users/{id}/role` - Update user role
- `GET /api/mcp/status` - MCP service status
- `POST /api/mcp/start` - Start MCP services
- `POST /api/mcp/stop` - Stop MCP services

**Proof:** Verified via grep and code inspection on 2025-11-01

---

## 6. DATABASE SCHEMA

### Tables (12 Total):

**Original Tables (6):**

**profiles** - User accounts
```sql
- id (UUID, primary key)
- email (TEXT)
- role (TEXT: 'admin' | 'user')
- display_name (TEXT)
- avatar_url (TEXT)
- created_at (TIMESTAMPTZ)
```

**models** - AI trading configurations
```sql
- id (SERIAL, primary key)
- user_id (UUID, foreign key → profiles)
- name (TEXT)
- signature (TEXT, unique)
- description (TEXT)
- is_active (BOOLEAN)
- initial_cash (NUMERIC) - Starting capital
- allowed_tickers (TEXT[]) - Restricted symbol list
- default_ai_model (TEXT) - AI model ID (e.g., openai/gpt-5-pro)
- model_parameters (JSONB) - AI parameters (temp, verbosity, etc.)
- custom_rules (TEXT) - Custom trading rules
- custom_instructions (TEXT) - Custom AI instructions
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ) - Auto-updated by trigger
```
**Evidence:** `backend/migrations/001_initial_schema.sql`, `009_add_model_parameters.sql`, `011_add_custom_rules.sql`

**positions** - Trading history
```sql
- id (SERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- user_id (UUID, foreign key → profiles)
- date (DATE)
- action_id (INTEGER)
- action_type (TEXT)
- symbol (TEXT)
- amount (NUMERIC)
- positions (JSONB)
- cash (NUMERIC)
- created_at (TIMESTAMPTZ)
```

**logs** - AI reasoning
```sql
- id (SERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- date (DATE)
- timestamp (TIMESTAMPTZ)
- signature (TEXT)
- messages (JSONB) - AI conversation
- created_at (TIMESTAMPTZ)
```

**stock_prices** - Historical prices
```sql
- id (SERIAL, primary key)
- date (DATE)
- symbol (TEXT)
- open (NUMERIC)
- high (NUMERIC)
- low (NUMERIC)
- close (NUMERIC)
- volume (BIGINT)
```

**performance_metrics** - Cached metrics
```sql
- id (SERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- cumulative_return (NUMERIC)
- sharpe_ratio (NUMERIC)
- max_drawdown (NUMERIC)
- win_rate (NUMERIC)
- total_trades (INTEGER)
- calculated_at (TIMESTAMPTZ)
```

**Row Level Security (RLS):**
- Users can only see their own data
- Admins can see everything
- Enforced at database level

---

**New Tables from Blueprint Implementation (6 - Added 2025-10-31):**

**trading_runs** - Session tracking
```sql
- id (SERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- run_number (INTEGER) - Auto-incrementing per model (1, 2, 3...)
- started_at (TIMESTAMPTZ)
- ended_at (TIMESTAMPTZ)
- status (TEXT: 'running' | 'completed' | 'stopped' | 'failed')
- trading_mode (TEXT: 'daily' | 'intraday')
- strategy_snapshot (JSONB) - Rules/parameters used for this run
- total_trades (INTEGER) - Final trade count
- final_return (DECIMAL) - Final return percentage
- final_portfolio_value (DECIMAL)
- max_drawdown_during_run (DECIMAL)
- UNIQUE(model_id, run_number)
```
**Evidence:** `backend/migrations/012_add_run_tracking.sql` Lines 11-50  
**Purpose:** Enables `/models/[id]/r/[run]` URLs for run comparison

**ai_reasoning** - Complete audit trail
```sql
- id (BIGSERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- run_id (INTEGER, foreign key → trading_runs)
- timestamp (TIMESTAMPTZ)
- reasoning_type (TEXT: 'plan' | 'analysis' | 'decision' | 'reflection')
- content (TEXT) - AI's thought process
- context_json (JSONB) - What AI was looking at
```
**Evidence:** `backend/migrations/012_add_run_tracking.sql` Lines 52-96  
**Purpose:** Complete transparency of AI decision-making process

**model_rules** - Structured enforceable rules
```sql
- id (SERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- rule_name (TEXT) - Unique per model
- rule_description (TEXT)
- rule_category (TEXT: 'risk' | 'strategy' | 'position_sizing' | 'timing' | etc.)
- enforcement_params (JSONB) - Programmatically enforceable parameters
  Examples: {"max_position_pct": 0.20}, {"max_positions": 3}
- applies_to_assets (TEXT[]) - ['equity', 'option', 'crypto']
- applies_to_symbols (TEXT[]) - Whitelist (NULL = all)
- exclude_symbols (TEXT[]) - Blacklist
- priority (INTEGER) - 1=lowest, 10=highest
- is_active (BOOLEAN)
- UNIQUE(model_id, rule_name)
```
**Evidence:** `backend/migrations/013_structured_rules.sql` Lines 9-53  
**Purpose:** Move from text blobs to parseable, programmatically enforceable rules

**chat_sessions** - Strategy discussions
```sql
- id (SERIAL, primary key)
- model_id (INTEGER, foreign key → models)
- run_id (INTEGER, foreign key → trading_runs)
- session_title (TEXT)
- created_at (TIMESTAMPTZ)
- last_message_at (TIMESTAMPTZ)
- UNIQUE(model_id, run_id) - One chat per run
```
**Evidence:** `backend/migrations/014_chat_system.sql` Lines 8-20  
**Purpose:** Enables conversational strategy building with system agent

**chat_messages** - Individual messages
```sql
- id (BIGSERIAL, primary key)
- session_id (INTEGER, foreign key → chat_sessions)
- role (TEXT: 'user' | 'assistant' | 'system')
- content (TEXT)
- tool_calls (JSONB) - Tools AI used to answer
- timestamp (TIMESTAMPTZ)
```
**Evidence:** `backend/migrations/014_chat_system.sql` Lines 22-33  
**Purpose:** Stores chat history with system agent

**user_trading_profiles** - User-level risk parameters
```sql
- id (SERIAL, primary key)
- user_id (UUID, foreign key → profiles)
- trading_experience (TEXT: 'beginner' | 'intermediate' | 'advanced' | 'expert')
- risk_tolerance (TEXT: 'very_conservative' | 'conservative' | 'moderate' | 'aggressive')
- max_position_size_percent (DECIMAL) - Default 20%
- max_open_positions (INTEGER) - Default 5
- stop_trading_if_daily_loss_exceeds (DECIMAL) - Circuit breaker
- min_cash_reserve_percent (DECIMAL) - Default 20%
- trading_hours_start (TIME) - Default 09:30
- trading_hours_end (TIME) - Default 16:00
- use_options (BOOLEAN) - Default false
- use_short_selling (BOOLEAN) - Default false
- UNIQUE(user_id)
```
**Evidence:** `backend/migrations/015_user_profiles_advanced.sql` Lines 11-44  
**Purpose:** Global risk parameters applied across all user's models

**Advanced Trading Support:**
- Positions table expanded to support: 'buy', 'sell', 'short', 'cover', 'no_trade'
- Added fields: position_type, option_details, order_id, order_status
- **Evidence:** `backend/migrations/015_user_profiles_advanced.sql` Lines 57-60

---

## 7. CURRENT PLATFORM STATUS

**Status:** 🟡 Functional - Refinements Ongoing  
**Backend:** 🟢 Production-Ready + MCP 2025-06-18 Compliant  
**Frontend:** 🟡 Functional - UI/UX improvements in progress  
**Version:** 2.1  
**Build Date:** 2025-10-31

### What's Working:

**Backend (100%):**
- ✅ 38 API endpoints functional (verified via grep)
- ✅ Authentication & authorization (JWT + Supabase)
- ✅ User data isolation (RLS at database level)
- ✅ Portfolio calculations (verified mathematically)
- ✅ AI reasoning logs (100% migrated)
- ✅ Trading controls (daily + intraday)
- ✅ **Run tracking system** (session-based organization)
- ✅ **AI reasoning audit trail** (complete transparency)
- ✅ **Structured rules engine** (programmatic enforcement)
- ✅ **System agent** (conversational strategy analyst)
- ✅ **Risk gates** (hard-coded safety checks)
- ✅ MCP service management (4 services, 6 tools)
- ✅ MCP 2025-06-18 Streamable HTTP compliance
- ✅ Performance metrics (on-demand calculation)
- ✅ Admin features (user management, global settings)
- ✅ Concurrent multi-user support (verified)

**Frontend (Functional - Ongoing Improvements):**
- ✅ 8 complete pages (verified)
- ✅ Login/signup with JWT auth
- ✅ User dashboard with model cards
- ✅ Model detail pages (2-column responsive layout)
- ✅ Create Model form with AI config
- ✅ Edit Model feature (settings modal)
- ✅ Delete Model feature (batch deletion)
- ✅ **Run detail page** (`/models/[id]/r/[run]`) - NEW
- ✅ **Chat interface** (strategy analyst conversations) - NEW
- ✅ **Run comparison** (compare different trading sessions) - NEW
- ✅ Admin dashboard (users, models, stats)
- ✅ Portfolio chart visualization (SVG line chart, 227 LOC)
- ✅ Real-time trading feed (SSE EventSource, 159 LOC)
- ✅ Performance metrics display
- ✅ AI logs viewer
- ✅ Dark theme with True Trading Group branding
- ✅ Mobile responsive (Tailwind)
- ✅ Type-safe (0 TypeScript linter errors)
- ✅ Dual-port support (3000 dev, 3100 Stagewise)

**Known Frontend Issues:**
- ⚠️ UI/UX refinements needed (spacing, alignment, visual hierarchy)
- ⚠️ Some components need polish
- ⚠️ Edge cases may exist
- ⚠️ Performance optimizations possible
- **Note:** Core functionality works, but not production-perfect

**MCP Services (100%):**
- ✅ 4 services running (Math, Stock, Search, Trade)
- ✅ 6 tools exposed (add, multiply, buy, sell, get_information, get_price_local)
- ✅ Streamable HTTP transport (June 2025 spec)
- ✅ Proper timeout configuration (120-300s)
- ✅ Session isolation for concurrent users
- ✅ Stateless architecture (concurrent-safe)

**Code Quality (100%):**
- ✅ 0 TypeScript linter errors
- ✅ 0 Python linter errors
- ✅ All scripts organized into folders
- ✅ Proper import paths
- ✅ Type-safe throughout

---

## 8. USERS & ACCESS

### Admin:
**Email:** adam@truetradinggroup.com  
**Password:** adminpass123  
**Access:** Full platform control

### Users:
**Email:** samerawada92@gmail.com  
**Password:** testpass123  
**Access:** Personal models only

**Email:** mperinotti@gmail.com  
**Password:** testpass789  
**Access:** Personal models only (if approved)

**Note:** Signup requires email whitelist approval by admin

---

# THIS FILE IS CONTINUED HERE C:\Users\212we\OneDrive\Desktop\aibt2\aibt-modded\docs\overviewpt2.md