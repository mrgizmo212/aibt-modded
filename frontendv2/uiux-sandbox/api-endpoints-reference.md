# API Endpoints Reference - AIBT2 Backend

**Source:** `branches/aibt-modded/backend/main.py`  
**Date:** 2025-11-01  
**Total Endpoints:** 38 (Verified)  
**Base URL:** `http://localhost:8080`

---

## 📋 ENDPOINT CATEGORIES

- **Public:** 5 endpoints (no auth)
- **Authentication:** 4 endpoints
- **User Models:** 9 endpoints (user's own data)
- **Trading Control:** 6 endpoints (start/stop agents)
- **Run Tracking:** 4 endpoints (NEW - session analysis)
- **Admin:** 10 endpoints (admin only)

---

## 🌐 PUBLIC ENDPOINTS (No Auth Required)

### 1. Health Check
```
GET /
```
**What it does:** Basic API health check  
**Returns:** API version, status, environment  
**Use in UI:** Not displayed

---

### 2. Detailed Health
```
GET /api/health
```
**What it does:** Detailed health status  
**Returns:** Supabase connection status, timestamp  
**Use in UI:** Admin dashboard health monitoring

---

### 3. Get Stock Prices
```
GET /api/stock-prices?symbol=AAPL&start_date=2025-01-01&end_date=2025-01-31
```
**What it does:** Fetch historical stock price data  
**Query params:**
- `symbol` (optional) - Stock ticker
- `start_date` (optional) - Start date
- `end_date` (optional) - End date

**Returns:** Array of price records  
**Use in UI:** Chart data, price lookups

---

### 4. Get Model Configuration
```
GET /api/model-config?model_id=openai/gpt-5
```
**What it does:** Get recommended settings for specific AI model  
**Query params:**
- `model_id` - AI model identifier (e.g., "openai/gpt-5")

**Returns:**
```json
{
  "model_id": "openai/gpt-5",
  "model_type": "openai_latest",
  "default_parameters": {
    "reasoning_effort": "high",
    "verbosity": "normal"
  },
  "template": {...},
  "supports_temperature": false,
  "supports_verbosity": true,
  "supports_reasoning_effort": true
}
```
**Use in UI:** Create/Edit model form - show which settings to display

---

### 5. Get Available Models
```
GET /api/available-models
```
**What it does:** Fetch list of available AI models from OpenRouter  
**Returns:**
```json
{
  "models": [
    {
      "id": "openai/gpt-5-pro",
      "name": "GPT-5 Pro",
      "provider": "openai",
      "context_length": 128000,
      "pricing": {...}
    },
    ...
  ],
  "total": 50,
  "source": "openrouter"
}
```
**Use in UI:** Model creation dropdown - sorted by priority (best models first)

---

## 🔐 AUTHENTICATION ENDPOINTS

### 6. Signup
```
POST /api/auth/signup
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**What it does:** Create new user account (whitelist checked)  
**Returns:** JWT token + user info  
**Use in UI:** Signup page  
**Note:** Email must be in `approved_users.json`

---

### 7. Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**What it does:** Authenticate user, get JWT token  
**Returns:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}
```
**Use in UI:** Login page - store token, redirect to dashboard

---

### 8. Logout
```
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Sign user out  
**Returns:** Success message  
**Use in UI:** Logout button in nav

---

### 9. Get Current User
```
GET /api/auth/me
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Get logged-in user's profile  
**Returns:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "created_at": "2025-01-01T00:00:00"
}
```
**Use in UI:** User menu, profile display

---

## 👤 USER MODEL ENDPOINTS (Own Data Only)

### 10. Get My Models
```
GET /api/models
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Get all models owned by current user  
**Returns:**
```json
{
  "models": [
    {
      "id": 1,
      "name": "GPT-5 Momentum",
      "signature": "gpt-5-momentum-unique",
      "description": "Momentum trading strategy",
      "is_active": true,
      "initial_cash": 10000.0,
      "allowed_tickers": ["AAPL", "MSFT", "NVDA"],
      "default_ai_model": "openai/gpt-5",
      "model_parameters": {...},
      "custom_rules": "Stop loss at -5%",
      "custom_instructions": "Focus on tech stocks",
      "created_at": "2025-01-01T00:00:00",
      "updated_at": "2025-01-01T00:00:00"
    }
  ],
  "total_models": 7
}
```
**Use in UI:** Dashboard - display model cards

---

