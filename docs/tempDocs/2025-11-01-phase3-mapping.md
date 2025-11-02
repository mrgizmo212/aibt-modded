# Phase 3 - Complete Integration Mapping

**Date Created:** 2025-11-01 19:55  
**Purpose:** Map ALL mock data → real API calls  
**Approach:** Component-by-component with dependencies

---

## 🎯 OVERVIEW

**Current State:** Design 2 UI working with hardcoded mock data  
**Goal:** Connect all components to real backend API  
**Components to Update:** 9 components + 1 main page

---

## 📊 COMPONENT DEPENDENCY MAP

```
app/page.tsx (Main Container)
├── NavigationSidebar (LEFT)
│   ├── DEPENDS ON: getModels(), getTradingStatus()
│   ├── CALLS: startTrading(), stopTrading()
│   └── IMPACT: Model list, toggle actions
│
├── ChatInterface (CENTER)
│   ├── DEPENDS ON: sendChatMessage(), getChatHistory()
│   ├── EMBEDS: StatsGrid, ModelCardsGrid, TradingForm, AnalysisCard
│   └── IMPACT: All embedded components
│
└── ContextPanel (RIGHT)
    ├── DEPENDS ON: getModelById(), getRuns(), getPositions()
    ├── SHOWS: Activity feed, model details, run details
    └── IMPACT: Context display based on selected item

EMBEDDED COMPONENTS:
├── StatsGrid
│   └── DEPENDS ON: getPortfolioStats(), getModels()
│
├── ModelCardsGrid
│   ├── DEPENDS ON: getModels(), getPerformance()
│   └── CALLS: startTrading(), stopTrading()
│
├── TradingForm
│   └── CALLS: startTrading()
│
└── AnalysisCard
    └── DEPENDS ON: getRunDetails()

DIALOGS:
└── ModelEditDialog
    └── CALLS: createModel(), updateModel(), deleteModel()
```

---

## 🔢 IMPLEMENTATION ORDER

### **PRIORITY 1: Core Data Fetching** (Foundation)

**These provide data for everything else - do these first:**

#### 1. NavigationSidebar
- **Current:** Hardcoded `models` array (lines 47-82)
- **Replace With:** `getModels()` from API
- **Why First:** Every other component needs model list

#### 2. StatsGrid
- **Current:** Hardcoded stats object
- **Replace With:** `getPortfolioStats()` from API
- **Why First:** Dashboard summary, independent component

---

### **PRIORITY 2: Model Operations** (CRUD)

**Enable creating and managing models:**

#### 3. ModelEditDialog
- **Current:** No API calls, just local state
- **Add:** `createModel()`, `updateModel()`, `deleteModel()`
- **Why Second:** Need to manage models before trading

#### 4. ModelCardsGrid
- **Current:** `initialModels` array + `toggleModel()` mock function
- **Replace With:** 
  - `getModels()` for data
  - `startTrading()`/`stopTrading()` for actions
- **Why Second:** Visual model management interface

---

### **PRIORITY 3: Trading Operations** (Core Functionality)

**Enable actual trading:**

#### 5. TradingForm
- **Current:** Mock trading configuration
- **Add:** `startTrading()` with mode selection
- **Why Third:** Core trading feature

#### 6. ContextPanel - Trading Status
- **Current:** Mock activity feed
- **Replace With:** `getTradingStatus()`, `getRuns()`
- **Why Third:** Show real trading activity

---

### **PRIORITY 4: Analysis & History** (Insights)

**Show trading history and analysis:**

#### 7. ContextPanel - Run Details
- **Current:** Mock run data
- **Replace With:** `getRunDetails()`, `getPositions()`
- **Why Fourth:** Analysis of past trades

#### 8. AnalysisCard
- **Current:** Hardcoded analysis
- **Replace With:** `getRunDetails()` analysis data
- **Why Fourth:** Detailed run analysis

---

### **PRIORITY 5: Chat Integration** (AI Agent)

**Connect chat to system agent:**

#### 9. ChatInterface
- **Current:** Hardcoded responses
- **Replace With:** `sendChatMessage()`, `getChatHistory()`
- **Why Last:** Most complex, depends on all other data being available

---

## 📝 DETAILED COMPONENT BREAKDOWNS

### 1. 🎯 NAVIGATION SIDEBAR

**File:** `components/navigation-sidebar.tsx`

