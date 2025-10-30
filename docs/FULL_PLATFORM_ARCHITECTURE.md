# AIBT - Complete AI Trading Platform Architecture

**Updated:** 2025-10-29  
**Scope:** Full-Stack AI Trading Platform with Web Interface

---

## 🎯 **What AIBT Does**

**Complete autonomous AI trading platform accessible via web browser:**

### **Core Features:**
1. ✅ **User Authentication** - Supabase auth with whitelist
2. ✅ **Private Data** - Users only see their own models
3. ✅ **Admin Dashboard** - Full system overview
4. 🟡 **Run AI Agents** - Start/stop trading from web interface
5. 🟡 **Real-Time Monitoring** - Live trading logs and updates
6. 🟡 **Model Configuration** - Configure AI models via UI
7. 🟡 **Performance Analytics** - Charts, metrics, leaderboards

---

## 🏗️ **Complete Architecture**

```
┌──────────────────────────────────────────────────────────────┐
│                    AIBT Web Platform                          │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 Frontend                       │  │
│  │  - Login/Signup                                        │  │
│  │  - User Dashboard (my models)                          │  │
│  │  - Admin Dashboard (all models)                        │  │
│  │  - Trading Control Panel (start/stop)                  │  │
│  │  - Live Trading Monitor (real-time logs)               │  │
│  │  - Performance Charts                                  │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │ HTTP/WebSocket                                │
│               ▼                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            FastAPI Backend                             │  │
│  │                                                         │  │
│  │  REST API Layer:                                       │  │
│  │  ├─ Auth endpoints                                     │  │
│  │  ├─ Model management                                   │  │
│  │  ├─ Trading control ← NEW                              │  │
│  │  └─ Real-time status ← NEW                             │  │
│  │                                                         │  │
│  │  AI Trading Engine: ← NEW                              │  │
│  │  ├─ Agent Manager (run/stop agents)                    │  │
│  │  ├─ MCP Service Manager (ports 8000-8003)              │  │
│  │  ├─ Trading Session Runner                             │  │
│  │  └─ Real-time log streaming                            │  │
│  │                                                         │  │
│  └────────────┬───────────────────────────────────────────┘  │
│               │                                                │
│               ├─► Supabase PostgreSQL (user data)             │
│               ├─► OpenRouter API (AI models)                  │
│               └─► MCP Services (trading tools)                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 **Additional Components Needed**

### **Backend Additions:**

1. **`backend/trading/`** - AI Trading Engine
   - `agent_manager.py` - Manages AI agent lifecycle
   - `mcp_manager.py` - Manages MCP services
   - `session_runner.py` - Runs trading sessions
   - `realtime.py` - WebSocket for live updates

2. **`backend/mcp_services/`** - Copy from aitrtader
   - `tool_trade.py`
   - `tool_get_price_local.py`
   - `tool_jina_search.py`
   - `tool_math.py`

3. **Trading Endpoints:**
   - `POST /api/trading/start` - Start AI agent
   - `POST /api/trading/stop` - Stop AI agent
   - `GET /api/trading/status/{model_id}` - Trading status
   - `WebSocket /ws/trading/{model_id}` - Live logs

### **Frontend Additions:**

4. **Trading Control UI:**
   - Start/Stop buttons
   - Model configuration form
   - Trading status indicators
   - Real-time log viewer

---

## 🔑 **Required API Keys**

**Add to `backend/.env`:**
```bash
# OpenRouter (for AI models)
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-YOUR_KEY

# Jina AI (for web search)
JINA_API_KEY=jina_YOUR_KEY

# MCP Service Ports
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003
```

---

## ✅ **I'll Build This Now**

**Phases:**
1. ✅ Copy trading engine from aitrtader
2. ✅ Add OpenRouter/Jina keys to config
3. ✅ Create trading control endpoints
4. ✅ Add WebSocket for real-time logs
5. ✅ Build frontend trading control panel
6. ✅ Test end-to-end trading

**Starting implementation now!** 🚀

Let me begin by copying the AI trading components...