### 11. Create Model
```
POST /api/models
```
**Headers:** `Authorization: Bearer {token}`  
**Body:**
```json
{
  "name": "My New Model",
  "description": "Optional description",
  "initial_cash": 10000.0,
  "allowed_tickers": ["AAPL", "MSFT"],
  "default_ai_model": "openai/gpt-5",
  "model_parameters": {
    "reasoning_effort": "high",
    "verbosity": "normal"
  },
  "custom_rules": "Stop loss at -5%",
  "custom_instructions": "Focus on momentum"
}
```
**What it does:** Create new AI trading model  
**Returns:** Created model object  
**Use in UI:** Create model form/modal  
**Note:** Signature auto-generated from name

---

### 12. Update Model
```
PUT /api/models/{model_id}
```
**Headers:** `Authorization: Bearer {token}`  
**Body:** Same as Create Model  
**What it does:** Update existing model settings  
**Returns:** Updated model object  
**Use in UI:** Edit model modal  
**Note:** Can't change initial_cash after creation

---

### 13. Delete Model
```
DELETE /api/models/{model_id}
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Delete a model (user must own it)  
**Returns:** Success message  
**Use in UI:** Delete button with confirmation  
**Warning:** Permanent deletion

---

### 14. Get Model Positions (Paginated)
```
GET /api/models/{model_id}/positions?page=1&page_size=20
```
**Headers:** `Authorization: Bearer {token}`  
**Query params:**
- `page` (default: 1)
- `page_size` (default: 20)

**What it does:** Get trading history for a model  
**Returns:**
```json
{
  "model_id": 1,
  "model_name": "gpt-5-momentum",
  "positions": [
    {
      "id": 123,
      "date": "2025-01-15",
      "action_type": "buy",
      "symbol": "AAPL",
      "amount": 10,
      "positions": {"AAPL": 10, "CASH": 8200},
      "cash": 8200,
      "created_at": "2025-01-15T14:30:00"
    }
  ],
  "total_records": 306,
  "page": 1,
  "page_size": 20
}
```
**Use in UI:** Trade history table with pagination

---

### 15. Get Latest Position
```
GET /api/models/{model_id}/positions/latest
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Get current portfolio snapshot  
**Returns:**
```json
{
  "model_id": 1,
  "model_name": "gpt-5-momentum",
  "date": "2025-01-15",
  "positions": {
    "AAPL": 10,
    "MSFT": 5,
    "NVDA": 8,
    "CASH": 3245.50
  },
  "cash": 3245.50,
  "stocks_value": 6989.70,
  "total_value": 10235.20
}
```
**Use in UI:** 
- Dashboard model cards (show current value)
- Model detail page (current holdings table)
- Performance calculations

---

### 16. Get Model Logs
```
GET /api/models/{model_id}/logs?trade_date=2025-01-15
```
**Headers:** `Authorization: Bearer {token}`  
**Query params:**
- `trade_date` (optional) - Filter by specific date

**What it does:** Get AI reasoning logs  
**Returns:**
```json
{
  "model_id": 1,
  "model_name": "gpt-5-momentum",
  "date": "2025-01-15",
  "logs": [
    {
      "id": 1,
      "date": "2025-01-15",
      "timestamp": "2025-01-15T14:30:00",
      "signature": "gpt-5-momentum",
      "messages": [...] // AI conversation
    }
  ],
  "total_entries": 37
}
```
**Use in UI:** Logs tab - see AI decision-making process

---

### 17. Get Performance Metrics
```
GET /api/models/{model_id}/performance
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Calculate or fetch cached performance metrics  
**Returns:**
```json
{
  "model_id": 1,
  "model_name": "gpt-5-momentum",
  "start_date": "2025-01-01",
  "end_date": "2025-01-15",
  "metrics": {
    "sharpe_ratio": 1.45,
    "max_drawdown": 0.08,
    "cumulative_return": 0.0235,
    "annualized_return": 0.58,
    "volatility": 0.16,
    "win_rate": 0.62,
    "profit_loss_ratio": 1.8,
    "total_trading_days": 10,
    "initial_value": 10000.0,
    "final_value": 10235.0
  },
  "portfolio_values": {
    "2025-01-01": 10000,
    "2025-01-02": 10050,
    ...
  }
}
```
**Use in UI:**
- Performance tab metrics display
- Chart data (portfolio_values over time)
- Model card stats (return %)

---

### 18. Get Model Runs
```
GET /api/models/{model_id}/runs
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** List all trading runs (sessions) for a model  
**Returns:**
```json
{
  "runs": [
    {
      "id": 5,
      "run_number": 5,
      "started_at": "2025-01-15T09:30:00",
      "ended_at": "2025-01-15T16:00:00",
      "status": "completed",
      "trading_mode": "daily",
      "total_trades": 15,
      "final_return": 0.023,
      "final_portfolio_value": 10230.0,
      "max_drawdown_during_run": 0.05,
      "intraday_symbol": null,
      "intraday_date": null
    }
  ],
  "total": 12
}
```
**Use in UI:** 
- Runs tab - list of all trading sessions
- Compare runs dropdown
- Run selector

