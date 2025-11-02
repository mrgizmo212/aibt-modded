# 🚀 Render Deployment Guide - AI-Trader Backend

**Created:** 2025-11-02  
**Backend Version:** 2.0.0  
**Deployment Type:** Manual via GitHub Repository

---

## ⚠️ CRITICAL: MCP Services Architecture Issue

**IMPORTANT:** This backend tries to start LOCAL MCP services as subprocesses on ports 8000-8003. This **WILL NOT WORK** on Render free/starter plans because:

1. ❌ Render only exposes ONE port (the main app port)
2. ❌ Subprocesses binding to multiple ports are not allowed
3. ❌ The startup will fail or MCP features won't work

**Solutions (Choose ONE):**

### Option A: Disable Local MCP Services (Recommended for Initial Deployment)
1. Modify the startup to skip local MCP service initialization
2. Only use the EXTERNAL MCP services already configured:
   - `FINMCP_URL=https://finmcp-f2xz.onrender.com/mcp`
   - `UWMCP_URL=https://uwmcp.onrender.com/mcp`
   - `FINVIZ_URL=https://mcp-finviz.onrender.com/mcp`

### Option B: Deploy MCP Services Separately (Costs $$$)
1. Deploy 4 separate Render Web Services for:
   - Math service (port 8000)
   - Search service (port 8001)
   - Trade service (port 8002)
   - Price service (port 8003)
2. Update environment variables to point to deployed URLs

### Option C: Consolidate MCP Services (Requires Code Changes)
1. Merge all MCP services into the main FastAPI app as endpoints
2. Remove subprocess management
3. Use single port with different routes

---

## 📋 Deployment Steps

### Step 1: Prepare Your GitHub Repository

Ensure your GitHub repository has:
- `/backend` directory with all backend code
- Latest commits pushed
- Repository is public (or Render has access if private)

**Your repo structure should be:**
```
aibt-modded/
├── backend/              ← Root directory for Render
│   ├── main.py
│   ├── requirements.txt
│   ├── config.py
│   ├── auth.py
│   ├── models.py
│   ├── services.py
│   ├── .env            ← DO NOT COMMIT (Render will use env vars)
│   ├── config/
│   │   └── approved_users.json
│   ├── data/
│   ├── migrations/
│   ├── mcp_services/
│   ├── trading/
│   └── utils/
├── frontend/
└── frontend-v2/
```

---

### Step 2: Create Web Service on Render

1. **Go to:** https://dashboard.render.com/
2. **Click:** "New +" → "Web Service"
3. **Connect Repository:**
   - Select your GitHub account
   - Choose the `aibt-modded` repository
   - Click "Connect"

---

### Step 3: Configure Service Settings

**Basic Configuration:**

