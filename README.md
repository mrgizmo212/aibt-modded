# AIBT - AI-Trader Frontend Dashboard

**Modern Next.js dashboard for AI trading agent visualization**

---

## 🎯 Project Overview

**AIBT** is a full-stack web application for visualizing and monitoring autonomous AI trading agents from the [AI-Trader](../aitrtader) project.

### Stack:
- **Frontend:** Next.js 14 + Shadcn UI + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Data Source:** AI-Trader JSONL files
- **Theme:** Dark (pure black)
- **Design:** Mobile-first responsive

---

## 📊 Features

- 🏆 **Leaderboard** - Compare AI model performance
- 📈 **Performance Charts** - Portfolio value over time
- 📋 **Position Tracking** - View holdings and cash
- 🔍 **Trading Logs** - See AI reasoning for each decision
- ⚡ **Real-Time Updates** - Live data polling
- 📱 **Mobile Responsive** - Works on all devices
- 👥 **Multi-User** - Async support for concurrent viewers

---

## 🚀 Quick Start

### Prerequisites:
- AI-Trader running with trading data (see `../aitrtader`)
- Node.js 18+
- Python 3.8+

### Start Backend:
```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Start Frontend:
```powershell
cd frontend
npm install
npm run dev
```

### Access Dashboard:
Open browser to `http://localhost:3000`

---

## 📁 Project Structure

```
aibt/
├── backend/        # FastAPI server (port 8080)
├── frontend/       # Next.js app (port 3000)
└── docs/           # Documentation
    ├── overview.md
    ├── plan.md     # Implementation plan
    └── projects-for-context-only/
        └── connection-overview.md  # Links to aitrtader
```

---

## 🔗 Relationship to AI-Trader

**AIBT consumes data from AI-Trader:**
- Reads: `aitrtader/data/agent_data/` (trading history)
- Imports: `aitrtader/tools/` (calculation functions)
- **Never modifies** aitrtader code or data

See: `docs/projects-for-context-only/connection-overview.md`

---

## 📖 Documentation

- **`docs/overview.md`** - Complete architecture & code walkthrough
- **`docs/plan.md`** - Full implementation plan with code examples
- **`docs/wip.md`** - Current work status
- **`docs/bugs-and-fixes.md`** - Bug tracking

---

## 🎨 Design System

**Colors:**
- Background: Pure black (`#000000`)
- Cards: Dark gray (`#0a0a0a`)
- Borders: Zinc 800
- Accent: Green for positive, Red for negative
- Text: White/Gray scale

**Components:** Shadcn UI (Radix + Tailwind)

**Responsive:** Mobile-first breakpoints

---

## 🔧 Development Status

**Current Status:** 🟡 In Development

- ✅ Project structure created
- ✅ Documentation complete
- ✅ Implementation plan ready
- ⏸️ Awaiting approval to begin coding

---

```
# Supabase Configuration
SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTAxNDUsImV4cCI6MjA3NzMyNjE0NX0.qQN-zUgDgtuVl2oxyUJ8bYqeNDIRKy5oM1gomg2hBTk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZXd4eGVpcGxmeWNteW16bWp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc1MDE0NSwiZXhwIjoyMDc3MzI2MTQ1fQ.vHUXUeMvNnxr-FeZmubVJwnjkBxjc3F7dcq9lUcAQFA
SUPABASE_JWT_SECRET=F4i+rPJLpET3XJbffe4B4qw9vEqtg7xeFegu2p5jEqN+oA4nHnfu8IAiNA2jvRn5/w0bQyIGr+tVD2mXH0uLIg==

# Direct PostgreSQL Connection (for migrations, direct DB access)
DATABASE_URL=postgresql://postgres:sFVZ4czM8YnmFuDZ@db.lfewxxeiplfycmymzmjz.supabase.co:5432/postgres

# Backend Configuration
BACKEND_PORT=8080
DATA_DIR=./backend/data

# CORS Configuration  
ALLOWED_ORIGINS=http://localhost:3000

# Authentication Configuration
AUTH_REQUIRE_EMAIL_CONFIRMATION=false
AUTH_APPROVED_LIST_PATH=./backend/config/approved_users.json

# Environment
NODE_ENV=development



```

## 📞 Related Projects

- **AI-Trader:** `../aitrtader` - Autonomous trading system
- **GitHub:** https://github.com/HKUDS/AI-Trader

---

**License:** MIT  
**Created:** 2025-10-29

