# AIBT Frontend - Complete Implementation Blueprint

**Date:** 2025-10-29 13:50  
**Backend:** 100% Complete & Verified (51/51 tests passed)  
**Tech Stack:** Next.js 16 LTS, React 19.2, Turbopack, Shadcn UI, Tailwind CSS  
**Deployment:** Localhost (can deploy to Vercel/Netlify later)

---

## 📋 **Table of Contents**

1. [Architecture Overview](#architecture-overview)
2. [Backend Integration Points](#backend-integration-points)
3. [File Structure Blueprint](#file-structure-blueprint)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [Component Specifications](#component-specifications)
6. [Routing & Navigation](#routing-navigation)
7. [State Management](#state-management)
8. [Styling Guide](#styling-guide)
9. [Testing Plan](#testing-plan)
10. [Deployment Guide](#deployment-guide)

---

## 🏗️ **Architecture Overview**

### **Three-Tier Frontend Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (User Interface)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Next.js 16 Frontend (Port 3000)                  │ │
│  │                                                             │ │
│  │  PUBLIC ROUTES (No Auth):                                  │ │
│  │  ├─ /login                  Login page                     │ │
│  │  └─ /signup                 Signup page                    │ │
│  │                                                             │ │
│  │  PROTECTED ROUTES (User Auth Required):                    │ │
│  │  ├─ /dashboard              User's models & stats          │ │
│  │  ├─ /models/[id]            Model detail page              │ │
│  │  ├─ /models/[id]/logs       Trading logs viewer            │ │
│  │  └─ /profile                User settings                  │ │
│  │                                                             │ │
│  │  ADMIN ROUTES (Admin Role Required):                       │ │
│  │  ├─ /admin                  Admin dashboard                │ │
│  │  ├─ /admin/users            User management                │ │
│  │  ├─ /admin/models           All models                     │ │
│  │  ├─ /admin/leaderboard      Global rankings                │ │
│  │  └─ /admin/mcp              MCP service control            │ │
│  │                                                             │ │
│  └──────────────┬──────────────────────────────────────────────┘ │
│                 │                                                 │
│                 │ HTTP REST API + WebSocket                       │
│                 ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         FastAPI Backend (Port 8080)                        │ │
│  │         ✅ 51/51 endpoints tested                          │ │
│  │         ✅ Authentication working                          │ │
│  │         ✅ User isolation enforced                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 **Backend Integration Points**

### **API Base URL:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
```

### **Authentication Flow:**
```
1. User enters credentials → POST /api/auth/login
2. Backend returns JWT token
3. Store token in localStorage
4. Include token in all API requests: Authorization: Bearer {token}
5. Refresh token on page load (check if still valid)
```

### **Available Backend Endpoints (40+):**

**Authentication:**
- `POST /api/auth/signup` - Register (whitelist-only)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user profile

**User Data:**
- `GET /api/models` - My AI models
- `POST /api/models` - Create model
- `GET /api/models/{id}/positions` - Position history (paginated)
- `GET /api/models/{id}/positions/latest` - Current position
- `GET /api/models/{id}/logs?trade_date=YYYY-MM-DD` - Trading logs
- `GET /api/models/{id}/performance` - Performance metrics

**Trading Control:**
- `POST /api/trading/start/{id}` - Start AI agent
- `POST /api/trading/stop/{id}` - Stop AI agent
- `GET /api/trading/status/{id}` - Get status
- `GET /api/trading/status` - All running agents

**Admin (Admin Role Required):**
- `GET /api/admin/users` - All users
- `GET /api/admin/models` - All models (all users)
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/leaderboard` - Global leaderboard
- `PUT /api/admin/users/{id}/role?new_role=admin` - Change role
- `POST /api/mcp/start` - Start MCP services
- `POST /api/mcp/stop` - Stop MCP services
- `GET /api/mcp/status` - MCP status

**Public:**
- `GET /api/stock-prices?symbol=AAPL` - Stock data

### **Response Formats (Verified from Backend):**

**Login Response:**
```typescript
{
  access_token: string
  token_type: "bearer"
  user: {
    id: string
    email: string
    role: "admin" | "user"
  }
}
```

**User Profile:**
```typescript
{
  id: string
  email: string
  role: "admin" | "user"
  display_name: string | null
  avatar_url: string | null
  created_at: string
}
```

**Model Object:**
```typescript
{
  id: number
  user_id: string
  name: string
  signature: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}
```

**Position Object:**
```typescript
{
  id: number
  model_id: number
  date: string
  action_id: number
  action_type: "buy" | "sell" | "no_trade"
  symbol: string | null
  amount: number | null
  positions: Record<string, number>  // Stock holdings + CASH
  cash: number
  created_at: string
}
```

**Trading Status:**
```typescript
{
  model_id: number
  status: "not_running" | "initializing" | "running" | "completed" | "stopped" | "failed"
  started_at?: string
  stopped_at?: string
  error?: string
}
```

---

## 📁 **Complete File Structure Blueprint**

```
aibt/frontend/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout (dark theme, auth provider)
│   ├── page.tsx                 # Landing/redirect page
│   ├── globals.css              # Global styles
│   │
│   ├── (auth)/                  # Auth routes (public)
│   │   ├── layout.tsx          # Auth layout
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   └── signup/
│   │       └── page.tsx        # Signup page
│   │
│   ├── (dashboard)/            # Protected routes
│   │   ├── layout.tsx          # Dashboard layout (nav, sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx        # User dashboard (my models)
│   │   ├── models/
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Model detail
│   │   │       └── logs/
│   │   │           └── page.tsx # Log viewer
│   │   └── profile/
│   │       └── page.tsx        # User profile settings
│   │
│   └── (admin)/                # Admin routes
│       ├── layout.tsx          # Admin layout
│       └── admin/
│           ├── page.tsx        # Admin dashboard
│           ├── users/
│           │   └── page.tsx    # User management
│           ├── models/
│           │   └── page.tsx    # All models
│           ├── leaderboard/
│           │   └── page.tsx    # Global leaderboard
│           └── mcp/
│               └── page.tsx    # MCP service control
│
├── components/                  # React Components
│   ├── ui/                     # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── scroll-area.tsx
│   │   └── ... (more Shadcn components)
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx       # Login form component
│   │   └── SignupForm.tsx      # Signup form component
│   │
│   ├── dashboard/
│   │   ├── ModelCard.tsx       # Model summary card
│   │   ├── StatsGrid.tsx       # Statistics grid
│   │   ├── QuickActions.tsx    # Quick action buttons
│   │   └── RecentActivity.tsx  # Recent trading activity
│   │
│   ├── models/
│   │   ├── ModelList.tsx       # List of models
│   │   ├── PositionTable.tsx   # Position history table
│   │   ├── PerformanceChart.tsx # Line chart for portfolio value
│   │   ├── TradingControls.tsx # Start/stop buttons
│   │   └── ModelMetrics.tsx    # Performance metrics display
│   │
│   ├── logs/
│   │   ├── LogViewer.tsx       # AI reasoning log display
│   │   ├── LogEntry.tsx        # Single log entry
│   │   └── LogFilters.tsx      # Filter logs by date/type
│   │
│   ├── admin/
│   │   ├── UserTable.tsx       # User management table
│   │   ├── Leaderboard.tsx     # Global model rankings
│   │   ├── SystemStats.tsx     # System statistics
│   │   ├── MCPControl.tsx      # MCP service controls
│   │   └── RoleManager.tsx     # Change user roles
│   │
│   ├── layout/
│   │   ├── Navbar.tsx          # Top navigation
│   │   ├── Sidebar.tsx         # Side navigation
│   │   └── Footer.tsx          # Footer
│   │
│   └── shared/
│       ├── LoadingSpinner.tsx  # Loading states
│       ├── ErrorBoundary.tsx   # Error handling
│       └── ProtectedRoute.tsx  # Route protection wrapper
│
├── lib/                        # Utilities
│   ├── supabase.ts            # ✅ Already created
│   ├── api.ts                 # ✅ Already created
│   ├── auth-context.tsx       # ✅ Already created
│   ├── utils.ts               # Helper functions
│   ├── constants.ts           # Constants (colors, model names, etc.)
│   └── hooks/
│       ├── useModels.ts       # Fetch user's models
│       ├── usePositions.ts    # Fetch positions
│       ├── useTradingStatus.ts # Poll trading status
│       └── useRealtime.ts     # WebSocket connection
│
├── types/                      # TypeScript Types
│   ├── api.ts                 # API response types
│   ├── model.ts               # Model types
│   └── user.ts                # User types
│
├── .env.local                  # ✅ Already created (Supabase keys)
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind config (dark theme)
├── next.config.ts              # Next.js config (Turbopack, PPR)
└── components.json             # Shadcn UI config
```

---

## 🔨 **Phase-by-Phase Implementation**

### **PHASE 1: Project Initialization**

**Step 1.1: Initialize Next.js 16**
```powershell
cd C:\Users\User\Desktop\CS1027\aibt
npx create-next-app@latest frontend --typescript --tailwind --turbopack --app --no-src-dir --yes --import-alias "@/*"
```

**Expected:** Creates `frontend/` directory with Next.js 16 boilerplate

---

**Step 1.2: Install Dependencies**
```powershell
cd frontend

# Core Shadcn UI setup
npx shadcn@latest init

# Configure when prompted:
# - Style: New York
# - Base color: Slate  
# - CSS variables: Yes
# - Tailwind config: Yes

# Install Shadcn components
npx shadcn@latest add button card table badge input dialog tabs scroll-area select dropdown-menu

# Install additional dependencies
npm install @supabase/ssr recharts date-fns lucide-react
npm install -D @types/node
```

**Verification:**
```powershell
# Check package.json has:
# - next: ^16.0.0
# - react: ^19.2.0
# - @supabase/ssr
# - recharts
```

---

**Step 1.3: Configure Environment**

**File: `frontend/.env.local`** (✅ Already exists)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://lfewxxeiplfycmymzmjz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsImtpZCI6IktuSGVjcElNc3phUkpxZDMiLCJ0eXAiOiJKV1QifQ...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

**Step 1.4: Configure Next.js 16**

**File: `frontend/next.config.ts`**
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack enabled by default in Next.js 16
  
  // Enable Partial Pre-Rendering (PPR)
  experimental: {
    ppr: true,
  },
  
  // Strict mode
  reactStrictMode: true,
  
  // Remove powered by header
  poweredByHeader: false,
  
  // API proxy to backend (optional - can use direct fetch)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },
}

export default nextConfig
```

---

**Step 1.5: Configure Dark Theme**

**File: `frontend/app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Pure black theme */
    --background: 0 0% 0%;           /* #000000 */
    --foreground: 0 0% 100%;         /* #FFFFFF */
    
    --card: 0 0% 3.9%;               /* Very dark gray */
    --card-foreground: 0 0% 98%;
    
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    
    --primary: 142 76% 36%;          /* Green accent */
    --primary-foreground: 0 0% 98%;
    
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    
    --destructive: 0 84.2% 60.2%;    /* Red */
    --destructive-foreground: 0 0% 98%;
    
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 142 76% 36%;
    
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

### **PHASE 2: Core Infrastructure**

**Step 2.1: Create TypeScript Types**

**File: `frontend/types/api.ts`**
```typescript
// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    role: 'admin' | 'user'
  }
}

// User Types
export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  display_name?: string
  avatar_url?: string
  created_at: string
}

// Model Types
export interface Model {
  id: number
  user_id: string
  name: string
  signature: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface ModelCreateRequest {
  name: string
  signature: string
  description?: string
}

// Position Types
export interface Position {
  id: number
  model_id: number
  date: string
  action_id: number
  action_type?: 'buy' | 'sell' | 'no_trade'
  symbol?: string
  amount?: number
  positions: Record<string, number>  // Stock holdings
  cash: number
  created_at: string
}

export interface LatestPosition {
  model_id: number
  model_name: string
  date: string
  positions: Record<string, number>
  cash: number
  total_value: number
}

// Log Types
export interface LogEntry {
  id: number
  model_id: number
  date: string
  timestamp: string
  signature: string
  messages: any
  created_at: string
}

// Performance Types
export interface PerformanceMetrics {
  sharpe_ratio: number
  max_drawdown: number
  max_drawdown_start?: string
  max_drawdown_end?: string
  cumulative_return: number
  annualized_return: number
  volatility: number
  win_rate: number
  profit_loss_ratio: number
  total_trading_days: number
  initial_value: number
  final_value: number
}

// Trading Status Types
export interface TradingStatus {
  model_id: number
  status: 'not_running' | 'initializing' | 'running' | 'completed' | 'stopped' | 'failed'
  started_at?: string
  stopped_at?: string
  error?: string
  user_id?: string
  signature?: string
  basemodel?: string
  start_date?: string
  end_date?: string
}

// Admin Types
export interface SystemStats {
  total_users: number
  total_models: number
  total_positions: number
  total_logs: number
  active_models: number
  admin_count: number
  user_count: number
}

export interface LeaderboardEntry {
  rank: number
  model_id: number
  model_name: string
  user_id: string
  user_email: string
  cumulative_return: number
  sharpe_ratio: number
  max_drawdown: number
  final_value: number
  trading_days: number
}
```

---

**Step 2.2: Update API Client**

**File: `frontend/lib/api.ts`** (Expand existing)

Add TypeScript types to all functions:

```typescript
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  User,
  Model,
  ModelCreateRequest,
  Position,
  LatestPosition,
  LogEntry,
  PerformanceMetrics,
  TradingStatus,
  SystemStats,
  LeaderboardEntry
} from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  
  return response.json()
}

// Auth API
export async function signup(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function logout(): Promise<void> {
  return authFetch('/api/auth/logout', { method: 'POST' })
}

export async function getMe(): Promise<User> {
  return authFetch<User>('/api/auth/me')
}

// Model API
export async function fetchMyModels(): Promise<{ models: Model[], total_models: number }> {
  return authFetch('/api/models')
}

export async function createModel(data: ModelCreateRequest): Promise<Model> {
  return authFetch('/api/models', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function fetchModelPositions(
  modelId: number,
  page = 1,
  pageSize = 50
): Promise<{ model_id: number, model_name: string, positions: Position[], total_records: number }> {
  return authFetch(`/api/models/${modelId}/positions?page=${page}&page_size=${pageSize}`)
}

export async function fetchModelLatestPosition(modelId: number): Promise<LatestPosition> {
  return authFetch(`/api/models/${modelId}/positions/latest`)
}

export async function fetchModelLogs(
  modelId: number,
  date?: string
): Promise<{ model_id: number, model_name: string, date: string, logs: LogEntry[], total_entries: number }> {
  const query = date ? `?trade_date=${date}` : ''
  return authFetch(`/api/models/${modelId}/logs${query}`)
}

export async function fetchModelPerformance(modelId: number): Promise<any> {
  return authFetch(`/api/models/${modelId}/performance`)
}

// Trading Control API
export async function startTrading(
  modelId: number,
  basemodel: string,
  startDate: string,
  endDate: string
): Promise<TradingStatus> {
  return authFetch(`/api/trading/start/${modelId}?basemodel=${basemodel}&start_date=${startDate}&end_date=${endDate}`, {
    method: 'POST'
  })
}

export async function stopTrading(modelId: number): Promise<TradingStatus> {
  return authFetch(`/api/trading/stop/${modelId}`, { method: 'POST' })
}

export async function fetchTradingStatus(modelId: number): Promise<TradingStatus> {
  return authFetch(`/api/trading/status/${modelId}`)
}

export async function fetchAllTradingStatus(): Promise<{ running_agents: Record<number, TradingStatus>, total_running: number }> {
  return authFetch('/api/trading/status')
}

// Admin API
export async function fetchAllUsers(): Promise<{ users: User[], total_users: number }> {
  return authFetch('/api/admin/users')
}

export async function fetchAllModels(): Promise<{ models: Model[], total_models: number }> {
  return authFetch('/api/admin/models')
}

export async function fetchSystemStats(): Promise<SystemStats> {
  return authFetch('/api/admin/stats')
}

export async function fetchAdminLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[], total_models: number }> {
  return authFetch('/api/admin/leaderboard')
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<User> {
  return authFetch(`/api/admin/users/${userId}/role?new_role=${newRole}`, {
    method: 'PUT'
  })
}

// MCP API (Admin)
export async function startMCPServices(): Promise<any> {
  return authFetch('/api/mcp/start', { method: 'POST' })
}

export async function stopMCPServices(): Promise<any> {
  return authFetch('/api/mcp/stop', { method: 'POST' })
}

export async function fetchMCPStatus(): Promise<Record<string, any>> {
  return authFetch('/api/mcp/status')
}

// Stock Prices API (Public)
export async function fetchStockPrices(
  symbol?: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams()
  if (symbol) params.append('symbol', symbol)
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  
  const response = await fetch(`${API_BASE}/api/stock-prices${query}`)
  return response.json()
}
```

---

**Step 2.3: Create Constants**

**File: `frontend/lib/constants.ts`**
```typescript
// Model name mappings (OpenRouter → Display Name)
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'claude-4.5-sonnet': 'Claude 4.5 Sonnet',
  'google-gemini-2.5-pro': 'Gemini 2.5 Pro',
  'deepseek-deepseek-v3.2-exp': 'DeepSeek v3.2',
  'minimax-minimax-m1': 'MiniMax M1',
  'qwen3-max': 'Qwen 3 Max',
  'openai-gpt-4.1': 'GPT-4.1',
  'openai-gpt-5': 'GPT-5',
}

// Model colors for charts
export const MODEL_COLORS: Record<string, string> = {
  'claude-4.5-sonnet': '#10b981',      // Green
  'google-gemini-2.5-pro': '#3b82f6', // Blue
  'deepseek-deepseek-v3.2-exp': '#f59e0b', // Amber
  'minimax-minimax-m1': '#ef4444',    // Red
  'qwen3-max': '#8b5cf6',             // Purple
  'openai-gpt-4.1': '#ec4899',        // Pink
  'openai-gpt-5': '#06b6d4',          // Cyan
}

// Trading status colors
export const STATUS_COLORS: Record<string, string> = {
  'not_running': 'text-gray-400',
  'initializing': 'text-yellow-500',
  'running': 'text-green-500',
  'completed': 'text-blue-500',
  'stopped': 'text-gray-500',
  'failed': 'text-red-500',
}

// Available OpenRouter models for trading
export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-5', name: 'GPT-5' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'anthropic/claude-4.5-sonnet', name: 'Claude 4.5 Sonnet' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'deepseek/deepseek-v3.2-exp', name: 'DeepSeek v3.2' },
  { id: 'qwen/qwen3-max', name: 'Qwen 3 Max' },
  { id: 'minimax/minimax-m1', name: 'MiniMax M1' },
]

// Routes
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  profile: '/profile',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminModels: '/admin/models',
  adminLeaderboard: '/admin/leaderboard',
  adminMCP: '/admin/mcp',
  model: (id: number) => `/models/${id}`,
  modelLogs: (id: number) => `/models/${id}/logs`,
}
```

---

**Step 2.4: Create Utility Functions**

**File: `frontend/lib/utils.ts`** (cn function already from Shadcn)

Add these utilities:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Format percentage
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format datetime
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get color class for return value
export function getReturnColor(returnValue: number): string {
  if (returnValue > 0) return 'text-green-500'
  if (returnValue < 0) return 'text-red-500'
  return 'text-gray-400'
}

// Calculate portfolio total value
export function calculatePortfolioValue(
  positions: Record<string, number>,
  prices: Record<string, number>
): number {
  let total = positions.CASH || 0
  
  Object.entries(positions).forEach(([symbol, shares]) => {
    if (symbol !== 'CASH' && shares > 0) {
      const price = prices[symbol] || 0
      total += shares * price
    }
  })
  
  return total
}
```

---

### **PHASE 3: Authentication Pages**

**Step 3.1: Root Layout**

**File: `frontend/app/layout.tsx`**
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AIBT - AI Trading Platform',
  description: 'Autonomous AI trading with real-time monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

**Step 3.2: Login Page**

**File: `frontend/app/(auth)/login/page.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">AI Trading Platform</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-green-500 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

**Step 3.3: Signup Page**

**File: `frontend/app/(auth)/signup/page.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signup } = useAuth()
  const router = useRouter()
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    
    try {
      await signup(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      if (err.message.includes('invite-only') || err.message.includes('not approved')) {
        setError('This platform is invite-only. Your email is not on the approved list.')
      } else if (err.message.includes('already')) {
        setError('Email already registered. Please login instead.')
      } else {
        setError(err.message || 'Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Enter your email to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800"
              />
              <p className="text-xs text-gray-500">
                Only approved emails can sign up (invite-only platform)
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-green-500 hover:underline">
              Sign in
            </Link>
          </div>
          
          <div className="mt-6 p-3 bg-zinc-900 border border-zinc-800 rounded-md">
            <p className="text-xs text-gray-400 font-medium mb-1">Approved Emails:</p>
            <p className="text-xs text-gray-500">
              • adam@truetradinggroup.com (Admin)<br/>
              • samerawada92@gmail.com (User)<br/>
              • mperinotti@gmail.com (User)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### **PHASE 4: Protected Route Wrapper**

**Step 4.1: Middleware for Route Protection**

**File: `frontend/middleware.ts`**
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/models') ||
                          request.nextUrl.pathname.startsWith('/profile') ||
                          request.nextUrl.pathname.startsWith('/admin')
  
  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect to dashboard if accessing auth pages with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/models/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/signup'
  ]
}
```

---

**Step 4.2: Protected Route Component**

**File: `frontend/components/shared/ProtectedRoute.tsx`**
```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (requireAdmin && !isAdmin) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    )
  }
  
  if (!user || (requireAdmin && !isAdmin)) {
    return null
  }
  
  return <>{children}</>
}
```

---

### **PHASE 5: User Dashboard**

**Step 5.1: Dashboard Layout**

**File: `frontend/app/(dashboard)/layout.tsx`**
```tsx
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

---

**Step 5.2: Navbar Component**

**File: `frontend/components/layout/Navbar.tsx`**
```tsx
'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()
  
  async function handleLogout() {
    await logout()
    router.push('/login')
  }
  
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-green-500">
            AIBT
          </Link>
          
          <div className="hidden md:flex gap-4">
            <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white">
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-sm text-yellow-500 hover:text-yellow-400">
                Admin
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {user?.email}
            {isAdmin && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Admin</span>}
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-zinc-800"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
```

---

**Step 5.3: Sidebar Component**

**File: `frontend/components/layout/Sidebar.tsx`**
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Bot, 
  User, 
  Settings,
  Users,
  TrendingUp,
  Server
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()
  
  const userLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: User },
  ]
  
  const adminLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/models', label: 'All Models', icon: Bot },
    { href: '/admin/leaderboard', label: 'Leaderboard', icon: TrendingUp },
    { href: '/admin/mcp', label: 'MCP Services', icon: Server },
  ]
  
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 min-h-[calc(100vh-73px)]">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Main</h3>
          <nav className="space-y-1">
            {userLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive 
                      ? "bg-green-500/10 text-green-500" 
                      : "text-gray-400 hover:text-white hover:bg-zinc-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        
        {isAdmin && (
          <div>
            <h3 className="text-xs font-semibold text-yellow-500 uppercase mb-2">Admin</h3>
            <nav className="space-y-1">
              {adminLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive 
                        ? "bg-yellow-500/10 text-yellow-500" 
                        : "text-gray-400 hover:text-white hover:bg-zinc-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
}
```

---

### **PHASE 6: Dashboard Page**

**Step 6.1: Main Dashboard**

**File: `frontend/app/(dashboard)/dashboard/page.tsx`**
```tsx
import { fetchMyModels, fetchAllTradingStatus } from '@/lib/api'
import { ModelCard } from '@/components/dashboard/ModelCard'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const modelsData = await fetchMyModels()
  const tradingStatus = await fetchAllTradingStatus()
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My AI Models</h1>
          <p className="text-gray-400 mt-1">Manage your autonomous trading agents</p>
        </div>
        
        <Link href="/models/create">
          <Button className="bg-green-600 hover:bg-green-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Model
          </Button>
        </Link>
      </div>
      
      <StatsGrid 
        totalModels={modelsData.total_models}
        runningAgents={tradingStatus.total_running}
      />
      
      <QuickActions />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modelsData.models.map((model) => {
          const status = tradingStatus.running_agents[model.id]
          
          return (
            <ModelCard
              key={model.id}
              model={model}
              tradingStatus={status}
            />
          )
        })}
        
        {modelsData.models.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
            <Bot className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No models yet</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first AI trading model to get started</p>
            <Link href="/models/create">
              <Button className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Model
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

**Step 6.2: Dashboard Components**

**File: `frontend/components/dashboard/ModelCard.tsx`**
```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, TrendingUp, DollarSign, Play, Square } from 'lucide-react'
import Link from 'next/link'
import type { Model, TradingStatus } from '@/types/api'
import { MODEL_DISPLAY_NAMES, STATUS_COLORS } from '@/lib/constants'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface ModelCardProps {
  model: Model
  tradingStatus?: TradingStatus
}

export function ModelCard({ model, tradingStatus }: ModelCardProps) {
  const displayName = MODEL_DISPLAY_NAMES[model.signature] || model.name
  const isRunning = tradingStatus?.status === 'running'
  
  return (
    <Card className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-green-500" />
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <p className="text-xs text-gray-500">{model.signature}</p>
            </div>
          </div>
          
          {model.is_active && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trading Status */}
        {tradingStatus && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Status:</span>
            <span className={STATUS_COLORS[tradingStatus.status]}>
              {tradingStatus.status.replace('_', ' ')}
            </span>
          </div>
        )}
        
        {/* Description */}
        {model.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{model.description}</p>
        )}
        
        {/* Created Date */}
        <p className="text-xs text-gray-500">
          Created {formatDateTime(model.created_at)}
        </p>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link href={`/models/${model.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-zinc-800">
              View Details
            </Button>
          </Link>
          
          {isRunning ? (
            <Button size="sm" variant="destructive" className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              Stop
            </Button>
          ) : (
            <Button size="sm" className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
              <Play className="w-3 h-3" />
              Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

**File: `frontend/components/dashboard/StatsGrid.tsx`**
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Bot, Activity, TrendingUp, DollarSign } from 'lucide-react'

interface StatsGridProps {
  totalModels: number
  runningAgents: number
}

export function StatsGrid({ totalModels, runningAgents }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Bot className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Models</p>
              <p className="text-2xl font-bold">{totalModels}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Running</p>
              <p className="text-2xl font-bold">{runningAgents}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold">{totalModels}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Capital</p>
              <p className="text-2xl font-bold">${(totalModels * 10000).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

**File: `frontend/components/dashboard/QuickActions.tsx`**
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Play, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Link href="/models/create">
            <Button className="bg-green-600 hover:bg-green-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Model
            </Button>
          </Link>
          
          <Button variant="outline" className="border-zinc-800">
            <Play className="w-4 h-4 mr-2" />
            Start All
          </Button>
          
          <Button variant="outline" className="border-zinc-800">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### **PHASE 7: Model Detail Page**

**Step 7.1: Model Detail View**

**File: `frontend/app/(dashboard)/models/[id]/page.tsx`**
```tsx
import { fetchModelPositions, fetchModelLatestPosition, fetchModelPerformance, fetchTradingStatus } from '@/lib/api'
import { PositionTable } from '@/components/models/PositionTable'
import { PerformanceChart } from '@/components/models/PerformanceChart'
import { ModelMetrics } from '@/components/models/ModelMetrics'
import { TradingControls } from '@/components/models/TradingControls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ModelDetailPage({ params }: { params: { id: string } }) {
  const modelId = parseInt(params.id)
  
  const [positionsData, latestPosition, tradingStatus] = await Promise.all([
    fetchModelPositions(modelId),
    fetchModelLatestPosition(modelId),
    fetchTradingStatus(modelId),
  ])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bot className="w-10 h-10 text-green-500" />
          <div>
            <h1 className="text-3xl font-bold">{positionsData.model_name}</h1>
            <p className="text-gray-400">Model ID: {modelId}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/models/${modelId}/logs`}>
            <Button variant="outline" className="border-zinc-800">
              View Logs
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Trading Controls */}
      <TradingControls modelId={modelId} currentStatus={tradingStatus} />
      
      {/* Current Portfolio */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle>Current Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Cash</p>
              <p className="text-2xl font-bold text-green-500">
                ${latestPosition.cash.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Value</p>
              <p className="text-2xl font-bold">
                ${latestPosition.total_value.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Last Updated</p>
              <p className="text-lg">{latestPosition.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Holdings</p>
              <p className="text-lg">
                {Object.entries(latestPosition.positions).filter(([k,v]) => k !== 'CASH' && v > 0).length} stocks
              </p>
            </div>
          </div>
          
          {/* Top Holdings */}
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Top Holdings:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(latestPosition.positions)
                .filter(([symbol, shares]) => symbol !== 'CASH' && shares > 0)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([symbol, shares]) => (
                  <Badge key={symbol} variant="outline" className="bg-zinc-900 border-zinc-800">
                    {symbol}: {shares}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList className="bg-zinc-900">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="positions">
          <PositionTable positions={positionsData.positions} />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceChart modelId={modelId} />
        </TabsContent>
        
        <TabsContent value="holdings">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle>Stock Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Holdings breakdown */}
              <div className="space-y-2">
                {Object.entries(latestPosition.positions)
                  .filter(([symbol, shares]) => symbol !== 'CASH' && shares > 0)
                  .sort(([,a], [,b]) => b - a)
                  .map(([symbol, shares]) => (
                    <div key={symbol} className="flex justify-between items-center py-2 border-b border-zinc-900">
                      <span className="font-medium">{symbol}</span>
                      <span className="text-gray-400">{shares} shares</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

### **PHASE 8: Model Management Components**

**File: `frontend/components/models/PositionTable.tsx`**
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
import type { Position } from '@/types/api'
import { formatDate, formatCurrency } from '@/lib/utils'

interface PositionTableProps {
  positions: Position[]
}

export function PositionTable({ positions }: PositionTableProps) {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle>Trading History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-zinc-900">
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Cash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.slice(0, 50).map((position) => (
                <TableRow key={position.id} className="hover:bg-zinc-900">
                  <TableCell className="font-medium">
                    {formatDate(position.date)}
                  </TableCell>
                  <TableCell>
                    {position.action_type && (
                      <Badge variant={
                        position.action_type === 'buy' ? 'default' :
                        position.action_type === 'sell' ? 'destructive' :
                        'outline'
                      }>
                        {position.action_type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {position.symbol || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {position.amount || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-500">
                    {formatCurrency(position.cash)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {positions.length > 50 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Showing latest 50 of {positions.length} positions
          </p>
        )}
        
        {positions.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No trading history yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

---

**File: `frontend/components/models/TradingControls.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Play, Square, Settings } from 'lucide-react'
import { startTrading, stopTrading } from '@/lib/api'
import { AVAILABLE_MODELS } from '@/lib/constants'
import type { TradingStatus } from '@/types/api'

interface TradingControlsProps {
  modelId: number
  currentStatus: TradingStatus
}

export function TradingControls({ modelId, currentStatus }: TradingControlsProps) {
  const [baseModel, setBaseModel] = useState('openai/gpt-4o')
  const [startDate, setStartDate] = useState('2025-10-29')
  const [endDate, setEndDate] = useState('2025-10-30')
  const [loading, setLoading] = useState(false)
  
  const isRunning = currentStatus.status === 'running' || currentStatus.status === 'initializing'
  
  async function handleStart() {
    setLoading(true)
    try {
      await startTrading(modelId, baseModel, startDate, endDate)
      // Refresh page or update status
      window.location.reload()
    } catch (error: any) {
      alert(`Failed to start: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  async function handleStop() {
    setLoading(true)
    try {
      await stopTrading(modelId)
      // Refresh page or update status
      window.location.reload()
    } catch (error: any) {
      alert(`Failed to stop: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Trading Controls
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Status:</span>
            <span className={`text-sm font-medium ${
              isRunning ? 'text-green-500' : 'text-gray-500'
            }`}>
              {currentStatus.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select value={baseModel} onValueChange={setBaseModel} disabled={isRunning}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isRunning}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isRunning}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          {isRunning ? (
            <Button
              onClick={handleStop}
              disabled={loading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              {loading ? 'Stopping...' : 'Stop Trading'}
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Starting...' : 'Start Trading'}
            </Button>
          )}
        </div>
        
        {currentStatus.started_at && (
          <div className="text-sm text-gray-400">
            Started: {new Date(currentStatus.started_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### **PHASE 9: Admin Dashboard**

**File: `frontend/app/(admin)/admin/page.tsx`**
```tsx
import { fetchSystemStats, fetchAdminLeaderboard } from '@/lib/api'
import { SystemStats } from '@/components/admin/SystemStats'
import { Leaderboard } from '@/components/admin/Leaderboard'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

export default async function AdminDashboardPage() {
  const [stats, leaderboard] = await Promise.all([
    fetchSystemStats(),
    fetchAdminLeaderboard()
  ])
  
  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">System overview and management</p>
        </div>
        
        <SystemStats stats={stats} />
        
        <Leaderboard data={leaderboard.leaderboard} />
      </div>
    </ProtectedRoute>
  )
}
```

---

**File: `frontend/components/admin/Leaderboard.tsx`**
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
import type { LeaderboardEntry } from '@/types/api'
import { formatPercent, formatCurrency } from '@/lib/utils'

interface LeaderboardProps {
  data: LeaderboardEntry[]
}

export function Leaderboard({ data }: LeaderboardProps) {
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
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl">🏆 Global Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Rank</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Return</TableHead>
              <TableHead className="text-right">Sharpe</TableHead>
              <TableHead className="text-right">Max DD</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Days</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.model_id} className="hover:bg-zinc-900">
                <TableCell className="font-bold text-lg">
                  {getMedalEmoji(entry.rank)}
                </TableCell>
                <TableCell className="font-medium">{entry.model_name}</TableCell>
                <TableCell className="text-sm text-gray-400">{entry.user_email}</TableCell>
                <TableCell className={`text-right font-bold ${getReturnColor(entry.cumulative_return)}`}>
                  {formatPercent(entry.cumulative_return)}
                </TableCell>
                <TableCell className="text-right">
                  {entry.sharpe_ratio.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-red-400">
                  {formatPercent(entry.max_drawdown)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(entry.final_value)}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-400">
                  {entry.trading_days}
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

---

### **PHASE 10: Build & Deployment**

**Step 10.1: Build Script**

**File: `frontend/package.json`** (add scripts)
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build --turbo",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

---

**Step 10.2: Start Development**

```powershell
cd frontend
npm run dev
```

**Opens on:** http://localhost:3000

---

### **PHASE 11: Testing Checklist**

**Frontend Testing:**

**✅ Authentication Flow:**
1. Visit http://localhost:3000
2. Should redirect to /login
3. Login with samerawada92@gmail.com / testpass456
4. Should redirect to /dashboard
5. Should see navbar with email + logout button
6. Logout should work and redirect to /login

**✅ User Dashboard:**
1. Should see "My AI Models"
2. Should display user's models only
3. Each model shows: name, status, actions
4. Create Model button visible
5. Can navigate to model details

**✅ Model Detail:**
1. Click on a model
2. Should show current position
3. Should show trading history table
4. Trading controls visible
5. Can start/stop trading
6. Logs link works

**✅ Admin Dashboard (login as adam@truetradinggroup.com):**
1. Admin menu visible in sidebar
2. Can access /admin
3. Shows system statistics
4. Shows global leaderboard with ALL models
5. Can access user management
6. Can access MCP control

**✅ Security:**
1. Regular user CANNOT access /admin (redirected)
2. Unauthenticated CANNOT access /dashboard (redirected to login)
3. Users only see own models
4. Privacy enforced

---

### **PHASE 12: Mobile Responsiveness**

**Breakpoints:**
```css
/* Tailwind breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

**Mobile-First Classes:**
- Use `flex-col` then `md:flex-row`
- Use `grid-cols-1` then `md:grid-cols-2` then `lg:grid-cols-3`
- Hide sidebar on mobile, show hamburger menu
- Stack cards vertically on mobile

---

### **IMPLEMENTATION CHECKLIST**

**Phase 1: Setup** (1-2 hours)
- [ ] Initialize Next.js 16
- [ ] Install dependencies
- [ ] Configure dark theme
- [ ] Setup Shadcn UI

**Phase 2: Infrastructure** (30 mins)
- [ ] Create TypeScript types
- [ ] Update API client
- [ ] Add constants
- [ ] Add utilities

**Phase 3: Auth** (1 hour)
- [ ] Login page
- [ ] Signup page
- [ ] Auth context (already done)
- [ ] Protected routes

**Phase 4: Layouts** (1 hour)
- [ ] Root layout
- [ ] Dashboard layout
- [ ] Navbar
- [ ] Sidebar

**Phase 5: Dashboard** (2 hours)
- [ ] Dashboard page
- [ ] Model cards
- [ ] Stats grid
- [ ] Quick actions

**Phase 6: Model Pages** (2-3 hours)
- [ ] Model detail page
- [ ] Position table
- [ ] Trading controls
- [ ] Performance chart
- [ ] Log viewer

**Phase 7: Admin** (2 hours)
- [ ] Admin dashboard
- [ ] Leaderboard
- [ ] User management
- [ ] MCP control

**Phase 8: Polish** (1 hour)
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsive
- [ ] Animations

**Total Estimated: 10-12 hours of focused implementation**

---

## 🎯 **Success Criteria**

**Frontend is complete when:**
1. ✅ Can login/signup
2. ✅ User dashboard shows own models
3. ✅ Can create models
4. ✅ Can view model details
5. ✅ Can start/stop trading
6. ✅ Admin can see all data
7. ✅ Privacy enforced (users isolated)
8. ✅ Mobile responsive
9. ✅ Dark theme throughout
10. ✅ No console errors

---

## 📚 **Complete File List to Create**

**Total Files: ~40**

**Core (5 files):**
- app/layout.tsx
- app/page.tsx
- app/globals.css
- middleware.ts
- next.config.ts

**Auth Pages (4 files):**
- app/(auth)/layout.tsx
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx
- app/(auth)/loading.tsx

**Dashboard (8 files):**
- app/(dashboard)/layout.tsx
- app/(dashboard)/dashboard/page.tsx
- app/(dashboard)/models/[id]/page.tsx
- app/(dashboard)/models/[id]/logs/page.tsx
- app/(dashboard)/models/create/page.tsx
- app/(dashboard)/profile/page.tsx
- components/dashboard/ModelCard.tsx
- components/dashboard/StatsGrid.tsx
- components/dashboard/QuickActions.tsx

**Model Components (5 files):**
- components/models/PositionTable.tsx
- components/models/PerformanceChart.tsx
- components/models/TradingControls.tsx
- components/models/ModelMetrics.tsx
- components/models/ModelList.tsx

**Admin (8 files):**
- app/(admin)/layout.tsx
- app/(admin)/admin/page.tsx
- app/(admin)/admin/users/page.tsx
- app/(admin)/admin/models/page.tsx
- app/(admin)/admin/leaderboard/page.tsx
- app/(admin)/admin/mcp/page.tsx
- components/admin/Leaderboard.tsx
- components/admin/SystemStats.tsx
- components/admin/UserTable.tsx
- components/admin/MCPControl.tsx

**Layout (3 files):**
- components/layout/Navbar.tsx
- components/layout/Sidebar.tsx
- components/layout/Footer.tsx

**Shared (3 files):**
- components/shared/LoadingSpinner.tsx
- components/shared/ErrorBoundary.tsx
- components/shared/ProtectedRoute.tsx

**Types (3 files):**
- types/api.ts
- types/model.ts
- types/user.ts

**Utilities (2 files):**
- lib/constants.ts
- lib/utils.ts (expand existing)

**Plus Shadcn UI components** (~10 files auto-generated)

---

**END OF COMPREHENSIVE FRONTEND BLUEPRINT**

*This document provides complete specifications for building the Next.js 16 frontend. Every file is specified with full code examples. Follow phase-by-phase for systematic implementation.*

**Ready to build!** 🚀
