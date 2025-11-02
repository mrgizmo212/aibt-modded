# 2025-11-02 - Render Deployment Guide Created

## Context

User requested help deploying the backend to Render manually. The backend is a FastAPI application in a GitHub repository identical to the root workspace.

## What I Created

1. **`backend/RENDER_DEPLOYMENT_GUIDE.md`** - Comprehensive deployment guide
2. **`backend/RENDER_DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist

## Key Findings During Analysis

### Backend Structure
[FILENAME: `backend/main.py` - lifespan function around lines 58-96]
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler (replaces deprecated on_event)"""
    # Startup
    print("🚀 AI-Trader API Starting...")
    # Start MCP services automatically
    mcp_startup_result = await mcp_manager.start_all_services()
```

### Critical Issue: MCP Services Architecture

[FILENAME: `backend/trading/mcp_manager.py` - start_service function around lines 81-100]
```python
def start_service(self, service_id: str, config: Dict) -> Dict:
    """Start a single MCP service"""
    # Start service process with visible output for debugging
    process = subprocess.Popen(
        [sys.executable, str(script_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(self.mcp_services_dir),
        env=os.environ.copy()
```

**PROBLEM:** The backend tries to start LOCAL MCP services as subprocesses binding to ports 8000-8003. This **WILL NOT WORK** on Render because:
1. Render only exposes ONE port (the main app port)
2. Multiple processes binding to different ports are not allowed on free/starter plans
3. Startup will show warning: "MCP services failed to start"

**Solutions Documented:**
- Option A: Disable local MCP, use external services only (recommended)
- Option B: Deploy 4 separate Render services for MCP (expensive: 5 × $7/month = $35/month)
- Option C: Consolidate MCP services into main app (requires code changes)

### Environment Variables

Total: 30+ environment variables required

**CRITICAL (Must Set):**
- Supabase: 5 variables (URL, keys, JWT secret, database URL)
- OpenAI: 2 variables (API base, API key)
- Upstash Redis: 2 variables (URL, token)

**IMPORTANT:**
- Market data proxies: 4 variables (Polygon, YFinance URLs and keys)
- External MCP services: 6 variables (tokens and URLs)
- Jina API: 1 variable

**CONFIGURATION:**
- Application: 7 variables (NODE_ENV, PORT, ALLOWED_ORIGINS, etc.)
- MCP ports: 4 variables (8000-8003)
- Agent settings: 4 variables (has defaults)

### Deployment Configuration

[FILENAME: `backend/requirements.txt` - complete file]
```
# FastAPI Backend Dependencies
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
# ... (39 total dependencies)
```

**Build Command:** `pip install -r requirements.txt`
**Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
**Root Directory:** `backend` (CRITICAL: must be exactly this)

### File System Considerations

**Ephemeral File System on Render:**
- `/data/*.jsonl` - Trading data (should be in repo for read-only)
- `/data/agent_data/` - AI model histories (consider Supabase Storage)
- `/data/.runtime_env.json` - Runtime config (will be recreated)
- `/config/approved_users.json` - Approved users (can be in repo, read-only)

**Solutions:**
- Keep read-only data in Git
- Use Render Persistent Disk ($1/GB/month)
- Move dynamic data to Supabase Storage
- Use environment variables instead of runtime files

## Deployment Guide Contents

### Main Guide (`RENDER_DEPLOYMENT_GUIDE.md`)

1. **MCP Services Architecture Warning** - Critical issue explained
2. **Step-by-Step Deployment** - 7 detailed steps
3. **Environment Variables** - All 30+ variables categorized and explained
4. **Health Check Configuration** - How to set up health monitoring
5. **Post-Deployment Configuration** - Frontend integration, CORS, approved users
6. **Warnings & Considerations** - Ephemeral file system, cold starts, security
7. **Troubleshooting** - Common issues and fixes
8. **Monitoring & Logs** - How to view logs and metrics
9. **Cost Estimation** - Free tier vs Starter vs MCP deployment costs
10. **Next Steps** - What to do after deployment

### Checklist (`RENDER_DEPLOYMENT_CHECKLIST.md`)

Interactive checklist format with checkboxes for:
- Pre-deployment prep (4 sections)
- Render dashboard setup (2 sections)
- Environment variables (30+ individual checkboxes)
- Health check configuration
- Deploy & monitor
- Post-deployment verification
- Frontend integration
- Full system test
- Optional production enhancements
- Troubleshooting steps

## What User Needs To Do

1. **Go to Render Dashboard:** https://dashboard.render.com/
2. **Create Web Service** → Connect GitHub repo
3. **Configure:**
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Set ALL 30+ environment variables** (copy from guide)
5. **Deploy** and monitor logs
6. **Update ALLOWED_ORIGINS** after frontend is deployed
7. **Test** all endpoints

## Expected Behavior

**Startup logs will show:**
```
🚀 AI-Trader API Starting...
📊 Environment: production
🔐 Auth: Enabled (Supabase)
⚠️  MCP services failed to start - AI trading may not work
✅ API Ready on port 8080
```

**⚠️ The MCP warning is EXPECTED and NORMAL** unless user deploys MCP services separately.

## Next Session Context

- User may ask about deploying MCP services separately
- User may ask about modifying code to skip MCP initialization
- User may ask about frontend deployment
- User may report deployment errors (be ready to debug)

## Files Created

- `backend/RENDER_DEPLOYMENT_GUIDE.md` - 400+ lines, comprehensive guide
- `backend/RENDER_DEPLOYMENT_CHECKLIST.md` - 200+ lines, interactive checklist
- `docs/tempDocs/2025-11-02-render-deployment-guide.md` - This file

## Lessons Learned

1. **Always check for subprocess usage** - Won't work on cloud platforms like Render
2. **Ephemeral file systems** - Common on cloud platforms, need to plan for persistence
3. **Port binding restrictions** - Cloud platforms typically only expose one port
4. **Environment variable management** - Critical for cloud deployment, never commit secrets
5. **Architecture mismatch** - Local development architecture may not work on cloud without modifications

## Related Code Citations

[FILENAME: `backend/config.py` - Settings class around lines 17-105]
- Defines all environment variables with Pydantic
- Uses `pydantic-settings` for validation
- Has properties for CORS origins list

[FILENAME: `backend/auth.py` - authentication functions]
- Uses Supabase for authentication
- Requires SUPABASE_* environment variables

[FILENAME: `backend/services.py` - database operations]
- All database operations use Supabase client
- Requires DATABASE_URL and Supabase credentials

## Warnings Given to User

1. **MCP services won't work** without separate deployment or code changes
2. **File system is ephemeral** - data written at runtime is lost on restart
3. **Cold starts on free tier** - 30-60 second delay after 15 min idle
4. **ALLOWED_ORIGINS must be updated** after frontend deployment
5. **Cost implications** - MCP services separately = $35/month vs $7/month for main app only

---

**Status:** Complete - User has everything needed for manual Render deployment

**Next:** User will follow guide and deploy, may return with questions or errors

