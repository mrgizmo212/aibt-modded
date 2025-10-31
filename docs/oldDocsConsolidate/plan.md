Perfect! I'll follow the task execution framework to create a comprehensive frontend implementation plan for AI-Trader.

Let me start by verifying context and analyzing the requirements:

[9 tools called]

Perfect! I have all the context I need. Let me create a comprehensive frontend implementation plan following the tasks.md framework:

---

# 🎯 IMPLEMENTATION PLAN: NEXT.JS FRONTEND FOR AI-TRADER

## TASK ID: TASK-001

## STEP 1: CONTEXT VERIFICATION ✅

**Documentation Status:**
- ✅ `/docs/overview.md` - Last updated: 2025-10-29 10:30
- ✅ Overview verified against actual code - accurate
- ✅ All architecture and data flows documented

**Related WIP Items:**
- ✅ No conflicting tasks in progress
- ✅ No dependencies blocking this work

**Related Bugs:**
- ✅ All bugs resolved (3 fixed in previous session)
- ✅ No active bugs affecting this implementation

**My Understanding:**
✅ What this task requires: Full-stack frontend with Next.js + FastAPI backend  
✅ Where in codebase this lives: New `frontend/` and `api/` directories  
✅ How this fits: Visualization layer on top of existing trading system  
✅ What could break: Nothing - this is pure addition, no existing code modified

---

## STEP 2: TASK ANALYSIS

### WHAT NEEDS TO BE DONE:

**Core Functionality:**

1. **FastAPI Backend Layer**
   - Acceptance criteria: RESTful API exposing trading data from JSONL files
   - Related code: `tools/result_tools.py` (lines 1-873) - Existing performance calculation functions
   
2. **Next.js Dashboard Application**
   - Acceptance criteria: Mobile-first dark-themed UI showing all AI model performance
   - Related code: `docs/index.html` (lines 1-93) - Existing basic dashboard to modernize

3. **Multi-User Async Support**
   - Acceptance criteria: Multiple users can view data simultaneously without conflicts
   - Related code: Read-only data access (no state conflicts possible)

4. **Real-Time Data Updates**
   - Acceptance criteria: Dashboard shows latest data as AI agents trade
   - Related code: Polling mechanism to refresh data periodically

---

### EDGE CASES TO HANDLE:

1. **No trading data exists yet** - Code location: API endpoints must handle empty directories
2. **Agent still trading (incomplete day)** - Handle partial logs gracefully
3. **Multiple trades same day** - Show latest position (already handled in `result_tools.py`)
4. **Missing price data** - Handle gracefully in portfolio valuation
5. **Mobile viewport constraints** - Responsive charts and tables

---

### NON-FUNCTIONAL REQUIREMENTS:

- **Performance:** API responses < 500ms, dashboard load < 2s
- **Security:** Read-only API, no authentication needed (local deployment)
- **Scalability:** Support 10+ AI models, 100+ trading days
- **Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge), mobile Safari/Chrome

---

## STEP 3: IMPACT ANALYSIS

### COMPONENTS THAT WILL BE MODIFIED:

**Primary Files - ALL NEW (No existing code modified):**

1. **`api/main.py`** (NEW)
   - Purpose: FastAPI server exposing trading data
   - Dependencies: `tools/result_tools.py`, `tools/price_tools.py`
   
2. **`frontend/app/page.tsx`** (NEW)
   - Purpose: Dashboard homepage
   - Dependencies: API client, Shadcn UI components

3. **`frontend/components/`** (NEW directory)
   - Purpose: React components for charts, tables, logs
   - Dependencies: Recharts, Shadcn UI

**Secondary Files (New Helper Files):**

1. **`api/services.py`** (NEW)
   - Purpose: Business logic for reading JSONL files
   - Reuses: Functions from `tools/result_tools.py`

2. **`frontend/lib/api.ts`** (NEW)
   - Purpose: API client for calling FastAPI endpoints
   - Dependencies: fetch API

**Tertiary Files (Unchanged, but used as reference):**

