# AI-Trader Setup Guide (Windows)

**Last Updated:** 2025-10-29 10:30  
**Tested On:** Windows 10/11, PowerShell, Python 3.12

This guide contains the **actual working setup process** with all bugs fixed and issues resolved.

---

## 🚀 Quick Start (2 Commands)

**Terminal 1 - Start Services:**
```powershell
.\start_services.ps1
```
*(Keep this running)*

**Terminal 2 - Run Trading:**
```powershell
.\run_trading.ps1
```

That's it! The helper scripts handle everything.

---

## 📋 Detailed Setup (If Scripts Don't Work)

### Prerequisites

- Python 3.8+ installed
- PowerShell
- Git (optional, for cloning)

---

### Step 1: Install Dependencies

```powershell
cd C:\Users\User\Desktop\CS1027\aitrtader
pip install -r requirements.txt
```

**Packages installed:**
- `langchain==1.0.2`
- `langchain-openai==1.0.1`
- `langchain-mcp-adapters>=0.1.0`
- `fastmcp==2.12.5`

---

### Step 2: Configure Environment Variables

**Create .env file:**
```powershell
Copy-Item .env.example .env
notepad .env
```

**Critical format (NO quotes, forward slashes):**
```bash
# AI Model API
OPENAI_API_BASE=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-YOUR_KEY_HERE

# Web Search
JINA_API_KEY=jina_YOUR_KEY_HERE

# Optional - only for fetching new data
ALPHAADVANTAGE_API_KEY=YOUR_KEY_HERE

# MCP Ports (leave as-is)
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003

# Agent Config
AGENT_MAX_STEP=30

# Runtime file - USE FORWARD SLASHES!
RUNTIME_ENV_PATH=C:/Users/User/Desktop/CS1027/aitrtader/.runtime_env.json
```

**⚠️ CRITICAL:**
- **NO quotes** around values
- **Forward slashes** in paths (not backslashes)
- Get OpenRouter key from: https://openrouter.ai/keys
- Get Jina key from: https://jina.ai/

---

### Step 3: Create Runtime Environment File

```powershell
$runtimeEnv = @"
{
    "SIGNATURE": "",
    "TODAY_DATE": "",
    "IF_TRADE": false
}
"@
$runtimeEnv | Out-File -FilePath ".runtime_env.json" -Encoding utf8
```

---

### Step 4: Configure Trading Competition

```powershell
notepad configs\default_config.json
```

**Quick test config (2 days):**
```json
{
  "agent_type": "BaseAgent",
  "date_range": {
    "init_date": "2025-10-15",
    "end_date": "2025-10-17"
  },
  "models": [
    {
      "name": "gpt-4o",
      "basemodel": "openai/gpt-4o",
      "signature": "gpt-4o",
      "enabled": true
    }
  ],
  "agent_config": {
    "max_steps": 30,
    "max_retries": 3,
    "base_delay": 1.0,
    "initial_cash": 10000.0
  }
}
```

**For longer tests:** Change `end_date` to later date (e.g., `2025-10-31`)

---

### Step 5: Start MCP Services

**Open NEW PowerShell window:**

```powershell
cd C:\Users\User\Desktop\CS1027\aitrtader\agent_tools
python start_mcp_services.py
```

**Keep this window running!** You should see:
```
🎉 All MCP services started!
🛑 Press Ctrl+C to stop all services
```

---

### Step 6: Run Trading System

**In ORIGINAL PowerShell window:**

```powershell
cd C:\Users\User\Desktop\CS1027\aitrtader

# Activate venv
.\venv\Scripts\activate

# 🔴 CRITICAL: Remove Windows environment variables that override .env
Remove-Item Env:\OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\OPENAI_API_BASE -ErrorAction SilentlyContinue

# Set UTF-8 encoding for emoji support
$env:PYTHONIOENCODING="utf-8"

# Run the trading system
python main.py
```

---

## 🐛 Troubleshooting

### Issue 1: Error - "Invalid argument: ...\x07..."

**Symptom:**
```
OSError: [Errno 22] Invalid argument: 'C:\\Users\\...\\x07itrtader\\.runtime_env.json'
```

**Solution:**
Edit `.env` and use **forward slashes**:
```bash
# Wrong (backslashes cause escape sequences)
RUNTIME_ENV_PATH="C:\Users\...\aitrtader\.runtime_env.json"

# Correct (forward slashes)
RUNTIME_ENV_PATH=C:/Users/User/Desktop/CS1027/aitrtader/.runtime_env.json
```

**See:** BUG-001 in `bugs-and-fixes.md`

---

### Issue 2: Error 401 - "No cookie auth credentials found"

**Symptom:**
```
Error code: 401 - {'error': {'message': 'No cookie auth credentials found', 'code': 401}}
```

**Causes & Solutions:**

**A) Windows environment variable override:**
```powershell
# Check what Python is loading
python test_env.py

# If it shows wrong key, remove Windows env var:
Remove-Item Env:\OPENAI_API_KEY
Remove-Item Env:\OPENAI_API_BASE
```

**B) OpenRouter account needs credits:**
- Go to: https://openrouter.ai/credits
- Add $5-10 credits
- Retry

**C) Invalid API key:**
- Test key:
```powershell
Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/models" -Headers @{Authorization="Bearer YOUR_KEY"}
```
- If fails, generate new key at: https://openrouter.ai/keys