| Setting | Value |
|---------|-------|
| **Name** | `aibt-backend` (or your preferred name) |
| **Region** | Choose closest to your users (e.g., Oregon, Frankfurt) |
| **Branch** | `main` (or your deployment branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` (Render auto-detects) |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**⚠️ CRITICAL:** 
- Root Directory MUST be `backend` (not empty, not `/backend`, just `backend`)
- Start command MUST use `$PORT` (Render's dynamic port variable)
- Do NOT use `--reload` flag in production

---

### Step 4: Configure Environment Variables

**In Render Dashboard → Environment Tab, add ALL of these:**

#### 🔴 REQUIRED - Supabase Database (Must Set)

```
SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAxNDUsImV4cCI6MjA3NzMyNjE0NX0.qQN-zUgDgtuVl2oxyUJ8bYqeNDIRKy5oM1gomg2hBTk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc1MDE0NSwiZXhwIjoyMDc3MzI2MTQ1fQ.vHUXUeMvNnxr-FeZmubVJwnjkBxjc3F7dcq9lUcAQFA
SUPABASE_JWT_SECRET=F4i+rPJLpET3XJbffe4B4qw9vEqtg7xeFegu2p5jEqN+oA4nHnfu8IAiNA2jvRn5/w0bQyIGr+tVD2mXH0uLIg==
DATABASE_URL=postgresql://postgres:sFVZ4czM8YnmFuDZ@db.lfewxxeiplfycmymzmjz.supabase.co:5432/postgres
```

#### 🔴 REQUIRED - AI & Trading (Must Set)

```
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=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
```

#### 🔴 REQUIRED - Redis Cache (Must Set)

```
UPSTASH_REDIS_REST_URL=https://fair-gnat-31514.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXsaAAIncDI5OTE3MjcyNTdkNzk0NzNjYjQ0YmZhOTc0ZTBkNDUzZXAyMzE1MTQ
```

#### 🟡 IMPORTANT - Market Data Proxies

```
POLYGON_PROXY_URL=https://apiv3-ttg.onrender.com
POLYGON_PROXY_KEY=customkey1
YFINANCE_PROXY_URL=https://moa-xhck.onrender.com
YFINANCE_PROXY_KEY=yfin_api_123456789
```

#### 🟡 IMPORTANT - MCP Services (External)

```
FINMCP_TOKEN=[YOUR_TOKEN]
UWMCP_MCP_TOKEN=[YOUR_TOKEN]
FINVIZ_SERVER_TOKEN=[YOUR_TOKEN]
FINMCP_URL=https://finmcp-f2xz.onrender.com/mcp
UWMCP_URL=https://uwmcp.onrender.com/mcp
FINVIZ_URL=https://mcp-finviz.onrender.com/mcp
```

#### 🟡 IMPORTANT - Additional API Keys

```
JINA_API_KEY=jina_faf4cf7cceb34338b3b2fbc0080c9833DZ5wS2ujfF8qzfNrA7aC11fDVJOy
```

#### 🟢 CONFIGURATION - Application Settings

```
NODE_ENV=production
PORT=8080
DATA_DIR=./data
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
AUTH_REQUIRE_EMAIL_CONFIRMATION=false
AUTH_APPROVED_LIST_PATH=./config/approved_users.json
RUNTIME_ENV_PATH=./data/.runtime_env.json
```

**⚠️ UPDATE THESE:**
- `ALLOWED_ORIGINS` - Set to your frontend URL (e.g., `https://aibt-frontend.onrender.com`)
- Add `https://your-custom-domain.com` if you have one
- Multiple origins: `https://frontend1.com,https://frontend2.com`

#### 🟢 CONFIGURATION - MCP Service Ports (Local Services)

```
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003
```

**⚠️ NOTE:** These are for local MCP services. If you're NOT deploying local MCP services separately, these won't be used but are required by the config.

#### 🟢 CONFIGURATION - Agent Settings (Optional - Has Defaults)

```
AGENT_MAX_STEPS=30
AGENT_MAX_RETRIES=3
AGENT_BASE_DELAY=1.0
AGENT_INITIAL_CASH=10000.0
```

---

### Step 5: Configure Health Check

1. **Go to:** Settings → Health & Alerts
2. **Health Check Path:** `/`
3. **Health Check Enabled:** ✅ Yes

The backend has a health endpoint at `/` that returns:
```json
{"status": "healthy", "timestamp": "..."}
```

---

### Step 6: Deploy!

1. **Click:** "Create Web Service" (bottom of page)
2. **Wait:** Render will:
   - Clone your repository
   - Run `pip install -r requirements.txt`
   - Start `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Monitor:** Watch the deployment logs in real-time

**Expected startup logs:**
```
🚀 AI-Trader API Starting...
📊 Environment: production
🔐 Auth: Enabled (Supabase)
🗄️  Database: PostgreSQL (Supabase)
🌐 CORS: https://your-frontend.com
🔧 Starting MCP services...
⚠️  MCP services failed to start - AI trading may not work
✅ API Ready on port 8080
```

**⚠️ Expected Warning:** "MCP services failed to start" is NORMAL if you haven't deployed local MCP services separately.

---

### Step 7: Verify Deployment

**Once deployed, test these endpoints:**

1. **Health Check:**
   ```bash
   curl https://your-backend.onrender.com/
   ```
   Expected: `{"status":"healthy","timestamp":"..."}`

2. **API Docs:**
   ```
   https://your-backend.onrender.com/api/docs
   ```
   Should show Swagger UI

3. **Stock Prices (Public):**
   ```bash
   curl https://your-backend.onrender.com/api/stock-prices
   ```
   Should return NASDAQ 100 data

---

## 🔧 Post-Deployment Configuration

### 1. Update Frontend Environment Variables

Update your frontend `.env` to point to the deployed backend:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
```

### 2. Update CORS Origins

Once you deploy the frontend, update the backend's `ALLOWED_ORIGINS` environment variable:

```
ALLOWED_ORIGINS=https://your-frontend.onrender.com,https://your-custom-domain.com
```

**Redeploy** after changing environment variables.

### 3. Add Approved Users

The backend uses whitelist-based signup. Users are stored in `backend/config/approved_users.json`:

```json
{
  "admins": [
    "adam@truetradinggroup.com"
  ],
  "users": [
    "mperinotti@gmail.com",
    "samerawada92@gmail.com"
  ]
}
```

To add users:
1. Edit `backend/config/approved_users.json` in your repository
2. Commit and push changes
3. Render will auto-deploy (if auto-deploy is enabled)

---

## ⚠️ Important Warnings & Considerations

### 1. Ephemeral File System

**Render uses ephemeral file system** - files written at runtime are LOST on restart/redeploy.

**Affected directories:**
- `/data/*.jsonl` - Trading data (should be in repo for read-only access)
- `/data/agent_data/` - AI model histories (consider moving to Supabase Storage)
- `/data/.runtime_env.json` - Runtime config (will be recreated, or use env vars)

**Solutions:**
- Keep read-only data in Git repository
- Use Render Persistent Disk ($1/GB/month) - see Render docs
- Move dynamic data to Supabase Storage or Database
- Use environment variables instead of runtime JSON files

### 2. MCP Services Won't Start

As mentioned, local MCP services use subprocesses and won't work on Render without separate deployments.

**To fix:**
- Deploy each MCP service as separate Render Web Service (4 services × $7-21/month each)
- OR modify code to use only external MCP services
- OR consolidate into main app

### 3. Cold Starts (Free Tier)

If using Render's free tier:
- ❄️ Services spin down after 15 minutes of inactivity
- 🐌 First request after spin-down takes ~30-60 seconds
- 💵 Upgrade to Starter ($7/month) for always-on service

### 4. Database Migrations

If you need to run database migrations:
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/lfewxxeiplfycmymzmjz/sql
2. Run migrations from `backend/migrations/001_initial_schema.sql`
3. Or create new migrations as needed

### 5. Environment Variable Security

**Never commit** `.env` file to Git! Environment variables are set in Render dashboard.

**Currently exposed in your .env:**
- ✅ All credentials are already in the deployment guide above
- ⚠️ Consider rotating sensitive keys (API keys, JWT secret, database passwords)
- 🔐 Use Render's "Secret Files" feature for sensitive files

---

## 🐛 Troubleshooting

### Deployment Failed: "Module not found"

**Cause:** Missing dependencies in `requirements.txt`

**Fix:**
1. Check the error log for missing module name
2. Add to `requirements.txt`
3. Commit and push
4. Redeploy

### Deployment Failed: "Port already in use"

**Cause:** Start command not using `$PORT`

**Fix:**
- Start command MUST be: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Do NOT hardcode port number

### App Crashes: "Connection refused" to Supabase

**Cause:** Missing or incorrect Supabase environment variables

**Fix:**
1. Verify all `SUPABASE_*` variables are set
2. Check for typos in values
3. Test connection from local machine first

### App Crashes: "MCP services failed"

**Cause:** Local MCP services can't start (expected on Render)

**Fix:**
- This is EXPECTED behavior (see MCP Services section above)
- AI trading may not work without external MCP services
- Consider deploying MCP services separately

### CORS Errors in Frontend

**Cause:** `ALLOWED_ORIGINS` doesn't include frontend URL

**Fix:**
1. Update `ALLOWED_ORIGINS` environment variable
2. Format: `https://frontend.com,https://app.com`
3. Redeploy backend
4. Clear browser cache

### Health Check Failing

**Cause:** App not starting or crashing immediately

**Fix:**
1. Check deployment logs for errors
2. Verify all REQUIRED environment variables are set
3. Test locally with same environment variables
4. Check if Supabase and Redis are accessible

---

## 📊 Monitoring & Logs

### View Logs

**In Render Dashboard:**
1. Go to your service
2. Click "Logs" tab
3. See real-time application logs

**Logs show:**
- Startup sequence
- API requests
- Errors and exceptions
- MCP service status
- Database queries (if enabled)

### Metrics

**Render provides:**
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

Access via "Metrics" tab in service dashboard.

---

## 💰 Cost Estimation

### Free Tier
- ✅ 750 hours/month (service spins down after 15 min idle)
- ✅ Suitable for development/testing
- ❌ Cold starts on every request after idle

### Starter Plan ($7/month per service)
- ✅ Always-on (no cold starts)
- ✅ 0.5 GB RAM
- ✅ Shared CPU
- ✅ Suitable for production

### If Deploying MCP Services Separately
- 🔢 5 total services (1 main + 4 MCP)
- 💵 5 × $7/month = **$35/month**
- ⚠️ Consider consolidating architecture to reduce cost

---

## 🔄 Auto-Deploy Setup

To enable automatic deployments on Git push:

1. **Go to:** Service Settings
2. **Find:** "Auto-Deploy"
3. **Enable:** Auto-Deploy from `main` branch
4. **Save**

Now every push to `main` branch triggers automatic redeployment.

**Deployment hooks:**
- Pre-deploy: Runs `pip install -r requirements.txt`
- Deploy: Starts `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Post-deploy: Health check validates deployment

---

## 🎯 Next Steps After Deployment

1. ✅ Test all API endpoints with Swagger UI (`/api/docs`)
2. ✅ Deploy frontend and update `ALLOWED_ORIGINS`
3. ✅ Test authentication (signup, login, logout)
4. ✅ Verify database connections (create test model)
5. ✅ Test AI trading functionality (may need MCP services)
6. ✅ Set up monitoring and alerts
7. ✅ Configure custom domain (optional)
8. ✅ Enable HTTPS (automatic on Render)

---

## 📞 Support

**Render Documentation:** https://render.com/docs  
**Supabase Dashboard:** https://supabase.com/dashboard  
**API Documentation:** `https://your-backend.onrender.com/api/docs`

**Common Issues:**
- Check Render community forums
- Verify environment variables
- Review deployment logs
- Test locally with production env vars

---

**END OF DEPLOYMENT GUIDE**

**Last Updated:** 2025-11-02  
**Tested On:** Render Web Service, Python 3.11+, FastAPI 0.104+

