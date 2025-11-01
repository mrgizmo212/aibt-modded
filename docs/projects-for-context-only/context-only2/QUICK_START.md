# AI-Trader Quick Start Card

**One-page reference for getting started fast**

---

## 🚀 Two-Command Setup

```powershell
# Terminal 1 (keep running)
.\start_services.ps1

# Terminal 2 (watch AI trade)
.\run_trading.ps1
```

**Done!** 🎉

---

## 🔑 API Keys Needed

1. **OpenRouter:** https://openrouter.ai/keys (Add $5+ credits)
2. **Jina AI:** https://jina.ai/ (Free tier OK)

Put in `.env` file (NO quotes, forward slashes):
```bash
OPENAI_API_KEY=sk-or-v1-YOUR_KEY
JINA_API_KEY=jina_YOUR_KEY
RUNTIME_ENV_PATH=C:/Users/User/Desktop/CS1027/aitrtader/.runtime_env.json
```

---

## 📊 View Results

```powershell
# See trades
cat data\agent_data\gpt-4o\position\position.jsonl

# See AI reasoning
cat data\agent_data\gpt-4o\log\2025-10-16\log.jsonl

# Final portfolio
Get-Content data\agent_data\gpt-4o\position\position.jsonl -Tail 1 | ConvertFrom-Json
```

---

## 🔧 Change Settings

```powershell
notepad configs\default_config.json
```

**Key settings:**
- `init_date` / `end_date` - Trading period
- `basemodel` - AI model (e.g., `openai/gpt-4o`)
- `enabled: true` - Which models to run
- `initial_cash` - Starting capital ($10,000 default)

---

## 🐛 Common Issues

| Error | Fix |
|-------|-----|
| 401 auth error | Remove Windows env var: `Remove-Item Env:\OPENAI_API_KEY` |
| Path error (`\x07`) | Use forward slashes in `.env`: `C:/...` not `C:\...` |
| Port in use | Kill process: `taskkill /F /PID XXXX` |
| AI stuck asking questions | Fixed! (Updated prompt 2025-10-29) |

**Full troubleshooting:** See `SETUP_GUIDE.md`

---

## 📁 Important Files

- `.env` - Your API keys
- `configs/default_config.json` - Model & date settings
- `data/agent_data/{model}/position/position.jsonl` - Trading history
- `data/agent_data/{model}/log/{date}/log.jsonl` - AI reasoning

---

## 🎯 Available Models (OpenRouter)

**Paid (high quality):**
- `openai/gpt-4o` ✅ Tested & Working
- `anthropic/claude-3.7-sonnet` ✅ Recommended
- `openai/gpt-5` ✅ Available (requires credits)

**Free (testing):**
- `google/gemini-2.0-flash-exp:free`

---

## 📖 Full Documentation

- **`SETUP_GUIDE.md`** - Complete setup instructions
- **`docs/overview.md`** - Architecture & code walkthrough
- **`docs/bugs-and-fixes.md`** - All bugs & lessons learned
- **`docs/wip.md`** - Features in progress

---

**Questions?** Check `SETUP_GUIDE.md` or `docs/bugs-and-fixes.md`