**See:** BUG-002 in `bugs-and-fixes.md`

---

### Issue 3: AI Gets Stuck Asking Questions

**Symptom:**
```
🔄 Step 25/30
"Would you like me to explore..."
"Should I investigate..."
```

**Solution:**
This was fixed in session 2025-10-29. Make sure you have the latest `prompts/agent_prompt.py` with the autonomous trading prompt.

**Verify fix:**
```powershell
cat prompts\agent_prompt.py | Select-String "AUTONOMOUS"
```

Should show: `You are an AUTONOMOUS stock trading AI`

**See:** BUG-003 in `bugs-and-fixes.md`

---

### Issue 4: "Address already in use" (Port Conflict)

**Symptom:**
```
OSError: [Errno 48] Address already in use
```

**Solution:**
```powershell
# Find what's using the ports
netstat -ano | findstr ":8000"
netstat -ano | findstr ":8001"  
netstat -ano | findstr ":8002"
netstat -ano | findstr ":8003"

# Kill the processes (replace XXXX with PID)
taskkill /F /PID XXXX
```

---

### Issue 5: MCP Services Failed to Start

**Symptom:**
```
❌ Math service failed to start
```

**Solution:**
```powershell
# Check the logs
cat logs\math.log
cat logs\search.log
cat logs\trade.log

# Usually they did start, health check was just impatient
# Verify they're actually running:
netstat -ano | findstr ":8000 :8001 :8002 :8003"
```

---

## 📊 Viewing Results

### Check Trading History

```powershell
# See all trades
cat data\agent_data\gpt-4o\position\position.jsonl

# See last trade only
Get-Content data\agent_data\gpt-4o\position\position.jsonl -Tail 1
```

### Read AI's Reasoning

```powershell
# List trading days
ls data\agent_data\gpt-4o\log\

# Read reasoning for specific day
cat data\agent_data\gpt-4o\log\2025-10-16\log.jsonl
```

### View Final Portfolio

```powershell
Get-Content data\agent_data\gpt-4o\position\position.jsonl -Tail 1 | ConvertFrom-Json | Select-Object -ExpandProperty positions | Format-List
```

---

## 🎯 Common Workflows

### Fresh Start (Reset Everything)

```powershell
# Delete all trading data
Remove-Item -Recurse -Force data\agent_data\*

# Run again
.\run_trading.ps1
```

### Run Longer Backtest

```powershell
# Edit config
notepad configs\default_config.json

# Change end_date to later (e.g., 2025-10-31)
# Save and run
.\run_trading.ps1
```

### Compare Multiple AI Models

```powershell
# Edit config
notepad configs\default_config.json

# Enable multiple models:
# Set "enabled": true for GPT-4o, Claude, DeepSeek, etc.
# Save and run
.\run_trading.ps1
```

**Note:** Each model runs sequentially, not in parallel.

---

## 📁 File Locations

**Configuration:**
- `.env` - API keys and environment variables
- `configs/default_config.json` - Model and date settings
- `.runtime_env.json` - Runtime state (auto-managed)

**Data:**
- `data/merged.jsonl` - Historical price data (NASDAQ 100)
- `data/agent_data/{model}/position/position.jsonl` - Trading history
- `data/agent_data/{model}/log/{date}/log.jsonl` - AI reasoning logs

**Services:**
- `agent_tools/tool_*.py` - MCP service implementations
- `logs/*.log` - Service logs

**Documentation:**
- `docs/overview.md` - Complete codebase documentation
- `docs/bugs-and-fixes.md` - All bugs and lessons learned
- `docs/wip.md` - Work in progress tracking

---

## 🔑 Getting API Keys

### OpenRouter (Required)
1. Go to: https://openrouter.ai/
2. Sign up / Log in
3. Keys: https://openrouter.ai/keys → Create Key
4. Credits: https://openrouter.ai/credits → Add $5-10
5. Copy key (starts with `sk-or-v1-`)

### Jina AI (Required)
1. Go to: https://jina.ai/
2. Sign up / Log in  
3. Get API key from dashboard
4. Copy key (starts with `jina_`)

### Alpha Vantage (Optional - only for new data)
1. Go to: https://www.alphavantage.co/
2. Get free API key
3. (Not needed if you have pre-existing `data/merged.jsonl`)

---

## ✅ Success Checklist

After setup, verify:

- [ ] `.env` file exists with API keys (NO quotes, forward slashes)
- [ ] `.runtime_env.json` exists (empty values OK)
- [ ] `data/merged.jsonl` exists (price data)
- [ ] Virtual environment activated
- [ ] MCP services running (all 4 on ports 8000-8003)
- [ ] Windows env vars removed (`OPENAI_API_KEY`, `OPENAI_API_BASE`)
- [ ] UTF-8 encoding set (`$env:PYTHONIOENCODING="utf-8"`)
- [ ] Config has at least one model enabled
- [ ] OpenRouter account has credits

---

## 🎉 You're Ready!

If all checklist items pass, run:

```powershell
.\run_trading.ps1
```

And watch your AI trade! 📈

---

## 📞 Need Help?

- **Documentation:** See `docs/overview.md` for complete architecture
- **Bugs:** See `docs/bugs-and-fixes.md` for known issues and fixes
- **Issues:** https://github.com/HKUDS/AI-Trader/issues

---

**END OF SETUP GUIDE**