1. **`docs/index.html`**
   - Why referenced: Existing visualization approach
   - Action needed: Use as design inspiration, then deprecate

2. **`tools/result_tools.py`**
   - Why referenced: Performance calculation logic
   - Action needed: Import and use in FastAPI backend

---

### SYSTEM-WIDE IMPACT ASSESSMENT:

**Direct Impact:**
- Files to CREATE: ~30 files (FastAPI backend + Next.js app)
- Files to MODIFY: 0 (purely additive)
- Files to DELETE: 0 (can optionally deprecate docs/index.html later)

**Ripple Effects:**

1. **Data Flow Changes:**
   - Current: JSONL files → Manual viewing
   - New: JSONL files → FastAPI → REST API → Next.js → Browser
   - Impact: No changes to existing trading system, only adds visualization layer

2. **Function Call Chain:**
   - No existing chains affected
   - New chain: Frontend → API client → FastAPI endpoints → result_tools functions

3. **State Management:**
   - No global state (stateless API)
   - Frontend state: React hooks for data fetching
   - No conflicts with trading system

4. **API/Interface Changes:**
   - No existing APIs modified
   - New REST API created (FastAPI)
   - No breaking changes

**External Integration Impact:**
- No external projects in this codebase
- Self-contained frontend addition

**Performance Impact:**
- Better: Users can now view data without opening files manually
- New: API server adds ~50MB memory overhead
- Monitoring needed: API response times, concurrent users

**Security Impact:**
- New attack surface: FastAPI endpoints (localhost only, low risk)
- Authentication: None needed (local deployment, read-only data)
- Data exposure: Only exposes what's already in JSONL files

---

### RISK ASSESSMENT:

**🟢 LOW RISK:**

1. **Purely Additive Change**
   - Why low risk: No existing code modified, only new files added
   - Likelihood: No chance of breaking existing trading system
   - Mitigation: Keep frontend/API completely separate
   - Rollback: Delete `frontend/` and `api/` directories

2. **Read-Only Data Access**
   - Why low risk: API only reads JSONL files, never writes
   - Likelihood: No data corruption possible
   - Mitigation: API has no write permissions
   - Rollback: N/A (no data changes)

**🟡 MEDIUM RISK:**

1. **Large Codebase Addition**
   - Why medium risk: ~30 new files, lots of moving parts
   - Likelihood: Medium - bugs in new code won't affect trading
   - Mitigation: Thorough testing, follow Next.js best practices
   - Rollback: Delete new directories

---

## STEP 4: DETAILED IMPLEMENTATION PLAN

