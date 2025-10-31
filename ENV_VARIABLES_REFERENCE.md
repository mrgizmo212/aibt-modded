# 🔐 ENVIRONMENT VARIABLES REFERENCE

## Backend Environment Variables

**File Location:** `backend/.env`

```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
# Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAxNDUsImV4cCI6MjA3NzMyNjE0NX0.qQN-zUgDgtuVl2oxyUJ8bYqeNDIRKy5oM1gomg2hBTk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc1MDE0NSwiZXhwIjoyMDc3MzI2MTQ1fQ.vHUXUeMvNnxr-FeZmubVJwnjkBxjc3F7dcq9lUcAQFA
SUPABASE_JWT_SECRET=F4i+rPJLpET3XJbffe4B4qw9vEqtg7xeFegu2p5jEqN+oA4nHnfu8IAiNA2jvRn5/w0bQyIGr+tVD2mXH0uLIg==

# Direct PostgreSQL Connection
# Get from: Supabase Dashboard → Project Settings → Database
DATABASE_URL=postgresql://postgres:sFVZ4czM8YnmFuDZ@db.lfewxxeiplfycmymzmjz.supabase.co:5432/postgres

# ============================================================================
# BACKEND SERVER CONFIGURATION
# ============================================================================
PORT=8080
DATA_DIR=./data
NODE_ENV=development

# ============================================================================
# AI CONFIGURATION (OpenRouter)
# ============================================================================
# Get from: https://openrouter.ai/keys
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=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

# ============================================================================
# JINA AI (Market Research / Web Search)
# ============================================================================
# Get from: https://jina.ai/
JINA_API_KEY=jina_faf4cf7cceb34338b3b2fbc0080c9833DZ5wS2ujfF8qzfNrA7aC11fDVJOy

# ============================================================================
# MARKET DATA PROXIES
# ============================================================================
# Polygon.io Proxy (for tick data / intraday trading)
POLYGON_PROXY_URL=https://apiv3-ttg.onrender.com
POLYGON_PROXY_KEY=your_polygon_proxy_key_here

# Yahoo Finance Proxy (for stock search)
YFINANCE_PROXY_URL=https://moa-xhck.onrender.com
YFINANCE_PROXY_KEY=your_yfinance_proxy_key_here

# ============================================================================
# UPSTASH REDIS (Intraday Data Cache)
# ============================================================================
# Get from: https://console.upstash.com/redis
UPSTASH_REDIS_REST_URL=https://trusting-cougar-38084.upstash.io
UPSTASH_REDIS_REST_TOKEN=AZu4AAIjcDEzMTBjNzNiN2FmZGU0NTZhODAxZDA0MzAwZDQ4ZWI2M3AxMA

# ============================================================================
# MCP SERVICE PORTS (Internal - Usually Don't Change)
# ============================================================================
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003

# ============================================================================
# AGENT CONFIGURATION (Optional - Has Defaults)
# ============================================================================
AGENT_MAX_STEPS=30
AGENT_MAX_RETRIES=3
AGENT_BASE_DELAY=1.0
AGENT_INITIAL_CASH=10000.0
RUNTIME_ENV_PATH=./data/.runtime_env.json

# ============================================================================
# AUTHENTICATION (Optional)
# ============================================================================
AUTH_REQUIRE_EMAIL_CONFIRMATION=false
AUTH_APPROVED_LIST_PATH=./config/approved_users.json
```

---

## Frontend Environment Variables

**File Location:** `frontend/.env.local`

```env
# ============================================================================
# SUPABASE CONFIGURATION (Frontend)
# ============================================================================
# Same as backend, get from Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAxNDUsImV4cCI6MjA3NzMyNjE0NX0.qQN-zUgDgtuVl2oxyUJ8bYqeNDIRKy5oM1gomg2hBTk

# ============================================================================
# BACKEND API URL
# ============================================================================
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🔑 Where to Get Each Key

### Supabase (FREE)
**URL:** https://supabase.com/dashboard

1. Go to your project
2. Click "Project Settings" → "API"
3. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
4. Click "Project Settings" → "Database"
5. Copy Connection String → `DATABASE_URL`
6. JWT Secret from API settings → `SUPABASE_JWT_SECRET`

### OpenRouter (AI Models)
**URL:** https://openrouter.ai/keys

1. Sign up / Login
2. Click "API Keys"
3. Create new key
4. Copy → `OPENAI_API_KEY`
5. Use base URL: `https://openrouter.ai/api/v1`

### Jina AI (Web Search)
**URL:** https://jina.ai/

1. Sign up
2. Go to API Keys
3. Create key
4. Copy → `JINA_API_KEY`

### Upstash Redis (FREE - Required for Intraday)
**URL:** https://console.upstash.com/redis

1. Sign up / Login
2. Create new Redis database (FREE tier)
3. Click on database
4. Scroll to "REST API" section
5. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Market Data Proxies
**Your deployed services:**
- Polygon Proxy: `apiv3-ttg.onrender.com`
- Yahoo Finance Proxy: `moa-xhck.onrender.com`

Get API keys from your proxy deployment settings.

---

## 🚀 Production Deployment

### Backend (.env for production)

```env
# Production Supabase
SUPABASE_URL=https://YOUR_PROD_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
SUPABASE_JWT_SECRET=your_prod_jwt_secret
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Backend
PORT=8080
NODE_ENV=production

# AI
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=your_openrouter_key

# Jina
JINA_API_KEY=your_jina_key

# Proxies
POLYGON_PROXY_URL=https://apiv3-ttg.onrender.com
POLYGON_PROXY_KEY=your_polygon_key
YFINANCE_PROXY_URL=https://moa-xhck.onrender.com
YFINANCE_PROXY_KEY=your_yfinance_key

# Redis (REQUIRED for intraday)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Frontend (.env.local for production)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 📝 Quick Setup Checklist

- [ ] Create Supabase project (FREE)
- [ ] Apply migrations (007 & 008)
- [ ] Get OpenRouter API key
- [ ] Get Jina API key
- [ ] Create Upstash Redis (FREE)
- [ ] Set up market data proxies
- [ ] Copy all keys to backend/.env
- [ ] Copy Supabase keys to frontend/.env.local
- [ ] Test with: `python test_ultimate_comprehensive.py`

---

## 🆘 Emergency Quick Reference

**If backend won't start:**
```
Missing: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
```

**If intraday fails:**
```
Missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
Missing: Migration 008 not applied
```

**If frontend can't authenticate:**
```
Missing: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

**Save this file for deployment reference!**

