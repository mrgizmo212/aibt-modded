# Phase 4: Real-Time Updates - Complete Plan

**Date Created:** 2025-11-01 20:20  
**Purpose:** Plan SSE integration for live trading events  
**Complexity:** Medium (SSE client-side, backend already has full support)

---

## 🔍 BACKEND ANALYSIS

### ✅ What Backend Has

**SSE Endpoint:** `GET /api/trading/stream/{model_id}?token=JWT_TOKEN`

**Location:** `backend/main.py` lines 1188-1238  
**Event Stream Manager:** `backend/streaming.py` (62 lines)  
**Agent Integration:** Trading agents emit events in `backend/trading/base_agent.py` and `backend/trading/agent_manager.py`

**How It Works:**
1. Client connects to `/api/trading/stream/{model_id}?token=JWT_TOKEN`
2. Backend verifies token and model ownership
3. Backend subscribes client to event queue for that model
4. Trading agent emits events during execution
5. Events streamed to client in real-time via SSE
6. Connection stays open until client disconnects

---

## 📊 EVENT TYPES & STRUCTURE

### Event Format:
```json
{
  "type": "event_type",
  "timestamp": "2025-11-01T20:00:00.123456",
  "data": {
    // Event-specific data
  }
}
```

### 1. Connection Event
```json
{
  "type": "connected",
  "timestamp": "...",
  "data": {
    "model_id": 123,
    "message": "Connected to trading stream"
  }
}
```
**When:** Initial SSE connection established  
**Frontend Action:** Show "Connected" indicator

---

### 2. Status Events
```json
{
  "type": "status",
  "timestamp": "...",
  "data": {
    "message": "Initializing AI agent..." | "Starting trading session..."
  }
}
```
**When:** Agent initialization, session start  
**Frontend Action:** Update status text, show loading indicator

**Locations Emitted:**
- `agent_manager.py` line 133: "Initializing AI agent..."
- `agent_manager.py` line 139: "Starting trading session..."

---

### 3. Trade Events
```json
{
  "type": "trade",
  "timestamp": "...",
  "data": {
    "action": "buy" | "sell" | "hold",
    "message": "AI executing BUY order..." | "AI executing SELL order..." | "AI decided to HOLD positions"
  }
}
```
**When:** AI makes trading decision  
**Frontend Action:** Show trade notification, update activity feed, refresh positions

**Locations Emitted:**
- `base_agent.py` lines 334-349: Buy/sell/hold decisions

---

### 4. Session Complete Event
```json
{
  "type": "session_complete",
  "timestamp": "...",
  "data": {
    "message": "Trading session completed"
  }
}
```
**When:** AI sends stop signal  
**Frontend Action:** Update status to "Stopped", show completion notification, refresh stats

**Locations Emitted:**
- `base_agent.py` line 358: When stop signal received

---

### 5. Complete Event
```json
{
  "type": "complete",
  "timestamp": "...",
  "data": {
    "message": "Trading session completed"
  }
}
```
**When:** Agent fully completes  
**Frontend Action:** Final status update, trigger data refresh

**Locations Emitted:**
- `agent_manager.py` line 149: Agent completion

---

### 6. Error Events
```json
{
  "type": "error",
  "timestamp": "...",
  "data": {
    "message": "Error description..."
  }
}
```
**When:** Trading error occurs  
**Frontend Action:** Show error toast, update status to "Error"

**Locations Emitted:**
- `agent_manager.py` line 157: Agent errors

---

## 🎯 FRONTEND INTEGRATION STRATEGY

### Architecture:
```
Frontend Component
├── useEffect(() => {
│   └── connectToSSE(modelId)
│       ├── Create EventSource
│       ├── Add event listener
│       ├── Handle events
│       └── Cleanup on unmount
│   })
├── State Updates
│   ├── Trading status (running/stopped)
│   ├── Activity feed (new events)
│   └── Trigger refreshes (stats, positions)
└── UI Indicators
    ├── Live badge (pulsing dot)
    ├── Event notifications (toasts)
    └── Activity stream
```

---

## 🔧 IMPLEMENTATION PLAN

### Step 1: Create SSE Hook (`hooks/use-trading-stream.ts`)

**Purpose:** Reusable React hook for SSE connections