```
═══════════════════════════════════════════════════════════════
IMPLEMENTATION PLAN: TASK-001 - NEXT.JS FRONTEND
═══════════════════════════════════════════════════════════════

**Approach:** Create FastAPI backend to expose trading data via REST API, then build Next.js 14 frontend with Shadcn UI for visualization

**Why This Approach:**
- FastAPI backend: Reuses existing `result_tools.py` functions, provides clean REST API
- Next.js 14 App Router: Modern React framework, built-in routing, great DX
- Shadcn UI: Beautiful components, fully customizable, dark mode support
- Separation of concerns: Backend serves data, frontend visualizes

**Estimated Complexity:** High (30+ files, full-stack application)
**Estimated Impact:** 30 files to create, 0 files to modify, ~4000 lines of new code

───────────────────────────────────────────────────────────────
PHASE 1: FAST API BACKEND CREATION
───────────────────────────────────────────────────────────────

**Step 1.1: Create API Directory Structure**

**Files to create:**
```
api/
├── __init__.py
├── main.py          # FastAPI app entry point
├── models.py        # Pydantic response models
├── services.py      # Business logic (read JSONL files)
├── config.py        # Configuration
└── requirements.txt # API-specific dependencies
```

**No existing code to modify** - pure addition

───

**Step 1.2: Create FastAPI Main Application**

**File:** `api/main.py` (NEW)

**Code to create:**
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.services import (
    get_all_models,
    get_model_positions,
    get_model_latest_position,
    get_model_logs,
    get_model_performance,
    get_leaderboard
)
from api.models import (
    ModelListResponse,
    PositionHistoryResponse,
    LatestPositionResponse,
    LogResponse,
    PerformanceResponse,
    LeaderboardResponse
)

app = FastAPI(
    title="AI-Trader API",
    description="REST API for AI Trading Agent data",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI-Trader API", "version": "1.0.0"}

@app.get("/api/models", response_model=ModelListResponse)
def list_models():
    """Get list of all available AI models"""
    return get_all_models()

@app.get("/api/models/{model}/positions", response_model=PositionHistoryResponse)
def get_positions(model: str):
    """Get complete position history for a model"""
    return get_model_positions(model)

@app.get("/api/models/{model}/positions/latest", response_model=LatestPositionResponse)
def get_latest_position_endpoint(model: str):
    """Get latest position for a model"""
    return get_model_latest_position(model)

@app.get("/api/models/{model}/logs/{date}", response_model=LogResponse)
def get_logs(model: str, date: str):
    """Get trading log for specific date"""
    return get_model_logs(model, date)

@app.get("/api/models/{model}/performance", response_model=PerformanceResponse)
def get_performance(model: str):
    """Get performance metrics for a model"""
    return get_model_performance(model)

@app.get("/api/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard_endpoint():
    """Get leaderboard comparing all models"""
    return get_leaderboard()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

**Reasoning:** Clean REST API design, reuses existing calculation logic, CORS for Next.js

───

**Step 1.3: Create Pydantic Models**

**File:** `api/models.py` (NEW)

**Code to create:**
```python
from pydantic import BaseModel
from typing import List, Dict, Optional

class ModelInfo(BaseModel):
    name: str
    signature: str
    data_available: bool
    earliest_date: Optional[str]
    latest_date: Optional[str]
    total_records: int

class ModelListResponse(BaseModel):
    models: List[ModelInfo]
    total_models: int

class Position(BaseModel):
    date: str
    id: int
    this_action: Optional[Dict]
    positions: Dict[str, float]

class PositionHistoryResponse(BaseModel):
    model: str
    positions: List[Position]
    total_records: int

class LatestPositionResponse(BaseModel):
    model: str
    date: str
    positions: Dict[str, float]
    cash: float
    total_value: float

class LogEntry(BaseModel):
    timestamp: str
    signature: str
    new_messages: Dict

class LogResponse(BaseModel):
    model: str
    date: str
    logs: List[LogEntry]

class PerformanceMetrics(BaseModel):
    sharpe_ratio: float
    max_drawdown: float
    cumulative_return: float
    annualized_return: float
    volatility: float
    win_rate: float
    total_trading_days: int

class PerformanceResponse(BaseModel):
    model: str
    metrics: PerformanceMetrics
    portfolio_values: Dict[str, float]

class LeaderboardEntry(BaseModel):
    rank: int
    model: str
    cumulative_return: float
    sharpe_ratio: float
    max_drawdown: float
    final_value: float

class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
    total_models: int
```

**Reasoning:** Type-safe API responses, auto-generated OpenAPI docs

───

**Step 1.3: Create Service Layer**

**File:** `api/services.py` (NEW)

**Code to create:**
```python
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional

# Add parent to path to import tools
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools.result_tools import (
    calculate_all_metrics,
    get_daily_portfolio_values,
    get_available_date_range
)
from tools.price_tools import get_latest_position

def get_all_models() -> Dict:
    """Scan data/agent_data/ for available models"""
    base_dir = Path(__file__).parent.parent
    agent_data_dir = base_dir / "data" / "agent_data"
    
    if not agent_data_dir.exists():
        return {"models": [], "total_models": 0}
    
    models = []
    
    for model_dir in agent_data_dir.iterdir():
        if not model_dir.is_dir():
            continue
        
        model_name = model_dir.name
        position_file = model_dir / "position" / "position.jsonl"
        
        if position_file.exists():
            earliest, latest = get_available_date_range(model_name)
            
            # Count records
            total_records = 0
            with position_file.open("r") as f:
                total_records = sum(1 for line in f if line.strip())
            
            models.append({
                "name": model_name,
                "signature": model_name,
                "data_available": True,
                "earliest_date": earliest,
                "latest_date": latest,
                "total_records": total_records
            })
    
    return {"models": models, "total_models": len(models)}