---

## 🎯 RUN TRACKING ENDPOINTS (NEW FEATURES)

### 19. Get Run Details
```
GET /api/models/{model_id}/runs/{run_id}
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Get complete details for a specific run  
**Returns:**
```json
{
  "id": 5,
  "run_number": 5,
  "model_id": 1,
  "started_at": "2025-01-15T09:30:00",
  "ended_at": "2025-01-15T16:00:00",
  "status": "completed",
  "trading_mode": "daily",
  "strategy_snapshot": {
    "custom_rules": "Stop loss at -5%",
    "default_ai_model": "openai/gpt-5",
    "model_parameters": {...}
  },
  "total_trades": 15,
  "final_return": 0.023,
  "final_portfolio_value": 10230.0,
  "trades": [...],  // All trades from this run
  "reasoning_logs": [...]  // AI decisions during this run
}
```
**Use in UI:** Run detail page (`/models/[id]/r/[run]`)

---

### 20. Chat with System Agent
```
POST /api/models/{model_id}/runs/{run_id}/chat
```
**Headers:** `Authorization: Bearer {token}`  
**Body:**
```json
{
  "message": "Why did I lose money on this run?"
}
```
**What it does:** Ask AI analyst questions about a specific run  
**Returns:**
```json
{
  "response": "I analyzed your trades and found 3 issues...",
  "suggested_rules": [
    {
      "rule_name": "stop_loss_5_percent",
      "rule_description": "Exit positions that drop more than 5%",
      "rule_category": "risk",
      "enforcement_params": {"max_loss_pct": 0.05}
    }
  ]
}
```
**Use in UI:** Chat interface on run detail page  
**Features:**
- AI uses 3 tools: analyze_trades, suggest_rules, calculate_metrics
- Provides actionable insights
- Suggests specific rules to add

---

### 21. Get Chat History
```
GET /api/models/{model_id}/runs/{run_id}/chat-history
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Get all chat messages for a run  
**Returns:**
```json
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Why did I lose money?",
      "timestamp": "2025-01-15T17:00:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "I analyzed your trades...",
      "tool_calls": [...],
      "timestamp": "2025-01-15T17:00:05"
    }
  ]
}
```
**Use in UI:** Load previous chat history when viewing run

---

## 🤖 TRADING CONTROL ENDPOINTS

### 22. Start Daily Trading
```
POST /api/trading/start/{model_id}
```
**Headers:** `Authorization: Bearer {token}`  
**Body:**
```json
{
  "base_model": "openai/gpt-5",
  "start_date": "2025-01-10",
  "end_date": "2025-01-15"
}
```
**What it does:** Start AI trading agent for date range  
**Returns:**
```json
{
  "status": "started",
  "model_id": 1,
  "run_id": 5,
  "run_number": 5,
  "mode": "daily"
}
```
**Use in UI:** "Start Trading" modal - Daily mode

---

### 23. Start Intraday Trading
```
POST /api/trading/start-intraday/{model_id}
```
**Headers:** `Authorization: Bearer {token}`  
**Body:**
```json
{
  "base_model": "openai/gpt-5",
  "symbol": "AAPL",
  "date": "2025-01-15",
  "session": "regular"
}
```
**What it does:** Start minute-by-minute intraday trading  
**Returns:**
```json
{
  "status": "completed",
  "model_id": 1,
  "run_id": 6,
  "run_number": 6,
  "symbol": "AAPL",
  "trades_executed": 23,
  "final_position": {...},
  "total_portfolio_value": 10150.0
}
```
**Use in UI:** "Start Trading" modal - Intraday mode  
**Note:** Runs synchronously, may take 30-60 seconds

---