```typescript
import { useEffect, useState } from 'react'
import { getToken } from '@/lib/auth'

interface TradingEvent {
  type: string
  timestamp: string
  data: any
}

export function useTradingStream(modelId: number | null, enabled: boolean = true) {
  const [events, setEvents] = useState<TradingEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!modelId || !enabled) return

    const token = getToken()
    if (!token) {
      setError('Not authenticated')
      return
    }

    // Create EventSource with token in URL
    const eventSource = new EventSource(
      `http://localhost:8080/api/trading/stream/${modelId}?token=${token}`
    )

    eventSource.onopen = () => {
      console.log('SSE Connected')
      setConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setEvents(prev => [...prev, data])
      } catch (e) {
        console.error('Failed to parse SSE event:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      setConnected(false)
      setError('Connection lost')
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [modelId, enabled])

  return { events, connected, error }
}
```

**Benefits:**
- Automatic connection management
- Reconnection on errors (could add)
- Event history tracking
- Type-safe events

---

### Step 2: Update NavigationSidebar

**Add live status indicators for running models**

```typescript
import { useTradingStream } from '@/hooks/use-trading-stream'

export function NavigationSidebar({ ... }) {
  const [models, setModels] = useState([])
  const [runningModelIds, setRunningModelIds] = useState<number[]>([])
  
  // Connect to SSE for all running models
  runningModelIds.forEach(modelId => {
    const { events, connected } = useTradingStream(modelId, true)
    
    // Handle events
    useEffect(() => {
      if (events.length > 0) {
        const latestEvent = events[events.length - 1]
        
        if (latestEvent.type === 'trade') {
          // Show badge or indicator
          console.log(`Model ${modelId} made trade:`, latestEvent.data.action)
        }
        
        if (latestEvent.type === 'complete' || latestEvent.type === 'session_complete') {
          // Refresh trading status
          loadTradingStatus()
        }
      }
    }, [events])
  })
  
  // ... rest of component
  
  // Show live indicator for connected streams
  {model.status === "running" && (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot" />
      <span className="text-xs text-[#10b981]">Live</span>
    </div>
  )}
}
```

**Effect:**
- Pulsing dot on running models
- Status updates in real-time
- Auto-refresh when trading completes

---

### Step 3: Update ContextPanel (Activity Feed)

**Show real-time trading events**

```typescript
import { useTradingStream } from '@/hooks/use-trading-stream'