def get_model_positions(model: str) -> Dict:
    """Get all positions for a model"""
    base_dir = Path(__file__).parent.parent
    position_file = base_dir / "data" / "agent_data" / model / "position" / "position.jsonl"
    
    if not position_file.exists():
        return {"model": model, "positions": [], "total_records": 0}
    
    positions = []
    with position_file.open("r") as f:
        for line in f:
            if line.strip():
                positions.append(json.loads(line))
    
    return {"model": model, "positions": positions, "total_records": len(positions)}

def get_model_latest_position(model: str) -> Dict:
    """Get latest position for a model"""
    base_dir = Path(__file__).parent.parent
    position_file = base_dir / "data" / "agent_data" / model / "position" / "position.jsonl"
    
    if not position_file.exists():
        return {"model": model, "date": "", "positions": {}, "cash": 0, "total_value": 0}
    
    # Read last line
    with position_file.open("r") as f:
        lines = f.readlines()
        if lines:
            last_position = json.loads(lines[-1])
            positions = last_position.get("positions", {})
            cash = positions.get("CASH", 0)
            
            # Calculate total value (simplified - would need prices for accuracy)
            return {
                "model": model,
                "date": last_position.get("date", ""),
                "positions": positions,
                "cash": cash,
                "total_value": cash  # Simplified - full calc needs price data
            }
    
    return {"model": model, "date": "", "positions": {}, "cash": 0, "total_value": 0}

def get_model_logs(model: str, date: str) -> Dict:
    """Get trading logs for specific date"""
    base_dir = Path(__file__).parent.parent
    log_file = base_dir / "data" / "agent_data" / model / "log" / date / "log.jsonl"
    
    if not log_file.exists():
        return {"model": model, "date": date, "logs": []}
    
    logs = []
    with log_file.open("r") as f:
        for line in f:
            if line.strip():
                logs.append(json.loads(line))
    
    return {"model": model, "date": date, "logs": logs}

def get_model_performance(model: str) -> Dict:
    """Get performance metrics"""
    metrics = calculate_all_metrics(model)
    
    return {
        "model": model,
        "metrics": {
            "sharpe_ratio": metrics.get("sharpe_ratio", 0.0),
            "max_drawdown": metrics.get("max_drawdown", 0.0),
            "cumulative_return": metrics.get("cumulative_return", 0.0),
            "annualized_return": metrics.get("annualized_return", 0.0),
            "volatility": metrics.get("volatility", 0.0),
            "win_rate": metrics.get("win_rate", 0.0),
            "total_trading_days": metrics.get("total_trading_days", 0)
        },
        "portfolio_values": metrics.get("portfolio_values", {})
    }