### 24. Stop Trading
```
POST /api/trading/stop/{model_id}
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Stop running trading agent  
**Returns:**
```json
{
  "status": "stopped",
  "model_id": 1
}
```
**Use in UI:** "Stop Trading" button

---

### 25. Get Trading Status (Single Model)
```
GET /api/trading/status/{model_id}
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Check if model is currently trading  
**Returns:**
```json
{
  "status": "running",
  "model_id": 1,
  "started_at": "2025-01-15T09:30:00",
  "current_date": "2025-01-12",
  "progress": "Day 3 of 5"
}
```
**OR**
```json
{
  "status": "not_running",
  "model_id": 1
}
```
**Use in UI:** Model card status badge, enable/disable start/stop buttons

---

### 26. Get All Trading Status
```
GET /api/trading/status
```
**Headers:** `Authorization: Bearer {token}`  
**What it does:** Get status of all user's running agents  
**Returns:**
```json
{
  "running_agents": {
    "1": {
      "status": "running",
      "model_id": 1,
      "started_at": "..."
    },
    "3": {
      "status": "running",
      "model_id": 3,
      "started_at": "..."
    }
  },
  "total_running": 2
}
```
**Use in UI:** Dashboard stats - "3 Active" count

---

### 27. Stream Trading Events (SSE)
```
GET /api/trading/stream/{model_id}?token={jwt_token}
```
**Query params:**
- `token` - JWT token (EventSource can't send headers)

**What it does:** Real-time trading event stream (Server-Sent Events)  
**Returns:** SSE stream of events
```
data: {"type":"connected","model_id":1}

data: {"type":"trade","action":"buy","symbol":"AAPL","amount":10,"price":180.50}

data: {"type":"position_update","cash":8195,"total_value":10195}
```
**Use in UI:** TradingFeed component - live updates when trading active  
**Pattern:** Use EventSource API in frontend

---

## 👑 ADMIN ENDPOINTS (Admin Role Required)

### 28. Get All Users
```
GET /api/admin/users
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** List all platform users  
**Returns:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "display_name": "John Doe",
      "created_at": "2025-01-01T00:00:00"
    }
  ],
  "total_users": 15
}
```
**Use in UI:** Admin dashboard - user management table

---

### 29. Get All Models (Admin)
```
GET /api/admin/models
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** List ALL models across ALL users  
**Returns:**
```json
{
  "models": [
    {
      "id": 1,
      "user_id": "uuid",
      "name": "GPT-5 Momentum",
      "signature": "...",
      ...
    }
  ],
  "total_models": 42
}
```
**Use in UI:** Admin dashboard - all models overview

---

### 30. Get System Stats
```
GET /api/admin/stats
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Platform-wide statistics  
**Returns:**
```json
{
  "total_users": 15,
  "total_models": 42,
  "total_positions": 1250,
  "total_trades": 3400,
  "platform_total_value": 450000.0,
  "active_trading_sessions": 5
}
```
**Use in UI:** Admin dashboard - stats cards at top

---

### 31. Get Leaderboard
```
GET /api/admin/leaderboard
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Rank all models by performance  
**Returns:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "model_id": 7,
      "model_name": "gpt-5-momentum",
      "user_email": "user@example.com",
      "total_return": 0.156,
      "sharpe_ratio": 2.3,
      "total_trades": 45
    }
  ],
  "total_models": 42
}
```
**Use in UI:** Admin dashboard - leaderboard table  
**Sort by:** Return %, Sharpe ratio, total trades

---

### 32. Get All Global Settings
```
GET /api/admin/global-settings
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Get platform-wide configuration  
**Returns:**
```json
{
  "settings": [
    {
      "setting_key": "max_position_size",
      "setting_value": {"percent": 0.20},
      "description": "Maximum position size per stock",
      "updated_at": "2025-01-01T00:00:00"
    }
  ],
  "total": 5
}
```
**Use in UI:** Admin settings page

---

### 33. Get Global Setting (Single)
```
GET /api/admin/global-settings/{setting_key}
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Get specific setting value  
**Returns:**
```json
{
  "setting_key": "max_position_size",
  "setting_value": {"percent": 0.20}
}
```
**Use in UI:** Settings form pre-fill

---

### 34. Update Global Setting
```
PUT /api/admin/global-settings/{setting_key}
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**Body:**
```json
{
  "setting_value": {"percent": 0.25},
  "description": "Maximum position size per stock"
}
```
**What it does:** Update platform-wide setting  
**Returns:** Success confirmation  
**Use in UI:** Admin settings form save button

---

### 35. Update User Role
```
PUT /api/admin/users/{user_id}/role
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**Body:**
```json
{
  "new_role": "admin"
}
```
**What it does:** Change user's role (user ↔ admin)  
**Returns:** Updated user object  
**Use in UI:** Admin user table - role dropdown

---

### 36. Get MCP Status
```
GET /api/mcp/status
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Check MCP service health  
**Returns:**
```json
{
  "services": {
    "math": {"status": "running", "port": 8000},
    "search": {"status": "running", "port": 8001},
    "trade": {"status": "running", "port": 8002},
    "stock": {"status": "running", "port": 8003}
  },
  "all_running": true
}
```
**Use in UI:** Admin dashboard - MCP health indicators

---

### 37. Start MCP Services
```
POST /api/mcp/start
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Start all MCP services (Math, Search, Trade, Stock)  
**Returns:** Startup results  
**Use in UI:** Admin MCP control panel  
**Note:** Usually auto-starts on backend startup

---

### 38. Stop MCP Services
```
POST /api/mcp/stop
```
**Headers:** `Authorization: Bearer {token}`  
**Role:** Admin only  
**What it does:** Stop all MCP services  
**Returns:** Success message  
**Use in UI:** Admin MCP control panel  
**Warning:** Stops all AI trading

---

## 📊 ENDPOINT SUMMARY BY PAGE

### Login/Signup Pages:
- `POST /api/auth/signup` (#6)
- `POST /api/auth/login` (#7)

### Dashboard Page:
- `GET /api/models` (#10) - List user's models
- `GET /api/trading/status` (#26) - Check which are running
- `GET /api/models/{id}/positions/latest` (#15) - Current portfolio values
- `POST /api/trading/start/{id}` (#22) - Start trading
- `POST /api/trading/stop/{id}` (#24) - Stop trading
- `DELETE /api/models/{id}` (#13) - Delete models

### Create Model Page:
- `GET /api/available-models` (#5) - AI model dropdown
- `GET /api/model-config?model_id=X` (#4) - Get model parameters
- `POST /api/models` (#11) - Create the model

### Model Detail Page:
- `GET /api/models/{id}/positions/latest` (#15) - Current holdings
- `GET /api/models/{id}/performance` (#17) - Metrics & chart data
- `GET /api/models/{id}/logs` (#16) - AI reasoning
- `GET /api/models/{id}/positions` (#14) - Trade history
- `GET /api/models/{id}/runs` (#18) - List of runs
- `GET /api/trading/status/{id}` (#25) - Current status
- `GET /api/trading/stream/{id}` (#27) - Live trading feed (SSE)
- `PUT /api/models/{id}` (#12) - Edit model settings

### Run Detail Page:
- `GET /api/models/{id}/runs/{run_id}` (#19) - Run details
- `POST /api/models/{id}/runs/{run_id}/chat` (#20) - Chat with AI
- `GET /api/models/{id}/runs/{run_id}/chat-history` (#21) - Load history

### Admin Dashboard:
- `GET /api/admin/users` (#28) - All users
- `GET /api/admin/models` (#29) - All models
- `GET /api/admin/stats` (#30) - Platform stats
- `GET /api/admin/leaderboard` (#31) - Rankings
- `PUT /api/admin/users/{id}/role` (#35) - Change roles
- `GET /api/admin/global-settings` (#32) - Settings
- `PUT /api/admin/global-settings/{key}` (#34) - Update settings
- `GET /api/mcp/status` (#36) - MCP health
- `POST /api/mcp/start` (#37) - Start MCP
- `POST /api/mcp/stop` (#38) - Stop MCP

---

## 🎯 KEY PATTERNS FOR UI DESIGN

### Authentication:
- All user endpoints require `Authorization: Bearer {token}` header
- Admin endpoints also check role
- 401 = redirect to login
- 403 = show "Access denied"

### Real-time Data:
- Use SSE (`/api/trading/stream/{id}`) for live updates
- EventSource API in frontend
- Only works when model is actively trading

### Data Fetching:
- Dashboard: Parallel fetch models + status
- Model detail: Sequential fetch (model → positions → performance)
- Use loading skeletons during fetch

### Error Handling:
- 404 = "Not found" message
- 403 = "Access denied" (trying to access other user's data)
- 500 = "Something went wrong, try again"
- Show user-friendly messages, not raw errors

---

**NOW WE CAN MAP USER FLOWS BASED ON ACTUAL CAPABILITIES!** ✅

Next step: Map flows using these exact endpoints?

