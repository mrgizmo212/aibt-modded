# AI-Trader FastAPI Backend

**Version:** 2.0.0  
**Created:** 2025-10-29  
**Database:** Supabase PostgreSQL with RLS

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

`.env` file is already configured with Supabase credentials.

### 3. Run Database Migration

Go to Supabase SQL Editor and run:
```powershell
cat migrations/001_initial_schema.sql
```

Or visit: https://supabase.com/dashboard/project/lfewxxeiplfycmymzmjz/sql

### 4. Start Server

```powershell
python main.py
```

Or with uvicorn:
```powershell
uvicorn main:app --reload --port 8080
```

Server runs on: `http://localhost:8080`

API Docs: `http://localhost:8080/api/docs`

---

## 📁 File Structure

```
backend/
├── main.py              # FastAPI app with all routes
├── auth.py              # Authentication & authorization
├── models.py            # Pydantic schemas
├── services.py          # Database operations
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
│
├── migrations/
│   └── 001_initial_schema.sql  # Database schema
│
├── config/
│   └── approved_users.json     # Whitelist for signup
│
├── utils/               # Copied from aitrtader
│   ├── result_tools.py # Performance calculations
│   ├── price_tools.py  # JSONL parsing
│   └── general_tools.py
│
└── data/               # Trading data (local copy)
    ├── merged.jsonl
    └── agent_data/     # 7 AI models with history
```

---

## 🔐 Authentication

**Signup:** Whitelist-only (check `config/approved_users.json`)

**Approved Users:**
- Admins: `adam@truetradinggroup.com`
- Users: `mperinotti@gmail.com`, `samerawada92@gmail.com`

**To add users:** Edit `backend/config/approved_users.json`

**No email confirmation required** - instant access after signup

---

## 🛡️ Security (Row Level Security)

**Users can only:**
- ✅ View their own models
- ✅ View their own positions & logs
- ✅ View their own performance metrics
- ❌ Cannot see other users' data

**Admins can:**
- ✅ View all users
- ✅ View all models (across all users)
- ✅ View system statistics
- ✅ Manage user roles
- ✅ Access leaderboard (all models)

**RLS enforced at database level** - FastAPI cannot bypass it

---

## 📡 API Endpoints

### Public (No Auth)
- `GET /` - Health check
- `GET /api/health` - Detailed health
- `GET /api/stock-prices` - NASDAQ 100 price data

### Authentication
- `POST /api/auth/signup` - Register (whitelist-only)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user profile

### User Endpoints (Requires Auth)
- `GET /api/models` - My models
- `POST /api/models` - Create model
- `GET /api/models/{id}/positions` - Model positions
- `GET /api/models/{id}/positions/latest` - Latest position
- `GET /api/models/{id}/logs?date=YYYY-MM-DD` - Trading logs
- `GET /api/models/{id}/performance` - Performance metrics

### Admin Endpoints (Requires Admin Role)
- `GET /api/admin/users` - All users
- `GET /api/admin/models` - All models
- `GET /api/admin/leaderboard` - Global leaderboard
- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/users/{id}/role` - Change user role

---

## 🔧 Configuration

**Environment Variables (.env):**

```bash
# Supabase
SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...

# Backend
PORT=8080
DATA_DIR=./data

# Auth
AUTH_REQUIRE_EMAIL_CONFIRMATION=false
AUTH_APPROVED_LIST_PATH=./config/approved_users.json

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📊 Database Schema

**Tables:**
- `profiles` - User profiles (extends Supabase Auth)
- `models` - AI trading models (owned by users)
- `positions` - Trading position history (private)
- `logs` - AI reasoning logs (private)
- `stock_prices` - NASDAQ 100 data (public)
- `performance_metrics` - Cached calculations

**All tables have RLS policies enforcing privacy!**

---

## 🧪 Testing

```powershell
# Test health
curl http://localhost:8080/

# Test signup (must be approved email)
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"mperinotti@gmail.com","password":"testpass123"}'

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mperinotti@gmail.com","password":"testpass123"}'

# Test protected endpoint (use token from login)
curl http://localhost:8080/api/models \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📖 API Documentation

Once server is running, visit:
- **Swagger UI:** http://localhost:8080/api/docs
- **ReDoc:** http://localhost:8080/api/redoc

Interactive API testing available in Swagger UI.

---







```


**END OF BACKEND README**