export function ContextPanel({ context, selectedModelId }: ContextPanelProps) {
  const { events, connected } = useTradingStream(
    context === 'model' ? selectedModelId : null, 
    true
  )
  
  if (context === "dashboard") {
    // Show recent events from ALL running models
    return (
      <div>
        <h2>Recent Activity</h2>
        {events.slice(-10).reverse().map(event => (
          <div key={event.timestamp}>
            <Icon /> {/* Based on event.type */}
            <p>{event.data.message}</p>
            <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    )
  }
}
```

**Effect:**
- Live activity feed
- Trade-by-trade updates
- Status changes appear instantly

---

### Step 4: Add Global Event Notification System

**Toast notifications for important events**

```typescript
// In main app (app/page.tsx)
import { useTradingStream } from '@/hooks/use-trading-stream'
import { toast } from 'sonner'

export default function Home() {
  const [runningModels, setRunningModels] = useState<number[]>([])
  
  // Subscribe to all running models
  runningModels.forEach(modelId => {
    const { events } = useTradingStream(modelId, true)
    
    useEffect(() => {
      const latest = events[events.length - 1]
      if (!latest) return
      
      switch (latest.type) {
        case 'trade':
          toast.info(`${modelName}: ${latest.data.action.toUpperCase()}`, {
            description: latest.data.message
          })
          break
        
        case 'complete':
          toast.success(`${modelName}: Trading completed`)
          // Trigger refresh of stats
          break
        
        case 'error':
          toast.error(`${modelName}: Error`, {
            description: latest.data.message
          })
          break
      }
    }, [events])
  })
}
```

**Effect:**
- Toast notifications for trades
- Success/error notifications
- User always aware of trading activity

---

### Step 5: Auto-Refresh on Events

**Trigger data refreshes when events indicate changes**

```typescript
// In components that show data
const { events } = useTradingStream(modelId, true)

useEffect(() => {
  const latest = events[events.length - 1]
  
  if (latest?.type === 'trade') {
    // Refresh positions after trade
    loadPositions()
  }
  
  if (latest?.type === 'complete' || latest?.type === 'session_complete') {
    // Refresh everything after session complete
    loadModels()
    loadStats()
    loadPerformance()
  }
}, [events])
```

**Effect:**
- Stats update automatically
- Positions refresh after trades
- No manual refresh needed

---

## 📋 COMPONENTS TO UPDATE

### Priority 1: Core Live Indicators
1. **NavigationSidebar**
   - Live badge on running models
   - Real-time status updates
   - Auto-refresh trading status

2. **StatsGrid**
   - Auto-refresh on trade events
   - Live P/L updates
   - Active runs counter

3. **ModelCardsGrid**
   - Live indicators on cards
   - Portfolio value updates
   - Return percentage changes

---

### Priority 2: Activity & Notifications
4. **ContextPanel (Dashboard)**
   - Real-time activity feed
   - Show latest events
   - Trade notifications

5. **ContextPanel (Model)**
   - Model-specific event stream
   - Recent trades list
   - Position updates

---

### Priority 3: Global Notifications
6. **Main App (page.tsx)**
   - Global toast notifications
   - Trade alerts
   - Error notifications
   - Session completion

---

## 🧪 TESTING STRATEGY

### Test Scenarios:

**1. Start Trading Test:**
```
1. User clicks "Start Trading" on a model
2. SSE connection established
3. Event: { type: "status", data: { message: "Initializing..." } }
4. Frontend shows "Initializing..." status
5. Event: { type: "status", data: { message: "Starting trading..." } }
6. Frontend shows loading indicator
7. Event: { type: "trade", data: { action: "buy", message: "..." } }
8. Frontend shows toast notification: "BUY"
9. Frontend auto-refreshes positions
```

**2. Trading Session Test:**
```
1. Model is running
2. Multiple trade events received
3. Each trade triggers:
   - Toast notification
   - Activity feed update
   - Position refresh
4. Session complete event received
5. Frontend:
   - Shows completion toast
   - Updates status to "Stopped"
   - Refreshes all stats
   - Closes SSE connection
```

**3. Multi-Model Test:**
```
1. Multiple models running simultaneously
2. Each model has own SSE connection
3. Events from different models
4. Frontend shows all events in activity feed
5. Toast notifications for all models
6. No event mixing between models
```

**4. Reconnection Test:**
```
1. SSE connection drops (network issue)
2. Frontend detects error
3. Shows "Disconnected" indicator
4. Attempts reconnection after delay
5. Re-establishes stream
6. Continues receiving events
```

**5. Error Handling Test:**
```
1. Trading error occurs
2. Error event received
3. Frontend shows error toast
4. Updates model status
5. Allows user to retry
```

---

## 🔧 IMPLEMENTATION CHECKLIST

### Setup (5-10 minutes)
- [ ] Create `hooks/use-trading-stream.ts`
- [ ] Test SSE connection with one model
- [ ] Verify events received
- [ ] Verify token authentication works

### NavigationSidebar (5 minutes)
- [ ] Add live badge for running models
- [ ] Connect SSE for status updates
- [ ] Auto-refresh on session complete
- [ ] Test with real trading

### StatsGrid (5 minutes)
- [ ] Subscribe to trade events
- [ ] Auto-refresh stats on trades
- [ ] Update counters in real-time
- [ ] Test with multiple models

### ModelCardsGrid (5 minutes)
- [ ] Add live indicators
- [ ] Auto-refresh performance
- [ ] Show trade count updates
- [ ] Test portfolio value changes

### ContextPanel - Activity Feed (10 minutes)
- [ ] Create event list component
- [ ] Subscribe to events
- [ ] Show real-time activity
- [ ] Icon per event type
- [ ] Timestamp formatting
- [ ] Test with multiple events

### Main App - Notifications (10 minutes)
- [ ] Subscribe to all running models
- [ ] Toast on trade events
- [ ] Toast on completion
- [ ] Toast on errors
- [ ] Don't spam user (debounce if needed)

### Testing (15-20 minutes)
- [ ] Test single model trading
- [ ] Test multiple models simultaneously
- [ ] Test reconnection
- [ ] Test error handling
- [ ] Test on mobile
- [ ] Test network interruption

---

## ⚠️ CONSIDERATIONS & EDGE CASES

### 1. Authentication
**Challenge:** EventSource can't send custom headers  
**Solution:** Token in query parameter ✅ (already implemented in backend)

**Frontend Implementation:**
```typescript
const token = getToken()
const url = `${API_URL}/api/trading/stream/${modelId}?token=${token}`
const eventSource = new EventSource(url)
```

---

### 2. Multiple Models Running
**Challenge:** Each model needs separate SSE connection  
**Solution:** Create connection per running model

**Implementation:**
```typescript
const runningModels = [1, 2, 3] // IDs of running models

runningModels.forEach(modelId => {
  const { events } = useTradingStream(modelId, true)
  // Handle events for each model independently
})
```

**Limitation:** Browser limit ~6 SSE connections per domain  
**Mitigation:** Should be fine (most users won't run 6+ models simultaneously)

---

### 3. Connection Lifecycle
**Challenge:** When to connect/disconnect?

**Rules:**
- Connect: When model status changes to "running"
- Disconnect: When model stops OR component unmounts
- Reconnect: On error after 3s delay

**Implementation:**
```typescript
useEffect(() => {
  if (model.status === "running") {
    connectSSE()
  } else {
    disconnectSSE()
  }
  
  return () => disconnectSSE() // Cleanup on unmount
}, [model.status])
```

---

### 4. Event Ordering
**Challenge:** Events may arrive out of order

**Solution:** Use timestamp for sorting
```typescript
const sortedEvents = events.sort((a, b) => 
  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
)
```

---

### 5. Memory Management
**Challenge:** Event array grows infinitely

**Solution:** Keep only last N events
```typescript
const MAX_EVENTS = 100

setEvents(prev => {
  const updated = [...prev, newEvent]
  return updated.slice(-MAX_EVENTS) // Keep last 100
})
```

---

### 6. Reconnection Strategy
**Challenge:** Connection drops, need to reconnect

**Solution:** Exponential backoff
```typescript
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

eventSource.onerror = () => {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
    setTimeout(() => {
      reconnectAttempts++
      connectSSE()
    }, delay)
  }
}
```

---

### 7. Data Refresh Triggers
**Challenge:** When to refresh component data?

**Events that trigger refresh:**
- `trade` → Refresh positions
- `complete` → Refresh stats, performance, runs
- `session_complete` → Refresh everything
- `error` → Refresh trading status

**Debouncing:** Avoid refreshing too often
```typescript
const debouncedRefresh = useDebouncedCallback(() => {
  loadStats()
}, 1000) // Wait 1s after last event
```

---

## 🎨 UI/UX ENHANCEMENTS

### 1. Live Indicators

**Pulsing Dot:**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse-dot {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Live Badge:**
```tsx
{isConnected && (
  <Badge className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
    <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot mr-1.5" />
    Live
  </Badge>
)}
```

---

### 2. Event Icons

```typescript
function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'trade':
      return <TrendingUp className="w-4 h-4 text-[#10b981]" />
    case 'status':
      return <Activity className="w-4 h-4 text-[#3b82f6]" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-[#ef4444]" />
    case 'complete':
      return <CheckCircle className="w-4 h-4 text-[#10b981]" />
    default:
      return <Bot className="w-4 h-4 text-[#a3a3a3]" />
  }
}
```

---

### 3. Toast Notifications

**Configuration:**
```typescript
// Trade event
toast.info(modelName, {
  description: `${action.toUpperCase()}: ${message}`,
  icon: <TrendingUp />,
  duration: 3000
})

// Completion event
toast.success(modelName, {
  description: 'Trading session completed',
  icon: <CheckCircle />,
  duration: 5000
})

// Error event
toast.error(modelName, {
  description: message,
  icon: <AlertCircle />,
  duration: 7000
})
```

---

### 4. Connection Status Indicator

**In SystemStatusDrawer or Header:**
```tsx
{connected ? (
  <div className="flex items-center gap-2 text-[#10b981]">
    <div className="w-2 h-2 bg-[#10b981] rounded-full pulse-dot" />
    <span className="text-xs">Live Updates Active</span>
  </div>
) : (
  <div className="flex items-center gap-2 text-[#737373]">
    <div className="w-2 h-2 bg-[#737373] rounded-full" />
    <span className="text-xs">Offline</span>
  </div>
)}
```

---

## 📊 DATA FLOW

```
Backend Trading Agent
    │
    ├─ Trade Decision Made
    │  └─ emit("trade", { action: "buy", message: "..." })
    │
    ├─ Status Change
    │  └─ emit("status", { message: "Initializing..." })
    │
    └─ Session Complete
       └─ emit("complete", { message: "Completed" })
           │
           ▼
Backend SSE Endpoint (/api/trading/stream/:id?token=...)
    │
    ▼
EventSource (Frontend Hook)
    │
    ├─ Parse JSON event
    ├─ Add to events array
    └─ Trigger React state update
           │
           ▼
Frontend Components
    │
    ├─ Show toast notification
    ├─ Update activity feed
    ├─ Trigger data refresh
    └─ Update UI indicators
```

---

## 🚀 ROLLOUT STRATEGY

### Phase 4A: Foundation (30 minutes)
1. Create `use-trading-stream` hook
2. Test SSE connection with one model
3. Verify events received and parsed
4. Add connection status indicator

**Exit Criteria:** Can connect to SSE and receive events

---

### Phase 4B: Core Components (30 minutes)
1. Add live indicators to NavigationSidebar
2. Add auto-refresh to StatsGrid
3. Add live badges to ModelCardsGrid
4. Test with single running model

**Exit Criteria:** Live indicators working, data refreshes automatically

---

### Phase 4C: Activity Feed (20 minutes)
1. Update ContextPanel with event feed
2. Show recent events in real-time
3. Icon and color coding per event type
4. Test with multiple events

**Exit Criteria:** Activity feed shows live updates

---

### Phase 4D: Notifications & Polish (20 minutes)
1. Add global toast notifications
2. Configure notification rules (don't spam)
3. Add reconnection logic
4. Test multi-model scenario
5. Test error handling

**Exit Criteria:** Complete real-time experience

---

## ⚡ PERFORMANCE CONSIDERATIONS

### 1. Connection Management
- **Max Connections:** Limit to active running models only
- **Memory:** Keep only last 100 events per model
- **Cleanup:** Always close EventSource on unmount

### 2. Render Optimization
- **Debounce refreshes:** Don't refresh on every event
- **Batch updates:** Accumulate events, update every 1-2s
- **Memoization:** Use React.memo for event list items

### 3. Network Efficiency
- **Heartbeat:** Backend sends keep-alive every 30s
- **Compression:** Consider gzip for event payloads (backend)
- **Selective subscriptions:** Only subscribe to needed models

---

## 🎯 SUCCESS CRITERIA

**Phase 4 Complete When:**
- [ ] SSE hook created and tested
- [ ] Live indicators on running models
- [ ] Activity feed shows real-time events
- [ ] Toast notifications for important events
- [ ] Auto-refresh on trade events
- [ ] Auto-refresh on session complete
- [ ] Reconnection on connection loss
- [ ] Error handling in place
- [ ] Multi-model support working
- [ ] Mobile responsive
- [ ] Performance optimized (no lag)
- [ ] User confirms smooth experience

---

## 🎨 OPTIONAL ENHANCEMENTS

### Advanced Features (if time/interest):
1. **Event Timeline View** - Visual timeline of all trades
2. **Live Charts** - Recharts updating with real-time data
3. **Sound Notifications** - Audio on trades (optional toggle)
4. **Desktop Notifications** - Browser notifications API
5. **Event Filtering** - Show only certain event types
6. **Event Search** - Search through event history
7. **Export Events** - Download event log as JSON/CSV

---

## 📝 IMPLEMENTATION ORDER

**Recommended sequence:**

1. **Create Hook** (15 min)
   - `hooks/use-trading-stream.ts`
   - Test with console.log
   
2. **NavigationSidebar** (10 min)
   - Live badge
   - Test with one model

3. **StatsGrid** (10 min)
   - Auto-refresh on events
   - Test stats update

4. **ModelCardsGrid** (10 min)
   - Live indicators
   - Portfolio updates

5. **ContextPanel** (15 min)
   - Activity feed
   - Event list component

6. **Notifications** (10 min)
   - Toast on trades
   - Toast on completion

7. **Polish** (10 min)
   - Reconnection logic
   - Error handling
   - Loading states

**Total Time:** ~80 minutes

---

## 🔍 CURRENT SSE SUPPORT VERIFICATION

**Backend Has:**
- ✅ Complete SSE endpoint (`GET /api/trading/stream/:id`)
- ✅ Event stream manager (`streaming.py`)
- ✅ Event emission in agents (`base_agent.py`, `agent_manager.py`)
- ✅ Token authentication for SSE
- ✅ Proper SSE headers (Cache-Control, Connection, no-buffering)
- ✅ Event types: connected, status, trade, session_complete, complete, error
- ✅ Automatic cleanup on disconnect

**Frontend Needs:**
- ⏳ SSE client hook (`use-trading-stream.ts`)
- ⏳ Component integration
- ⏳ Event handlers
- ⏳ UI indicators

**Integration Risk:** LOW - Backend fully ready, just need frontend SSE client

---

## 🎯 FINAL VERDICT

**Phase 4 is:** ✅ **Highly Recommended**

**Reasons:**
1. Backend 100% ready (SSE endpoint exists and working)
2. Low complexity (just EventSource client-side)
3. High impact (live trading feel, professional UX)
4. Moderate time investment (~80 minutes)
5. Makes platform feel modern and responsive

**Alternative:** Skip for now, add later (platform fully functional without it)

---

**Recommended Approach:**
- Start with **Phase 4A** (Foundation - hook creation)
- Test thoroughly with one model
- Proceed to **Phase 4B-D** if foundation works
- Can stop at any point if needed

---

**Ready to implement Phase 4?** 🚀