def get_leaderboard() -> Dict:
    """Compare all models"""
    models_data = get_all_models()
    
    leaderboard = []
    for model_info in models_data["models"]:
        model = model_info["name"]
        metrics = calculate_all_metrics(model)
        
        portfolio_values = metrics.get("portfolio_values", {})
        if portfolio_values:
            sorted_dates = sorted(portfolio_values.keys())
            final_value = portfolio_values[sorted_dates[-1]]
        else:
            final_value = 10000.0
        
        leaderboard.append({
            "model": model,
            "cumulative_return": metrics.get("cumulative_return", 0.0),
            "sharpe_ratio": metrics.get("sharpe_ratio", 0.0),
            "max_drawdown": metrics.get("max_drawdown", 0.0),
            "final_value": final_value
        })
    
    # Sort by cumulative return (descending)
    leaderboard.sort(key=lambda x: x["cumulative_return"], reverse=True)
    
    # Add ranks
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return {"leaderboard": leaderboard, "total_models": len(leaderboard)}
```

**Reasoning:** Reuses existing calculation logic, clean separation of concerns

───────────────────────────────────────────────────────────────
PHASE 2: NEXT.JS APP SCAFFOLDING
───────────────────────────────────────────────────────────────

**Step 2.1: Initialize Next.js 16 Project**

**Commands:**
```powershell
cd C:\Users\User\Desktop\CS1027\aibt
npx create-next-app@latest frontend --typescript --tailwind --turbopack --app --no-src-dir
```

**Options to select:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Turbopack: Yes (default in Next.js 16)
- Import alias: @/*

**Next.js 16 Features Enabled:**
- ✅ Turbopack bundler (faster builds & Fast Refresh)
- ✅ Cache Components with PPR (optimized rendering)
- ✅ React 19.2 integration
- ✅ New Proxy for middleware (if needed)

───

**Step 2.2: Install Shadcn UI**

**Commands:**
```powershell
cd frontend
npx shadcn@latest init
```

**Configuration:**
- Style: New York
- Base color: Slate
- CSS variables: Yes

**Install components:**
```powershell
npx shadcn@latest add card button table badge tabs select scroll-area
```

───

**Step 2.3: Configure Dark Theme**

**File:** `frontend/app/globals.css` (MODIFY existing)

**Add dark theme CSS variables:**
```css
@layer base {
  :root {
    --background: 0 0% 0%;        /* Pure black */
    --foreground: 0 0% 100%;       /* White text */
    --card: 0 0% 5%;               /* Dark gray cards */
    --card-foreground: 0 0% 100%;
    --primary: 142 76% 36%;        /* Green accent */
    --primary-foreground: 0 0% 100%;
    /* ... more variables */
  }
}
```

**File:** `frontend/tailwind.config.ts` (MODIFY existing)

**Add dark mode:**
```typescript
export default {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  // ... rest of config
}
```

**File:** `frontend/app/layout.tsx` (MODIFY existing)

**Add dark class to html:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white">{children}</body>
    </html>
  )
}
```

───────────────────────────────────────────────────────────────
PHASE 3: API CLIENT & DATA FETCHING
───────────────────────────────────────────────────────────────

**Step 3.1: Create API Client**

**File:** `frontend/lib/api.ts` (NEW)

**Code:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/api/models`)
  if (!res.ok) throw new Error('Failed to fetch models')
  return res.json()
}

export async function fetchModelPositions(model: string) {
  const res = await fetch(`${API_BASE}/api/models/${model}/positions`)
  if (!res.ok) throw new Error('Failed to fetch positions')
  return res.json()
}

export async function fetchModelLatestPosition(model: string) {
  const res = await fetch(`${API_BASE}/api/models/${model}/positions/latest`)
  if (!res.ok) throw new Error('Failed to fetch latest position')
  return res.json()
}

export async function fetchModelLogs(model: string, date: string) {
  const res = await fetch(`${API_BASE}/api/models/${model}/logs/${date}`)
  if (!res.ok) throw new Error('Failed to fetch logs')
  return res.json()
}

export async function fetchModelPerformance(model: string) {
  const res = await fetch(`${API_BASE}/api/models/${model}/performance`)
  if (!res.ok) throw new Error('Failed to fetch performance')
  return res.json()
}

export async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/api/leaderboard`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}
```

───────────────────────────────────────────────────────────────
PHASE 4: CORE UI COMPONENTS
───────────────────────────────────────────────────────────────

**Step 4.1: Dashboard Page**

**File:** `frontend/app/page.tsx` (MODIFY existing)

**Code:**
```tsx
import { fetchModels, fetchLeaderboard } from '@/lib/api'
import { Leaderboard } from '@/components/Leaderboard'
import { StatsGrid } from '@/components/StatsGrid'

