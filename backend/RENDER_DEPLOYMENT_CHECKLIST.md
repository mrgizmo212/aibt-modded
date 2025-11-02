# ✅ Render Deployment Checklist

**Use this checklist to ensure successful deployment**

---

## Pre-Deployment

- [ ] **GitHub repository is ready**
  - [ ] All code committed and pushed
  - [ ] `/backend` directory exists in root
  - [ ] `requirements.txt` is up to date
  - [ ] `.env` file is NOT committed (use Render env vars instead)

- [ ] **Environment variables documented**
  - [ ] All 30+ variables from `.env` copied to notes
  - [ ] Sensitive keys ready to paste into Render dashboard
  - [ ] Frontend URL known for `ALLOWED_ORIGINS`

- [ ] **MCP services strategy decided**
  - [ ] Option A: Use external MCP services only (recommended)
  - [ ] Option B: Deploy 4 separate MCP services on Render ($$$)
  - [ ] Option C: Code changes to consolidate MCP services

---

## Render Dashboard Setup

- [ ] **Create Web Service**
  - [ ] New → Web Service
  - [ ] Repository connected
  - [ ] Repository selected: `aibt-modded`

- [ ] **Configure Basic Settings**
  - [ ] Name: `aibt-backend` (or your choice)
  - [ ] Region: Closest to users
  - [ ] Branch: `main` (or your deploy branch)
  - [ ] **Root Directory: `backend`** (CRITICAL!)
  - [ ] Runtime: Python 3
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Environment Variables (Set ALL of these)

### 🔴 REQUIRED - Database
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_JWT_SECRET`
- [ ] `DATABASE_URL`

### 🔴 REQUIRED - AI & Trading
- [ ] `OPENAI_API_BASE`
- [ ] `OPENAI_API_KEY`

### 🔴 REQUIRED - Redis Cache
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

### 🟡 IMPORTANT - Market Data
- [ ] `POLYGON_PROXY_URL`
- [ ] `POLYGON_PROXY_KEY`
- [ ] `YFINANCE_PROXY_URL`
- [ ] `YFINANCE_PROXY_KEY`

### 🟡 IMPORTANT - MCP Services
- [ ] `FINMCP_TOKEN`
- [ ] `UWMCP_MCP_TOKEN`
- [ ] `FINVIZ_SERVER_TOKEN`
- [ ] `FINMCP_URL`
- [ ] `UWMCP_URL`
- [ ] `FINVIZ_URL`

### 🟡 IMPORTANT - Additional APIs
- [ ] `JINA_API_KEY`

### 🟢 CONFIGURATION - Application
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `DATA_DIR=./data`
- [ ] `ALLOWED_ORIGINS` (UPDATE with frontend URL!)
- [ ] `AUTH_REQUIRE_EMAIL_CONFIRMATION=false`
- [ ] `AUTH_APPROVED_LIST_PATH=./config/approved_users.json`
- [ ] `RUNTIME_ENV_PATH=./data/.runtime_env.json`

### 🟢 CONFIGURATION - MCP Ports
- [ ] `MATH_HTTP_PORT=8000`
- [ ] `SEARCH_HTTP_PORT=8001`
- [ ] `TRADE_HTTP_PORT=8002`
- [ ] `GETPRICE_HTTP_PORT=8003`

### 🟢 CONFIGURATION - Agent Settings (Optional)
- [ ] `AGENT_MAX_STEPS=30`
- [ ] `AGENT_MAX_RETRIES=3`
- [ ] `AGENT_BASE_DELAY=1.0`
- [ ] `AGENT_INITIAL_CASH=10000.0`

---

## Health Check Configuration

- [ ] **Health check enabled**
- [ ] **Health check path: `/`**
- [ ] **Expected response:** `{"status":"healthy",...}`

---

## Deploy & Monitor

- [ ] **Click "Create Web Service"**
- [ ] **Watch deployment logs**
  - [ ] Dependencies installing
  - [ ] Build successful
  - [ ] Server starting
  - [ ] Health check passing

- [ ] **Expected startup logs:**
  ```
  🚀 AI-Trader API Starting...
  📊 Environment: production
  🔐 Auth: Enabled (Supabase)
  ⚠️  MCP services failed to start - AI trading may not work
  ✅ API Ready on port 8080
  ```

- [ ] **⚠️ MCP warning is NORMAL** (unless you deployed MCP services separately)

---

## Post-Deployment Verification

- [ ] **Test health endpoint**
  ```bash
  curl https://your-backend.onrender.com/
  ```
  Should return: `{"status":"healthy","timestamp":"..."}`

- [ ] **Test API docs**
  - Open: `https://your-backend.onrender.com/api/docs`
  - Should see Swagger UI

- [ ] **Test public endpoint**
  ```bash
  curl https://your-backend.onrender.com/api/stock-prices
  ```
  Should return NASDAQ 100 data

- [ ] **Copy deployed URL**
  - Format: `https://aibt-backend.onrender.com`
  - Save for frontend configuration

---

## Frontend Integration

- [ ] **Update frontend environment variables**
  ```env
  NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
  ```

- [ ] **Deploy frontend**

- [ ] **Update backend CORS**
  - Go to Render dashboard → Environment
  - Update `ALLOWED_ORIGINS=https://your-frontend.onrender.com`
  - Click "Save Changes"
  - Wait for auto-redeploy

---

## Full System Test

- [ ] **Test authentication flow**
  - [ ] Signup with approved email
  - [ ] Login successful
  - [ ] JWT token received
  - [ ] `/api/auth/me` returns user profile

- [ ] **Test protected endpoints**
  - [ ] Create AI model
  - [ ] View models list
  - [ ] Check performance metrics

- [ ] **Test admin endpoints (if admin user)**
  - [ ] View all users
  - [ ] View leaderboard
  - [ ] Check system stats

- [ ] **Test AI trading (if MCP services deployed)**
  - [ ] Start daily trading
  - [ ] View logs
  - [ ] Check positions

---

## Optional: Production Enhancements

- [ ] **Enable auto-deploy**
  - Settings → Auto-Deploy → Enable

- [ ] **Set up monitoring**
  - Review metrics dashboard
  - Set up alerts for errors
  - Monitor resource usage

- [ ] **Add custom domain (optional)**
  - Settings → Custom Domain
  - Configure DNS records
  - HTTPS automatic

- [ ] **Upgrade to Starter plan ($7/month)**
  - Eliminates cold starts
  - Better performance
  - Always-on service

- [ ] **Configure persistent disk (if needed)**
  - For `/data` directory
  - $1/GB/month
  - Settings → Disks → Add Disk

---

## Troubleshooting

### If deployment fails:

- [ ] Check deployment logs for specific error
- [ ] Verify all REQUIRED environment variables are set
- [ ] Verify Root Directory is `backend` (not `/backend` or empty)
- [ ] Verify Start Command uses `$PORT` not hardcoded port
- [ ] Test build locally: `pip install -r requirements.txt`

### If health check fails:

- [ ] Check if app is starting (logs show "API Ready")
- [ ] Verify Supabase connection
- [ ] Verify Redis connection
- [ ] Check for Python errors in logs

### If CORS errors in frontend:

- [ ] Update `ALLOWED_ORIGINS` with frontend URL
- [ ] Redeploy backend
- [ ] Clear browser cache

---

## ✅ Deployment Complete!

**Your backend is now live at:** `https://your-backend.onrender.com`

**API Documentation:** `https://your-backend.onrender.com/api/docs`

**Next:** Deploy frontend and test full application flow

---

**Checklist Version:** 1.0  
**Last Updated:** 2025-11-02