**Current Mock Data:**
```typescript
const models = [
  {
    id: 1,
    name: "GPT-5 Momentum",
    status: "running",
    portfolio: 10234,
    return: 2.3,
    run: 5,
    lastActivity: "3 hours ago",
    tradingStyle: "day-trading",
    strategy: "momentum"
  },
  // ... more models
]
```

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { getModels, getTradingStatus, startTrading, stopTrading } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'

// 2. REPLACE HARDCODED DATA
export function NavigationSidebar({ selectedModelId, onSelectModel, onToggleModel }: NavigationSidebarProps) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [tradingStatus, setTradingStatus] = useState({})
  const { user } = useAuth()
  
  // 3. FETCH ON MOUNT
  useEffect(() => {
    loadModels()
    loadTradingStatus()
  }, [])
  
  async function loadModels() {
    try {
      const data = await getModels()
      setModels(data)
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadTradingStatus() {
    try {
      const status = await getTradingStatus()
      setTradingStatus(status)
    } catch (error) {
      console.error('Failed to load trading status:', error)
    }
  }
  
  // 4. HANDLE TOGGLE WITH REAL API
  async function handleToggle(modelId: number) {
    const isRunning = tradingStatus[modelId]?.is_running
    
    try {
      if (isRunning) {
        await stopTrading(modelId)
      } else {
        await startTrading(modelId, 'paper')
      }
      
      // Refresh status
      await loadTradingStatus()
      onToggleModel(modelId)
    } catch (error) {
      console.error('Failed to toggle trading:', error)
    }
  }
  
  // 5. RENDER WITH LOADING STATE
  if (loading) return <div>Loading models...</div>
  
  // ... rest of component
}
```

**Backend Endpoints Used:**
- ✅ `GET /api/models` → `getModels()`
- ✅ `GET /api/trading/status` → `getTradingStatus()`
- ✅ `POST /api/trading/start/:id` → `startTrading()`
- ✅ `POST /api/trading/stop/:id` → `stopTrading()`

**Testing Checklist:**
- [ ] Models load from backend on mount
- [ ] Model list displays correctly
- [ ] Can start trading (button shows "Starting...")
- [ ] Can stop trading (button shows "Stopping...")
- [ ] Trading status updates after toggle
- [ ] Empty state if no models exist
- [ ] Error handling if API fails

---

### 2. 📊 STATS GRID

**File:** `components/embedded/stats-grid.tsx`

**Current Mock Data:**
```typescript
const stats = {
  totalModels: 12,
  runsToday: 5,
  profitLoss: "+$1,234",
  capital: "$142,500"
}
```

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { getModels, getPortfolioStats } from '@/lib/api'
import { useState, useEffect } from 'react'

// 2. FETCH REAL DATA
export function StatsGrid() {
  const [stats, setStats] = useState({
    totalModels: 0,
    runsToday: 0,
    profitLoss: "$0",
    capital: "$0"
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  async function loadStats() {
    try {
      const models = await getModels()
      const portfolioStats = await getPortfolioStats()
      
      setStats({
        totalModels: models.length,
        runsToday: portfolioStats.totalRuns || 0,
        profitLoss: `${portfolioStats.totalPL >= 0 ? '+' : ''}$${portfolioStats.totalPL.toLocaleString()}`,
        capital: `$${portfolioStats.totalValue.toLocaleString()}`
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <div>Loading stats...</div>
  
  // ... rest of component
}
```

**Backend Endpoints Used:**
- ✅ `GET /api/models` → `getModels()`
- ✅ Custom aggregation → `getPortfolioStats()` (aggregates across all models)

**Testing Checklist:**
- [ ] Total models count correct
- [ ] Runs today count correct
- [ ] P/L displays with + or - sign
- [ ] Capital displays with $ formatting
- [ ] Loading state shows
- [ ] Error handling if API fails

---

### 3. 🔧 MODEL EDIT DIALOG

**File:** `components/model-edit-dialog.tsx`

**Current:** No API calls, just local state

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { createModel, updateModel, deleteModel } from '@/lib/api'
import { toast } from 'sonner'

// 2. HANDLE CREATE/UPDATE/DELETE
export function ModelEditDialog({ model, onClose, onSave, onDelete }: ModelEditDialogProps) {
  const [formData, setFormData] = useState(model || {})
  const [loading, setLoading] = useState(false)
  
  async function handleSave() {
    setLoading(true)
    
    try {
      if (model?.id) {
        // UPDATE existing model
        await updateModel(model.id, formData)
        toast.success('Model updated successfully')
      } else {
        // CREATE new model
        const newModel = await createModel(formData)
        toast.success('Model created successfully')
      }
      
      onSave()
      onClose()
    } catch (error) {
      toast.error(`Failed to ${model?.id ? 'update' : 'create'} model`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleDelete() {
    if (!model?.id) return
    
    if (confirm('Are you sure you want to delete this model?')) {
      setLoading(true)
      
      try {
        await deleteModel(model.id)
        toast.success('Model deleted successfully')
        onDelete()
        onClose()
      } catch (error) {
        toast.error('Failed to delete model')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
  }
  
  // ... rest of component with form fields
}
```

**Backend Endpoints Used:**
- ✅ `POST /api/models` → `createModel()`
- ✅ `PUT /api/models/:id` → `updateModel()`
- ✅ `DELETE /api/models/:id` → `deleteModel()`

**Testing Checklist:**
- [ ] Can create new model
- [ ] Can update existing model
- [ ] Can delete model
- [ ] Toast notifications show
- [ ] Loading states during save/delete
- [ ] Form validation works
- [ ] Model list refreshes after changes

---

### 4. 🃏 MODEL CARDS GRID

**File:** `components/embedded/model-cards-grid.tsx`

**Current Mock Data:**
```typescript
const initialModels = [
  { id: 1, name: "GPT-5 Momentum", status: "running", portfolio: 10234, return: 2.3, ... },
  { id: 2, name: "Claude Day Trader", status: "stopped", portfolio: 9876, return: -1.2, ... },
  { id: 3, name: "Gemini Long Term", status: "running", portfolio: 11500, return: 15.0, ... },
]
```

**Changes Needed:**

```typescript
// 1. REPLACE IMPORT
import { getModels, getPerformance, startTrading, stopTrading } from '@/lib/api'
// REMOVE: import { toggleModel } from '@/lib/mock-functions'

// 2. FETCH REAL DATA
export function ModelCardsGrid({ onModelSelect, onModelEdit, onMobileDetailsClick }: ModelCardsGridProps) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingModels, setLoadingModels] = useState<Set<number>>(new Set())
  
  useEffect(() => {
    loadModels()
  }, [])
  
  async function loadModels() {
    try {
      const modelList = await getModels()
      
      // Fetch performance for each model
      const modelsWithPerformance = await Promise.all(
        modelList.map(async (model) => {
          try {
            const performance = await getPerformance(model.id)
            return {
              ...model,
              portfolio: performance.portfolio_value,
              return: performance.total_return_percent,
              // ... map other fields
            }
          } catch (error) {
            return model
          }
        })
      )
      
      setModels(modelsWithPerformance)
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 3. REPLACE toggleModel() WITH REAL API
  async function handleToggleModel(modelId: number, currentStatus: "running" | "stopped") {
    setLoadingModels(prev => new Set(prev).add(modelId))
    
    try {
      if (currentStatus === "running") {
        await stopTrading(modelId)
      } else {
        await startTrading(modelId, 'paper')
      }
      
      // Refresh models
      await loadModels()
    } catch (error) {
      console.error('Failed to toggle model:', error)
    } finally {
      setLoadingModels(prev => {
        const next = new Set(prev)
        next.delete(modelId)
        return next
      })
    }
  }
  
  // ... rest of component
}
```

**Backend Endpoints Used:**
- ✅ `GET /api/models` → `getModels()`
- ✅ `GET /api/models/:id/performance` → `getPerformance()`
- ✅ `POST /api/trading/start/:id` → `startTrading()`
- ✅ `POST /api/trading/stop/:id` → `stopTrading()`

**Testing Checklist:**
- [ ] Models load with real data
- [ ] Portfolio values show correctly
- [ ] Returns show with proper +/- sign
- [ ] Can start/stop trading
- [ ] Loading states work
- [ ] Error handling if API fails

---

### 5. 💼 TRADING FORM

**File:** `components/embedded/trading-form.tsx`

**Current:** Mock form, no API calls

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { startTrading } from '@/lib/api'
import { toast } from 'sonner'

// 2. HANDLE FORM SUBMISSION
export function TradingForm({ modelId }: { modelId?: number }) {
  const [mode, setMode] = useState<'paper' | 'intraday'>('paper')
  const [loading, setLoading] = useState(false)
  
  async function handleStart() {
    if (!modelId) {
      toast.error('No model selected')
      return
    }
    
    setLoading(true)
    
    try {
      await startTrading(modelId, mode)
      toast.success(`Trading started in ${mode} mode`)
    } catch (error) {
      toast.error('Failed to start trading')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  // ... rest of component with mode selector
}
```

**Backend Endpoints Used:**
- ✅ `POST /api/trading/start/:id` → `startTrading(modelId, 'paper')`
- ✅ `POST /api/trading/start-intraday/:id` → `startTrading(modelId, 'intraday')`

**Testing Checklist:**
- [ ] Can select paper/intraday mode
- [ ] Can start trading
- [ ] Toast notifications show
- [ ] Loading state during start
- [ ] Error handling

---

### 6. 📈 CONTEXT PANEL

**File:** `components/context-panel.tsx`

**Current:** Mock activity feed, model details, run details

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { getModelById, getRuns, getRunDetails, getPositions } from '@/lib/api'

// 2. FETCH BASED ON CONTEXT
export function ContextPanel({ context, selectedModelId, onEditModel }: ContextPanelProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (context === 'model' && selectedModelId) {
      loadModelDetails()
    } else if (context === 'run' && selectedModelId) {
      loadRunDetails()
    }
  }, [context, selectedModelId])
  
  async function loadModelDetails() {
    setLoading(true)
    try {
      const model = await getModelById(selectedModelId!)
      const runs = await getRuns(selectedModelId!)
      const positions = await getPositions(selectedModelId!)
      
      setData({ model, runs, positions })
    } catch (error) {
      console.error('Failed to load model details:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadRunDetails() {
    setLoading(true)
    try {
      // Assuming we have runId from somewhere
      const runDetails = await getRunDetails(selectedModelId!, runId)
      setData(runDetails)
    } catch (error) {
      console.error('Failed to load run details:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // ... rest of component
}
```

**Backend Endpoints Used:**
- ✅ `GET /api/models/:id` → `getModelById()`
- ✅ `GET /api/models/:id/runs` → `getRuns()`
- ✅ `GET /api/models/:id/runs/:run_id` → `getRunDetails()`
- ✅ `GET /api/models/:id/positions` → `getPositions()`

**Testing Checklist:**
- [ ] Model details load correctly
- [ ] Run history shows
- [ ] Position data displays
- [ ] Loading states work
- [ ] Error handling

---

### 7. 📊 ANALYSIS CARD

**File:** `components/embedded/analysis-card.tsx`

**Current:** Hardcoded analysis data

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { getRunDetails } from '@/lib/api'

// 2. FETCH RUN ANALYSIS
export function AnalysisCard({ modelId, runId }: { modelId: number; runId: number }) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadAnalysis()
  }, [modelId, runId])
  
  async function loadAnalysis() {
    try {
      const runDetails = await getRunDetails(modelId, runId)
      setAnalysis(runDetails)
    } catch (error) {
      console.error('Failed to load analysis:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <div>Loading analysis...</div>
  
  // ... render analysis data
}
```

**Backend Endpoints Used:**
- ✅ `GET /api/models/:id/runs/:run_id` → `getRunDetails()`

**Testing Checklist:**
- [ ] Run analysis loads
- [ ] Issues display correctly
- [ ] Recommendations show
- [ ] Metrics display properly

---

### 8. 💬 CHAT INTERFACE

**File:** `components/chat-interface.tsx`

**Current:** Hardcoded responses with embedded components

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { sendChatMessage, getChatHistory } from '@/lib/api'

// 2. REPLACE MOCK CHAT
export function ChatInterface({ onContextChange, onModelSelect, onModelEdit }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentRunId, setCurrentRunId] = useState<number | null>(null)
  
  useEffect(() => {
    loadChatHistory()
  }, [])
  
  async function loadChatHistory() {
    // For now, start with welcome message
    // Later, can load from backend if we persist chat
    setMessages([{
      id: "1",
      type: "ai",
      text: "Good morning! How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    }])
  }
  
  async function handleSend() {
    if (!input.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: "user" as const,
      text: input,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    
    try {
      // Send to system agent
      const response = await sendChatMessage(
        selectedModelId || 1, // Need model context
        currentRunId || 1,    // Need run context
        input
      )
      
      // Add AI response
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        text: response.message,
        timestamp: new Date().toLocaleTimeString(),
        // Handle tool calls and embedded components
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      // Add error message
    } finally {
      setIsTyping(false)
    }
  }
  
  // ... rest of component
}
```

**Backend Endpoints Used:**
- ✅ `POST /api/models/:id/runs/:run_id/chat` → `sendChatMessage()`
- ✅ `GET /api/models/:id/runs/:run_id/chat-history` → `getChatHistory()`

**Testing Checklist:**
- [ ] Can send messages
- [ ] AI responds from backend
- [ ] Chat history persists
- [ ] Tool calls work
- [ ] Embedded components show
- [ ] Loading states work

---

### 9. 📱 MAIN PAGE STATE MANAGEMENT

**File:** `app/page.tsx`

**Current:** Basic state management, no API integration

**Changes Needed:**

```typescript
// 1. ADD IMPORTS
import { useAuth } from '@/lib/auth-context'
import { getModels } from '@/lib/api'

export default function Home() {
  const { user } = useAuth()
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null)
  const [context, setContext] = useState<"dashboard" | "model" | "run">("dashboard")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Trigger refresh across all child components
  const refreshData = () => setRefreshTrigger(prev => prev + 1)
  
  // Pass refreshData to child components so they can trigger refreshes
  
  // ... rest of component
}
```

**Purpose:** Coordinate data refreshes across components

**Testing Checklist:**
- [ ] User data from auth context works
- [ ] Can select models
- [ ] Context switches correctly
- [ ] Data refreshes propagate

---

## 🧪 TESTING STRATEGY

### Phase 3A: Core Data (Priority 1-2)
1. Test NavigationSidebar loads models
2. Test StatsGrid shows aggregated data
3. Test ModelEditDialog CRUD operations
4. Test ModelCardsGrid with real data

**Exit Criteria:** Models load, CRUD works, stats display

---

### Phase 3B: Trading Ops (Priority 3)
1. Test TradingForm starts trading
2. Test start/stop from NavigationSidebar
3. Test start/stop from ModelCardsGrid
4. Test ContextPanel shows trading status

**Exit Criteria:** Can start/stop trading, status updates

---

### Phase 3C: Analysis (Priority 4)
1. Test ContextPanel run details
2. Test AnalysisCard shows run data
3. Test position data displays

**Exit Criteria:** Run history and analysis work

---

### Phase 3D: Chat (Priority 5)
1. Test ChatInterface sends messages
2. Test AI responses from backend
3. Test embedded components in chat
4. Test tool calls work

**Exit Criteria:** Full chat integration with system agent

---

## 📋 IMPLEMENTATION CHECKLIST

### Setup
- [ ] Create test user account
- [ ] Create test models via API
- [ ] Verify backend is running
- [ ] Verify all endpoints return data

### Priority 1: Core Data
- [ ] Update NavigationSidebar with getModels()
- [ ] Update StatsGrid with getPortfolioStats()
- [ ] Test model list loads
- [ ] Test stats display

### Priority 2: Model Operations
- [ ] Update ModelEditDialog with CRUD functions
- [ ] Update ModelCardsGrid with real data
- [ ] Test create model
- [ ] Test update model
- [ ] Test delete model
- [ ] Test model cards display

### Priority 3: Trading Operations
- [ ] Update TradingForm with startTrading()
- [ ] Update toggle handlers in sidebar
- [ ] Update toggle handlers in cards
- [ ] Test start trading
- [ ] Test stop trading
- [ ] Test status updates

### Priority 4: Analysis & History
- [ ] Update ContextPanel with run data
- [ ] Update AnalysisCard with run details
- [ ] Test run history loads
- [ ] Test analysis displays
- [ ] Test position data shows

### Priority 5: Chat Integration
- [ ] Update ChatInterface with real API
- [ ] Connect to system agent
- [ ] Test message sending
- [ ] Test AI responses
- [ ] Test tool calls
- [ ] Test embedded components

### Final Testing
- [ ] End-to-end workflow test
- [ ] Error handling verification
- [ ] Loading states verification
- [ ] Mobile responsive test
- [ ] Performance check

---

## 🚀 ROLLOUT STRATEGY

**Approach:** Incremental replacement, test as we go

**Order:**
1. Replace one component
2. Test thoroughly
3. Commit changes
4. Move to next component

**Benefits:**
- Easy to rollback if issues
- Can test each piece independently
- Clear progress tracking

---

## 📊 SUCCESS CRITERIA

**Phase 3 Complete When:**
- ✅ All 9 components use real API
- ✅ No more mock data imports
- ✅ All CRUD operations work
- ✅ Trading start/stop works
- ✅ Chat connects to system agent
- ✅ Error handling in place
- ✅ Loading states work
- ✅ Data refreshes properly

---

**Ready to begin implementation?** 🎯