export default async function DashboardPage() {
  const modelsData = await fetchModels()
  const leaderboardData = await fetchLeaderboard()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">AI-Trader Dashboard</h1>
      
      <StatsGrid 
        totalModels={modelsData.total_models}
        leaderboard={leaderboardData.leaderboard}
      />
      
      <Leaderboard data={leaderboardData.leaderboard} />
    </div>
  )
}
```

───

**Step 4.2: Leaderboard Component**

**File:** `frontend/components/Leaderboard.tsx` (NEW)

**Code:**
```tsx
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
  rank: number
  model: string
  cumulative_return: number
  sharpe_ratio: number
  max_drawdown: number
  final_value: number
}

export function Leaderboard({ data }: { data: LeaderboardEntry[] }) {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }
  
  const getReturnColor = (returnVal: number) => {
    if (returnVal > 0) return 'text-green-500'
    if (returnVal < 0) return 'text-red-500'
    return 'text-gray-400'
  }
  
  return (
    <Card className="w-full bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle>🏆 AI Model Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Max DD</TableHead>
              <TableHead className="text-right">Portfolio Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.model} className="hover:bg-zinc-900">
                <TableCell className="font-bold">
                  {getMedalEmoji(entry.rank)}
                </TableCell>
                <TableCell className="font-medium">{entry.model}</TableCell>
                <TableCell className={`text-right font-bold ${getReturnColor(entry.cumulative_return)}`}>
                  {(entry.cumulative_return * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right">
                  {entry.sharpe_ratio.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-red-400">
                  {(entry.max_drawdown * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${entry.final_value.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

───

**Step 4.3: Performance Chart Component**

**File:** `frontend/components/PerformanceChart.tsx` (NEW)

**Install Recharts:**
```powershell
npm install recharts
```

**Code:**
```tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PerformanceChartProps {
  data: Array<{
    date: string
    [model: string]: number | string
  }>
  models: string[]
}

const colors = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
]

export function PerformanceChart({ data, models }: PerformanceChartProps) {
  return (
    <Card className="w-full bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle>📈 Portfolio Value Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="date" 
              stroke="#71717a"
              tick={{ fill: '#a1a1aa' }}
            />
            <YAxis 
              stroke="#71717a"
              tick={{ fill: '#a1a1aa' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {models.map((model, index) => (
              <Line
                key={model}
                type="monotone"
                dataKey={model}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

───────────────────────────────────────────────────────────────
PHASE 5: MODEL DETAIL PAGES
───────────────────────────────────────────────────────────────

**Step 5.1: Model Detail Page (Dynamic Route)**

**File:** `frontend/app/models/[model]/page.tsx` (NEW)

**Code:**
```tsx
import { fetchModelPositions, fetchModelPerformance, fetchModelLogs } from '@/lib/api'
import { PositionTable } from '@/components/PositionTable'
import { MetricsCard } from '@/components/MetricsCard'

export default async function ModelPage({ params }: { params: { model: string } }) {
  const positionsData = await fetchModelPositions(params.model)
  const performanceData = await fetchModelPerformance(params.model)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{params.model}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricsCard 
          title="Cumulative Return"
          value={(performanceData.metrics.cumulative_return * 100).toFixed(2) + '%'}
          trend={performanceData.metrics.cumulative_return > 0 ? 'up' : 'down'}
        />
        <MetricsCard 
          title="Sharpe Ratio"
          value={performanceData.metrics.sharpe_ratio.toFixed(2)}
        />
        <MetricsCard 
          title="Max Drawdown"
          value={(performanceData.metrics.max_drawdown * 100).toFixed(2) + '%'}
          trend="down"
        />
      </div>
      
      <PositionTable positions={positionsData.positions} />
    </div>
  )
}
```

───────────────────────────────────────────────────────────────
PHASE 6: LOG VIEWER
───────────────────────────────────────────────────────────────

**Step 6.1: Log Viewer Page**

**File:** `frontend/app/logs/[model]/[date]/page.tsx` (NEW)

**Code:**
```tsx
import { fetchModelLogs } from '@/lib/api'
import { LogViewer } from '@/components/LogViewer'

export default async function LogPage({ params }: { params: { model: string, date: string } }) {
  const logsData = await fetchModelLogs(params.model, params.date)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        Trading Logs: {params.model} - {params.date}
      </h1>
      
      <LogViewer logs={logsData.logs} />
    </div>
  )
}
```

**Step 6.2: Log Viewer Component**

**File:** `frontend/components/LogViewer.tsx` (NEW)

**Code:**
```tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface LogEntry {
  timestamp: string
  signature: string
  new_messages: {
    role: string
    content: string
  } | Array<{role: string, content: string}>
}

export function LogViewer({ logs }: { logs: LogEntry[] }) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }
  
  const renderMessage = (msg: any) => {
    if (Array.isArray(msg)) {
      return msg.map((m, i) => (
        <div key={i} className="mb-2">
          <Badge variant={m.role === 'assistant' ? 'default' : 'outline'}>
            {m.role}
          </Badge>
          <p className="mt-1 text-sm">{m.content}</p>
        </div>
      ))
    } else {
      return (
        <div>
          <Badge variant={msg.role === 'assistant' ? 'default' : 'outline'}>
            {msg.role}
          </Badge>
          <p className="mt-1 text-sm">{msg.content}</p>
        </div>
      )
    }
  }
  
  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4">
        {logs.map((log, index) => (
          <Card key={index} className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-zinc-500">
                  {formatTime(log.timestamp)}
                </span>
              </div>
              {renderMessage(log.new_messages)}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
```

───────────────────────────────────────────────────────────────
PHASE 7: REAL-TIME UPDATES & POLISH
───────────────────────────────────────────────────────────────

**Step 7.1: Add Polling for Real-Time Data**

**File:** `frontend/components/Leaderboard.tsx` (MODIFY)

**Add polling hook:**
```tsx
'use client'

import { useEffect, useState } from 'react'
import { fetchLeaderboard } from '@/lib/api'

export function Leaderboard({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData)
  
  useEffect(() => {
    // Poll every 30 seconds
    const interval = setInterval(async () => {
      try {
        const newData = await fetchLeaderboard()
        setData(newData.leaderboard)
      } catch (error) {
        console.error('Failed to refresh data:', error)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    // ... existing component code
  )
}
```

───

**Step 7.2: Mobile Responsive Layout**

**File:** `frontend/app/layout.tsx` (MODIFY)

**Add mobile-first viewport and responsive nav:**
```tsx
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

<nav className="border-b border-zinc-800 mb-8">
  <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
    <h1 className="text-2xl font-bold mb-4 sm:mb-0">AI-Trader</h1>
    <div className="flex gap-4">
      <Link href="/" className="hover:text-green-500">Dashboard</Link>
      <Link href="/models" className="hover:text-green-500">Models</Link>
    </div>
  </div>
</nav>
```

───────────────────────────────────────────────────────────────
END OF IMPLEMENTATION PLAN
═══════════════════════════════════════════════════════════════
```

---

## FILES SUMMARY:

**Files to CREATE: 30**

**FastAPI Backend (7 files):**
- `api/__init__.py`
- `api/main.py`
- `api/models.py`
- `api/services.py`
- `api/config.py`
- `api/requirements.txt`
- `api/README.md`

**Next.js App (~23 files):**
- `frontend/app/page.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/models/[model]/page.tsx`
- `frontend/app/logs/[model]/[date]/page.tsx`
- `frontend/lib/api.ts`
- `frontend/lib/utils.ts`
- `frontend/components/Leaderboard.tsx`
- `frontend/components/PerformanceChart.tsx`
- `frontend/components/PositionTable.tsx`
- `frontend/components/LogViewer.tsx`
- `frontend/components/StatsGrid.tsx`
- `frontend/components/MetricsCard.tsx`
- `frontend/components/ui/` (Shadcn components - ~10 files)
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tailwind.config.ts`
- `frontend/.env.local`

**Helper Scripts (2 files):**
- `start_api.ps1` - Start FastAPI server
- `start_frontend.ps1` - Start Next.js dev server

**Files to MODIFY: 0**  
**Files to DELETE: 0**

**TOTAL IMPACT:** 30 files created

---

## ROLLBACK PLAN:

If implementation fails:

**Step 1:** Delete new directories:
```powershell
Remove-Item -Recurse -Force frontend/
Remove-Item -Recurse -Force api/
```

**Step 2:** System continues to work as before (no existing code modified)

**Step 3:** Existing `docs/index.html` still available as fallback

---

## PLAN CONFIDENCE: **HIGH**

**Reasoning:**
- Purely additive (no breaking changes possible)
- Reuses existing, tested calculation logic from `result_tools.py`
- Standard tech stack (Next.js 14 + FastAPI - both mature)
- Similar architecture to existing docs/index.html (proven pattern)
- Clear separation of concerns (backend/frontend)

---

## 🔴 I WILL NOT MAKE ANY CODE CHANGES UNTIL YOU APPROVE THIS PLAN 🔴

Excellent question! 🎯 **Yes, the FastAPI backend WILL depend on existing files.**

## 📦 Dependencies Breakdown

### **`api/services.py`** → Depends on EXISTING files:

**FILE:** `api/services.py` will import:

```python
import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# EXISTING FILES IMPORTED:
from tools.result_tools import (           # ← EXISTING
    calculate_all_metrics,
    get_daily_portfolio_values,
    get_available_date_range
)
from tools.price_tools import (            # ← EXISTING
    get_latest_position,
    all_nasdaq_100_symbols
)
```

**Why:** Reuses battle-tested calculation logic instead of duplicating it.

---

### **`api/services.py`** → Reads from EXISTING data:

```python
# Reads from EXISTING directory structure:
base_dir = Path(__file__).parent.parent
agent_data_dir = base_dir / "data" / "agent_data"  # ← EXISTING
merged_file = base_dir / "data" / "merged.jsonl"   # ← EXISTING
```

**Why:** The FastAPI server serves the data that the trading system generates.

---

### **`api/main.py`** → Minimal external dependencies:

**Imports:**
```python
from fastapi import FastAPI
from api.services import get_all_models, ...  # Only imports other NEW files
from api.models import ModelListResponse, ... # Only imports other NEW files
```

**No direct imports from existing files** - uses `services.py` as intermediary.

---

### **`api/config.py`** → Might use EXISTING .env:

```python
from dotenv import load_dotenv
import os

load_dotenv()  # ← Reads EXISTING .env file

# Could optionally read:
DATA_DIR = os.getenv("DATA_DIR", "./data")  # ← References EXISTING data/
```

**Why:** Centralized configuration from same .env file.

---

### **Other files → No dependencies:**

- `api/__init__.py` - Empty file
- `api/models.py` - Pure Pydantic models, no imports from existing code
- `api/requirements.txt` - Just package names
- `api/README.md` - Documentation only

---

## 🔗 Dependency Graph

```
api/main.py
    ↓
api/services.py
    ↓
    ├─→ tools/result_tools.py  (EXISTING - 873 lines of calculation logic)
    ├─→ tools/price_tools.py   (EXISTING - 371 lines of JSONL reading logic)
    └─→ data/agent_data/       (EXISTING - JSONL files directory)
```

---

## ✅ Why This Is Good

**Advantages:**
1. **No Code Duplication** - Reuses existing, tested functions
2. **Single Source of Truth** - Same calculation logic for CLI and API
3. **Consistent Results** - Performance metrics match across interfaces
4. **Maintainability** - Fix a bug once, benefits both systems

**No Breaking Changes:**
- API only **reads** from existing files
- Never **modifies** existing code
- Trading system continues to work independently

---

## 🎯 Updated Understanding

**The FastAPI backend is:**
- **Not standalone** - Depends on `tools/` directory
- **Read-only adapter** - Exposes existing data via REST API
- **Non-invasive** - Doesn't modify any existing functionality
- **Parallel system** - Runs alongside trading system

---

**Does this dependency structure make sense to you?** 

Want me to:
1. **Keep this approach** (reuse existing logic) ✅ Recommended
2. **Make API fully standalone** (duplicate calculation code)
3. **Different approach** (suggest alternatives)

Let me know! 🚀


